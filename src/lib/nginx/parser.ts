import { NginxConfig, LocationConfig, UpstreamConfig } from './types';
import { createDefaultConfig, createDefaultLocation, createDefaultUpstreamServer } from '../../stores/configStore';

// ─── 1. Tokenizer ────────────────────────────────────────────────────────────

export interface Token {
    type: 'directive' | 'block_start' | 'block_end' | 'comment' | 'semicolon';
    value?: string;
    line: number;
}

export function tokenize(raw: string): Token[] {
    const tokens: Token[] = [];
    let currentLine = 1;
    let i = 0;

    while (i < raw.length) {
        const char = raw[i];

        if (char === '\n') {
            currentLine++;
            i++;
            continue;
        }

        if (/\s/.test(char)) {
            i++;
            continue;
        }

        if (char === '#') {
            let value = '';
            i++;
            while (i < raw.length && raw[i] !== '\n') {
                value += raw[i];
                i++;
            }
            tokens.push({ type: 'comment', value: value.trim(), line: currentLine });
            continue;
        }

        if (char === '{') {
            tokens.push({ type: 'block_start', line: currentLine });
            i++;
            continue;
        }
        if (char === '}') {
            tokens.push({ type: 'block_end', line: currentLine });
            i++;
            continue;
        }
        if (char === ';') {
            tokens.push({ type: 'semicolon', line: currentLine });
            i++;
            continue;
        }

        let value = '';
        let quoted = false;
        const startQuote = char === '"' || char === "'";

        if (startQuote) {
            const quoteChar = char;
            i++;
            while (i < raw.length) {
                if (raw[i] === quoteChar && raw[i - 1] !== '\\') {
                    quoted = true;
                    i++;
                    break;
                }
                value += raw[i];
                i++;
            }
        } else {
            while (i < raw.length && !/\s|;|{|}|\n/.test(raw[i])) {
                value += raw[i];
                i++;
            }
        }

        if (value || quoted) {
            tokens.push({ type: 'directive', value, line: currentLine });
        }
    }

    return tokens;
}

// ─── 2. AST Builder ──────────────────────────────────────────────────────────

export interface NginxNode {
    type: 'directive' | 'block';
    name: string;
    args: string[];
    children?: NginxNode[];
    line: number;
}

export interface NginxAST {
    children: NginxNode[];
    errors: string[];
}

export function buildAST(tokens: Token[]): NginxAST {
    const root: NginxNode[] = [];
    const stack: NginxNode[] = [];
    const errors: string[] = [];
    let i = 0;

    while (i < tokens.length) {
        const token = tokens[i];

        if (token.type === 'comment') {
            i++;
            continue;
        }

        if (token.type === 'block_end') {
            if (stack.length === 0) {
                errors.push(`Unexpected '}' at line ${token.line}`);
            } else {
                stack.pop();
            }
            i++;
            continue;
        }

        if (token.type === 'directive') {
            const name = token.value || '';
            const args: string[] = [];
            const line = token.line;
            i++;

            while (i < tokens.length) {
                const next = tokens[i];
                if (next.type === 'directive') {
                    args.push(next.value || '');
                    i++;
                } else {
                    break;
                }
            }

            if (i < tokens.length && tokens[i].type === 'block_start') {
                const node: NginxNode = { type: 'block', name, args, children: [], line };
                if (stack.length > 0) {
                    stack[stack.length - 1].children?.push(node);
                } else {
                    root.push(node);
                }
                stack.push(node);
                i++;
            } else if (i < tokens.length && tokens[i].type === 'semicolon') {
                const node: NginxNode = { type: 'directive', name, args, line };
                if (stack.length > 0) {
                    stack[stack.length - 1].children?.push(node);
                } else {
                    root.push(node);
                }
                i++;
            } else {
                errors.push(`Unexpected token after '${name}' at line ${line}`);
                while (i < tokens.length && tokens[i].line === line) i++;
            }
        } else {
            i++;
        }
    }

    if (stack.length > 0) {
        errors.push(`Unclosed block '${stack[stack.length - 1].name}' at line ${stack[stack.length - 1].line}`);
    }

    return { children: root, errors };
}

