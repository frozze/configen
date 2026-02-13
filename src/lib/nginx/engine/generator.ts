// ─── Nginx Config Generator — Core Engine ────────────────────────────────────
// Produces production-ready nginx configuration strings.
// Browser-compatible — no Node.js APIs.

import type {
    NginxFullConfig,
    LocationConfig,
    GenerationResult,
} from './types';
import { validateConfig } from './validator';
import { sslPresets, getCiphersForPreset } from './ssl-ciphers';

const INDENT = '    '; // 4-space indentation

function ind(level: number): string {
    return INDENT.repeat(level);
}

/**
 * Generates a complete, production-ready nginx configuration string
 * from a structured NginxFullConfig input.
 */
export function generateNginxConfig(input: NginxFullConfig): GenerationResult {
    const warnings = validateConfig(input);
    const lines: string[] = [];
    const push = (line: string) => lines.push(line);
    const blank = () => lines.push('');

    // ════════════════════════════════════════════════════════════════════════════
    // Upstream block
    // ════════════════════════════════════════════════════════════════════════════
    if (input.upstream && input.upstream.servers.length > 0) {
        push('# ─── Load Balancing ─────────────────────────────────────────────');
        push(`upstream ${input.upstream.name} {`);

        if (input.upstream.method !== 'round_robin') {
            push(`${ind(1)}${input.upstream.method};`);
        }

        for (const srv of input.upstream.servers) {
            let line = `${ind(1)}server ${srv.address}`;
            if (srv.weight && srv.weight > 1) line += ` weight=${srv.weight}`;
            if (srv.maxFails !== undefined) line += ` max_fails=${srv.maxFails}`;
            if (srv.failTimeout) line += ` fail_timeout=${srv.failTimeout}`;
            if (srv.backup) line += ' backup';
            if (srv.down) line += ' down';
            line += ';';
            push(line);
        }

        if (input.upstream.keepalive) {
            push(`${ind(1)}keepalive ${input.upstream.keepalive};`);
        }

        push('}');
        blank();
    }

    // ════════════════════════════════════════════════════════════════════════════
    // Rate limit zone (must be outside server block)
    // ════════════════════════════════════════════════════════════════════════════
    if (input.security.rateLimit?.enabled) {
        const rl = input.security.rateLimit;
        const zone = rl.zone || `$binary_remote_addr zone=req_limit:10m rate=${rl.requests}r/s`;
        push('# ─── Rate Limiting ──────────────────────────────────────────────');
        push(`limit_req_zone ${zone};`);
        blank();
    }

    // ════════════════════════════════════════════════════════════════════════════
    // HTTP → HTTPS redirect block
    // ════════════════════════════════════════════════════════════════════════════
    if (input.ssl?.enabled && input.ssl.httpRedirect) {
        push('# ─── HTTP to HTTPS Redirect ─────────────────────────────────────');
        push('server {');
        push(`${ind(1)}listen 80;`);
        if (input.server.listenIPv6) {
            push(`${ind(1)}listen [::]:80;`);
        }
        if (input.server.serverName.length > 0) {
            push(`${ind(1)}server_name ${input.server.serverName.join(' ')};`);
        }
        push(`${ind(1)}return 301 https://$server_name$request_uri;`);
        push('}');
        blank();
    }

    // ════════════════════════════════════════════════════════════════════════════
    // Main server block
    // ════════════════════════════════════════════════════════════════════════════
    push('# ─── Main Server Block ──────────────────────────────────────────');
    push('server {');

    // ── Listen directives ──
    generateListenDirectives(input, push);

    // ── Server name ──
    if (input.server.serverName.length > 0) {
        push(`${ind(1)}server_name ${input.server.serverName.join(' ')};`);
    }

    // ── Root & index ──
    if (input.server.root) {
        push(`${ind(1)}root ${input.server.root};`);
    }
    if (input.server.index && input.server.index.length > 0) {
        push(`${ind(1)}index ${input.server.index.join(' ')};`);
    }
    blank();

    // ── SSL ──
    if (input.ssl?.enabled) {
        generateSSLBlock(input, push, blank);
    }

    // ── Security ──
    generateSecurityBlock(input, push, blank);

    // ── Performance ──
    generatePerformanceBlock(input, push, blank);

    // ── Logging ──
    generateLoggingBlock(input, push, blank);

    // ── Locations ──
    const locations = input.locations.length > 0
        ? input.locations
        : [{ path: '/', matchType: 'prefix' as const, type: 'static' as const, static: { root: input.server.root || '/var/www/html', tryFiles: '$uri $uri/ =404' } }];

    push(`${ind(1)}# ─── Location Blocks ───`);
    for (const loc of locations) {
        generateLocationBlock(loc, input, push, blank);
    }

    // ── Static caching ──
    if (input.performance.staticCaching) {
        generateStaticCachingBlock(input, push, blank);
    }

    push('}');

    return {
        config: lines.join('\n'),
        warnings,
    };
}