// ─── 3. Mapper ───────────────────────────────────────────────────────────────

export interface ImportResult {
    config: NginxConfig;
    warnings: string[];
    parseErrors: string[];
}

export function astToConfig(ast: NginxAST): ImportResult {
    const config = createDefaultConfig();

    // Reset defaults that parser should overwrite if likely present
    config.locations = [];

    const warnings: string[] = [...ast.errors];
    const customDirectives: string[] = [];

    const serverBlocks = ast.children.filter(n => n.type === 'block' && n.name === 'server');
    const upstreamBlocks = ast.children.filter(n => n.type === 'block' && n.name === 'upstream');

    if (serverBlocks.length === 0) {
        return {
            config,
            warnings: [...warnings, 'No "server" block found in configuration.'],
            parseErrors: [],
        };
    }

    if (serverBlocks.length > 1) {
        warnings.push(`Found ${serverBlocks.length} server blocks. Imported the first one.`);
    }

    const serverNode = serverBlocks[0];

    if (serverNode.children) {
        serverNode.children.forEach(node => {
            if (node.type === 'directive') {
                mapServerDirective(node, config, warnings, customDirectives);
            } else if (node.type === 'block') {
                if (node.name === 'location') {
                    const loc = mapLocationBlock(node, config, warnings);
                    if (loc) config.locations.push(loc);
                } else {
                    warnings.push(`Ignored unsupported block "${node.name}" inside server.`);
                }
            }
        });
    }

    if (upstreamBlocks.length > 0) {
        if (upstreamBlocks.length > 1) {
            warnings.push(`Found ${upstreamBlocks.length} upstream blocks. Imported the first one.`);
        }
        const upNode = upstreamBlocks[0];
        if (upNode.children && upNode.args[0]) {
            config.upstream = {
                enabled: true,
                name: upNode.args[0],
                servers: [],
                method: 'round-robin',
            };

            upNode.children.forEach(node => {
                if (node.name === 'server') {
                    const address = node.args[0];
                    const server = createDefaultUpstreamServer();
                    server.address = address;

                    node.args.slice(1).forEach(arg => {
                        if (arg.startsWith('weight=')) server.weight = parseInt(arg.split('=')[1]) || 1;
                        if (arg.startsWith('max_fails=')) server.maxFails = parseInt(arg.split('=')[1]) || 1;
                        if (arg.startsWith('fail_timeout=')) server.failTimeout = parseInt(arg.split('=')[1]) || 30;
                    });
                    config.upstream!.servers.push(server);
                } else if (['least_conn', 'ip_hash', 'random'].includes(node.name)) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    config.upstream!.method = node.name as any;
                }
            });
        }
    }

    if (customDirectives.length > 0) {
        config.customDirectives = customDirectives.join('\n');
    }

    return { config, warnings, parseErrors: ast.errors };
}