// ─── Sub-generators ──────────────────────────────────────────────────────────

function generateListenDirectives(
    input: NginxFullConfig,
    push: (line: string) => void,
): void {
    const port = input.server.listenPort;
    const ssl = input.ssl?.enabled ? ' ssl' : '';
    const http2 = input.performance.http2 && input.ssl?.enabled ? ' http2' : '';

    push(`${ind(1)}listen ${port}${ssl}${http2};`);
    if (input.server.listenIPv6) {
        push(`${ind(1)}listen [::]:${port}${ssl}${http2};`);
    }
}

function generateSSLBlock(
    input: NginxFullConfig,
    push: (line: string) => void,
    blank: () => void,
): void {
    const ssl = input.ssl!;
    const preset = sslPresets[ssl.preset];

    push(`${ind(1)}# ─── SSL Configuration ───`);
    push(`${ind(1)}ssl_certificate ${ssl.certPath || '/etc/ssl/certs/cert.pem'};`);
    push(`${ind(1)}ssl_certificate_key ${ssl.keyPath || '/etc/ssl/private/key.pem'};`);
    push(`${ind(1)}ssl_protocols ${ssl.protocols.join(' ')};`);

    const ciphers = ssl.ciphers || getCiphersForPreset(ssl.preset);
    if (ciphers) {
        push(`${ind(1)}ssl_ciphers '${ciphers}';`);
    }
    push(`${ind(1)}ssl_prefer_server_ciphers ${preset.preferServerCiphers ? 'on' : 'off'};`);

    // Session settings
    push(`${ind(1)}ssl_session_timeout ${preset.sessionTimeout};`);
    push(`${ind(1)}ssl_session_cache shared:SSL:10m;`);
    push(`${ind(1)}ssl_session_tickets ${preset.sessionTickets ? 'on' : 'off'};`);

    // DH parameters
    if (ssl.dhParamPath) {
        push(`${ind(1)}ssl_dhparam ${ssl.dhParamPath};`);
    }

    // HSTS
    if (ssl.hsts) {
        const maxAge = ssl.hstsMaxAge ?? 63072000;
        push(`${ind(1)}add_header Strict-Transport-Security "max-age=${maxAge}; includeSubDomains; preload" always;`);
    }

    // OCSP Stapling
    if (ssl.ocspStapling) {
        push(`${ind(1)}ssl_stapling on;`);
        push(`${ind(1)}ssl_stapling_verify on;`);
    }

    blank();
}

function generateSecurityBlock(
    input: NginxFullConfig,
    push: (line: string) => void,
    blank: () => void,
): void {
    const sec = input.security;
    const headers = sec.securityHeaders;
    const hasAnything = !sec.serverTokens || headers.xContentTypeOptions ||
        headers.xFrameOptions || headers.referrerPolicy ||
        headers.contentSecurityPolicy || headers.permissionsPolicy ||
        sec.ipAllowlist?.length || sec.ipDenylist?.length || sec.basicAuth;

    if (!hasAnything) return;

    push(`${ind(1)}# ─── Security ───`);

    if (!sec.serverTokens) {
        push(`${ind(1)}server_tokens off;`);
    }

    if (headers.xFrameOptions) {
        push(`${ind(1)}add_header X-Frame-Options "${headers.xFrameOptions}" always;`);
    }
    if (headers.xContentTypeOptions) {
        push(`${ind(1)}add_header X-Content-Type-Options "nosniff" always;`);
    }
    if (headers.referrerPolicy) {
        push(`${ind(1)}add_header Referrer-Policy "${headers.referrerPolicy}" always;`);
    }
    if (headers.contentSecurityPolicy) {
        push(`${ind(1)}add_header Content-Security-Policy "${headers.contentSecurityPolicy}" always;`);
    }
    if (headers.permissionsPolicy) {
        push(`${ind(1)}add_header Permissions-Policy "${headers.permissionsPolicy}" always;`);
    }

    // IP access control
    if (sec.ipAllowlist && sec.ipAllowlist.length > 0) {
        for (const ip of sec.ipAllowlist) {
            if (ip.trim()) push(`${ind(1)}allow ${ip.trim()};`);
        }
    }
    if (sec.ipDenylist && sec.ipDenylist.length > 0) {
        for (const ip of sec.ipDenylist) {
            if (ip.trim()) push(`${ind(1)}deny ${ip.trim()};`);
        }
    }

    // Basic auth
    if (sec.basicAuth) {
        push(`${ind(1)}auth_basic "${sec.basicAuth.realm}";`);
        push(`${ind(1)}auth_basic_user_file ${sec.basicAuth.htpasswdPath};`);
    }

    blank();
}

function generatePerformanceBlock(
    input: NginxFullConfig,
    push: (line: string) => void,
    blank: () => void,
): void {
    const perf = input.performance;
    const hasAnything = perf.gzip?.enabled || perf.brotli ||
        perf.clientMaxBodySize || perf.keepaliveTimeout ||
        perf.sendfile || perf.tcpNopush || perf.tcpNodelay;

    if (!hasAnything) return;

    push(`${ind(1)}# ─── Performance ───`);

    // Sendfile, tcp_nopush, tcp_nodelay
    if (perf.sendfile) push(`${ind(1)}sendfile on;`);
    if (perf.tcpNopush) push(`${ind(1)}tcp_nopush on;`);
    if (perf.tcpNodelay) push(`${ind(1)}tcp_nodelay on;`);

    // Gzip
    if (perf.gzip?.enabled) {
        push(`${ind(1)}gzip on;`);
        push(`${ind(1)}gzip_vary on;`);
        push(`${ind(1)}gzip_proxied any;`);
        push(`${ind(1)}gzip_comp_level ${perf.gzip.compLevel};`);
        push(`${ind(1)}gzip_min_length ${perf.gzip.minLength};`);
        if (perf.gzip.types.length > 0) {
            push(`${ind(1)}gzip_types ${perf.gzip.types.join(' ')};`);
        }
    }

    // Brotli
    if (perf.brotli) {
        push(`${ind(1)}brotli on;`);
        push(`${ind(1)}brotli_comp_level 6;`);
        push(`${ind(1)}brotli_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;`);
    }

    // Timeouts & body size
    if (perf.clientMaxBodySize) {
        push(`${ind(1)}client_max_body_size ${perf.clientMaxBodySize};`);
    }
    if (perf.keepaliveTimeout > 0) {
        push(`${ind(1)}keepalive_timeout ${perf.keepaliveTimeout}s;`);
    }

    blank();
}

function generateLoggingBlock(
    input: NginxFullConfig,
    push: (line: string) => void,
    blank: () => void,
): void {
    const log = input.logging;
    const hasAnything = log.accessLog.enabled || log.errorLog.enabled;
    if (!hasAnything) return;

    push(`${ind(1)}# ─── Logging ───`);

    if (log.accessLog.enabled) {
        let directive = `${ind(1)}access_log ${log.accessLog.path}`;
        if (log.accessLog.format) directive += ` ${log.accessLog.format}`;
        directive += ';';
        push(directive);
    } else {
        push(`${ind(1)}access_log off;`);
    }

    if (log.errorLog.enabled) {
        push(`${ind(1)}error_log ${log.errorLog.path} ${log.errorLog.level};`);
    }

    blank();
}

function generateLocationBlock(
    loc: LocationConfig,
    input: NginxFullConfig,
    push: (line: string) => void,
    blank: () => void,
): void {
    // Build location directive with match type
    let locationDirective: string;
    switch (loc.matchType) {
        case 'exact':
            locationDirective = `= ${loc.path}`;
            break;
        case 'regex':
            locationDirective = `~ ${loc.path}`;
            break;
        case 'regex_case_insensitive':
            locationDirective = `~* ${loc.path}`;
            break;
        case 'prefix':
        default:
            locationDirective = loc.path;
            break;
    }

    push(`${ind(1)}location ${locationDirective} {`);

    // Rate limiting inside location
    if (input.security.rateLimit?.enabled) {
        const rl = input.security.rateLimit;
        let directive = `${ind(2)}limit_req zone=req_limit burst=${rl.burst}`;
        if (rl.nodelay) directive += ' nodelay';
        directive += ';';
        push(directive);
    }

    switch (loc.type) {
        case 'static':
            generateStaticLocation(loc, push);
            break;
        case 'proxy':
            generateProxyLocation(loc, input, push);
            break;
        case 'redirect':
            if (loc.redirect) {
                push(`${ind(2)}return ${loc.redirect.code} ${loc.redirect.target};`);
            }
            break;
        case 'custom':
            if (loc.customDirectives) {
                for (const line of loc.customDirectives.split('\n')) {
                    const trimmed = line.trim();
                    if (trimmed) push(`${ind(2)}${trimmed}`);
                }
            }
            break;
    }

    push(`${ind(1)}}`);
    blank();
}