function mapServerDirective(
    node: NginxNode,
    config: NginxConfig,
    warnings: string[],
    customDirectives: string[]
) {
    const { name, args } = node;

    switch (name) {
        case 'listen':
            if (args.includes('ssl')) {
                config.listen443 = true;
                config.ssl.enabled = true;
            } else {
                const port = parseInt(args[0]);
                if (!isNaN(port)) config.listenPort = port;
            }
            if (args.includes('http2')) config.performance.http2 = true;
            break;

        case 'server_name':
            config.serverName = args.join(' ');
            break;

        case 'root':
            config.rootPath = args[0];
            break;

        case 'index':
            config.indexFiles = args;
            break;

        case 'ssl_certificate':
            config.ssl.certificatePath = args[0];
            config.ssl.enabled = true;
            break;
        case 'ssl_certificate_key':
            config.ssl.keyPath = args[0];
            break;
        case 'ssl_protocols':
            config.ssl.protocols = args;
            break;
        case 'ssl_ciphers':
            if (args[0].includes('CHACHA20')) config.ssl.preset = 'modern';
            else if (args[0].includes('DES')) config.ssl.preset = 'legacy';
            else config.ssl.preset = 'intermediate';
            break;
        case 'ssl_stapling':
            config.ssl.enableOCSP = args[0] === 'on';
            break;

        case 'server_tokens':
            config.security.hideVersion = args[0] === 'off';
            break;
        case 'add_header':
            const headerName = args[0].toLowerCase();
            if (headerName === 'strict-transport-security') {
                config.ssl.enableHSTS = true;
            } else if (headerName === 'x-frame-options') {
                config.security.securityHeaders = true;
            }
            break;

        case 'gzip':
            config.performance.gzip = args[0] === 'on';
            break;
        case 'gzip_types':
            config.performance.gzipTypes = args;
            break;
        case 'client_max_body_size':
            const sizeMatch = args[0].match(/^(\d+)(k|m|g)?$/i);
            if (sizeMatch) {
                config.performance.clientMaxBodySize = parseInt(sizeMatch[1]);
                const unit = (sizeMatch[2] || 'M').toUpperCase();
                config.performance.clientMaxBodyUnit = (unit === 'G' || unit === 'GB') ? 'GB' : 'MB';
            }
            break;

        case 'access_log':
            if (args[0] === 'off') config.logging.accessLog = false;
            else {
                config.logging.accessLog = true;
                config.logging.accessLogPath = args[0];
            }
            break;
        case 'error_log':
            config.logging.errorLogPath = args[0];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (args[1]) config.logging.errorLogLevel = args[1] as any;
            break;

        default:
            config.locations.length > 0
                ? warnings.push(`Ignored directive "${name}"`)
                : customDirectives.push(`${name} ${args.join(' ')};`);
            break;
    }
}

function mapLocationBlock(
    node: NginxNode,
    config: NginxConfig,
    warnings: string[]
): LocationConfig | null {
    const loc = createDefaultLocation();
    const args = node.args;

    if (args[0] === '=') {
        loc.matchType = 'exact';
        loc.path = args[1];
    } else if (args[0] === '~') {
        loc.matchType = 'regex';
        loc.path = args[1];
    } else if (args[0] === '~*') {
        loc.matchType = 'regex_case_insensitive';
        loc.path = args[1];
    } else {
        loc.matchType = 'prefix';
        loc.path = args[0];
    }

    if (!node.children) return loc;

    node.children.forEach(child => {
        if (child.type !== 'directive') return;
        const { name, args } = child;

        switch (name) {
            case 'root':
                loc.root = args[0];
                break;
            case 'try_files':
                loc.tryFiles = args.join(' ');
                break;
            case 'index':
                loc.index = args.join(' ');
                break;
            case 'autoindex':
                loc.autoindex = args[0] === 'on';
                break;
            case 'expires':
                loc.cacheExpiry = args.join(' ');
                break;

            case 'proxy_pass':
                loc.type = 'proxy';
                loc.proxyPass = args[0];
                config.reverseProxy.enabled = true;
                break;
            case 'proxy_set_header':
                if (args[0] === 'Upgrade' && args[1] === '$http_upgrade') {
                    loc.proxyWebSocket = true;
                }
                break;

            case 'return':
                if (args[0] === '301' || args[0] === '302') {
                    loc.type = 'redirect';
                    loc.redirectCode = parseInt(args[0]) as 301 | 302;
                    loc.redirectUrl = args[1];
                }
                break;
        }
    });

    return loc;
}

export function parseNginxConfig(raw: string): ImportResult {
    const tokens = tokenize(raw);
    const ast = buildAST(tokens);
    return astToConfig(ast);
}