function generateStaticLocation(
    loc: LocationConfig,
    push: (line: string) => void,
): void {
    if (loc.static?.root) {
        push(`${ind(2)}root ${loc.static.root};`);
    }
    if (loc.static?.tryFiles) {
        push(`${ind(2)}try_files ${loc.static.tryFiles};`);
    }
    if (loc.static?.autoindex) {
        push(`${ind(2)}autoindex on;`);
    }
    if (loc.static?.expires) {
        push(`${ind(2)}expires ${loc.static.expires};`);
        push(`${ind(2)}add_header Cache-Control "public";`);
    }
}

function generateProxyLocation(
    loc: LocationConfig,
    input: NginxFullConfig,
    push: (line: string) => void,
): void {
    if (!loc.proxy) return;
    const proxy = loc.proxy;

    push(`${ind(2)}proxy_pass ${proxy.backendAddress};`);
    push(`${ind(2)}proxy_http_version 1.1;`);

    // WebSocket support
    if (proxy.websocket) {
        push(`${ind(2)}proxy_set_header Upgrade $http_upgrade;`);
        push(`${ind(2)}proxy_set_header Connection "upgrade";`);
    }

    // Real IP headers
    if (proxy.passRealIP) {
        push(`${ind(2)}proxy_set_header Host $host;`);
        push(`${ind(2)}proxy_set_header X-Real-IP $remote_addr;`);
        push(`${ind(2)}proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`);
        push(`${ind(2)}proxy_set_header X-Forwarded-Proto $scheme;`);
    }

    // Custom headers
    for (const [key, value] of Object.entries(proxy.customHeaders)) {
        push(`${ind(2)}proxy_set_header ${key} ${value};`);
    }

    // Timeouts
    if (proxy.proxyConnectTimeout) {
        push(`${ind(2)}proxy_connect_timeout ${proxy.proxyConnectTimeout}s;`);
    }
    if (proxy.proxyReadTimeout) {
        push(`${ind(2)}proxy_read_timeout ${proxy.proxyReadTimeout}s;`);
    }
    if (proxy.proxySendTimeout) {
        push(`${ind(2)}proxy_send_timeout ${proxy.proxySendTimeout}s;`);
    }

    // Buffering
    if (proxy.proxyBuffering === false) {
        push(`${ind(2)}proxy_buffering off;`);
    }
}

function generateStaticCachingBlock(
    input: NginxFullConfig,
    push: (line: string) => void,
    blank: () => void,
): void {
    const caching = input.performance.staticCaching!;
    push(`${ind(1)}# ─── Static Asset Caching ───`);

    if (caching.images) {
        push(`${ind(1)}location ~* \\.(jpg|jpeg|png|gif|ico|svg|webp|avif)$ {`);
        push(`${ind(2)}expires ${caching.images};`);
        push(`${ind(2)}add_header Cache-Control "public, immutable";`);
        push(`${ind(1)}}`);
        blank();
    }

    if (caching.css) {
        push(`${ind(1)}location ~* \\.css$ {`);
        push(`${ind(2)}expires ${caching.css};`);
        push(`${ind(2)}add_header Cache-Control "public";`);
        push(`${ind(1)}}`);
        blank();
    }

    if (caching.js) {
        push(`${ind(1)}location ~* \\.js$ {`);
        push(`${ind(2)}expires ${caching.js};`);
        push(`${ind(2)}add_header Cache-Control "public";`);
        push(`${ind(1)}}`);
        blank();
    }

    if (caching.fonts) {
        push(`${ind(1)}location ~* \\.(woff2?|ttf|eot|otf)$ {`);
        push(`${ind(2)}expires ${caching.fonts};`);
        push(`${ind(2)}add_header Cache-Control "public, immutable";`);
        push(`${ind(1)}}`);
        blank();
    }
}
