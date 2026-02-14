// ─── Configen — Core Engine ──────────────────────────────────────────────────
// Produces production-ready nginx configuration strings.
// Browser-compatible — no Node.js APIs.

import type {
    NginxConfig,
    LocationConfig,
    GenerationResult,
    ConfigWarning,
} from '../types';
import { validateConfig } from './validator';
import { sslPresets, getCiphersForPreset } from './ssl-ciphers';

const INDENT = '    '; // 4-space indentation

function ind(level: number): string {
    return INDENT.repeat(level);
}

/**
 * Generates a complete, production-ready nginx configuration string
 * from a structured NginxConfig input.
 */
export function generateNginxConfig(input: NginxConfig): GenerationResult {
    // Map ValidationWarning to ConfigWarning
    const validationWarnings = validateConfig(input);
    const warnings: ConfigWarning[] = validationWarnings.map(w => ({
        section: w.field,
        message: w.message
    }));

    const lines: string[] = [];
    const push = (line: string) => lines.push(line);
    const blank = () => lines.push('');

    // ════════════════════════════════════════════════════════════════════════════
    // Upstream block
    // ════════════════════════════════════════════════════════════════════════════
    if (input.upstream.enabled && input.upstream.servers.length > 0) {
        push('# ─── Load Balancing ─────────────────────────────────────────────');
        push(`upstream ${input.upstream.name} {`);

        if (input.upstream.method !== 'round-robin') {
            push(`${ind(1)}${input.upstream.method};`); // 'least_conn', 'ip_hash'
        }

        for (const srv of input.upstream.servers) {
            let line = `${ind(1)}server ${srv.address}`;
            if (srv.weight && srv.weight > 1) line += ` weight=${srv.weight}`;
            if (srv.maxFails !== undefined && srv.maxFails !== 1) line += ` max_fails=${srv.maxFails}`;
            if (srv.failTimeout && srv.failTimeout !== 10) line += ` fail_timeout=${srv.failTimeout}`;
            line += ';';
            push(line);
        }
        push('}');
        blank();
    }

    // ════════════════════════════════════════════════════════════════════════════
    // Rate limit zone
    // ════════════════════════════════════════════════════════════════════════════
    if (input.security.rateLimiting) {
        const rate = input.security.rateLimit || 10;
        const zone = `$binary_remote_addr zone=req_limit:10m rate=${rate}r/s`;
        push('# ─── Rate Limiting ──────────────────────────────────────────────');
        push(`limit_req_zone ${zone};`);
        blank();
    }

    // ════════════════════════════════════════════════════════════════════════════
    // HTTP → HTTPS redirect block
    // ════════════════════════════════════════════════════════════════════════════
    if (input.ssl.enabled && input.ssl.httpRedirect) {
        push('# ─── HTTP to HTTPS Redirect ─────────────────────────────────────');
        push('server {');
        push(`${ind(1)}listen 80;`);
        push(`${ind(1)}listen [::]:80;`); // Always include IPv6 for redirect
        if (input.serverName) {
            push(`${ind(1)}server_name ${input.serverName};`);
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
    const port = input.listenPort;
    const ssl = input.ssl.enabled ? ' ssl' : '';
    const http2 = input.performance?.http2 && input.ssl.enabled ? ' http2' : '';

    push(`${ind(1)}listen ${port}${ssl}${http2};`);
    push(`${ind(1)}listen [::]:${port}${ssl}${http2};`);

    // ── Server name ──
    if (input.serverName) {
        push(`${ind(1)}server_name ${input.serverName};`);
    }

    // ── Root & index ──
    if (input.rootPath) {
        push(`${ind(1)}root ${input.rootPath};`);
    }
    if (input.indexFiles && input.indexFiles.length > 0) {
        push(`${ind(1)}index ${input.indexFiles.join(' ')};`);
    }
    blank();

    // ── SSL ──
    if (input.ssl.enabled) {
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
        : [{
            id: 'default',
            path: '/',
            matchType: 'prefix' as const,
            type: 'static' as const,
            root: input.rootPath || '/var/www/html',
            tryFiles: '$uri $uri/ =404',
            index: '', autoindex: false,
            cacheExpiry: '', proxyPass: '', proxyWebSocket: false, proxyHeaders: [],
            redirectUrl: '', redirectCode: 301 as const, customDirectives: ''
        }];

    push(`${ind(1)}# ─── Location Blocks ───`);
    for (const loc of locations) {
        generateLocationBlock(loc, input, push, blank);
    }

    // ── Static caching (Global) ──
    if (input.performance.staticCaching) {
        // Generate regex locations for caching
        // Note: this might conflict with user defined locations if not careful.
        // Usually better to put in locations or separate include.
        // For now, implementing basic block if enabled.
        push(`${ind(1)}# ─── Static Asset Caching assuming default locations or overrides ───`);
        push(`${ind(1)}location ~* \\.(jpg|jpeg|png|gif|ico|svg|webp|avif|css|js)$ {`);
        push(`${ind(2)}expires ${input.performance.cacheExpiry || '30d'};`);
        push(`${ind(2)}add_header Cache-Control "public, no-transform";`);
        push(`${ind(1)}}`);
        blank();
    }

    // ── Custom Directives ──
    if (input.customDirectives) {
        push(`${ind(1)}# ─── Custom Directives ───`);
        input.customDirectives.split('\n').forEach(line => {
            if (line.trim()) push(`${ind(1)}${line}`);
        });
        blank();
    }

    push('}');

    return {
        config: lines.join('\n'),
        warnings,
    };
}

// ─── Sub-generators ──────────────────────────────────────────────────────────

function generateSSLBlock(
    input: NginxConfig,
    push: (line: string) => void,
    blank: () => void,
): void {
    const ssl = input.ssl;
    const preset = sslPresets[ssl.preset || 'intermediate'];

    push(`${ind(1)}# ─── SSL Configuration ───`);
    push(`${ind(1)}ssl_certificate ${ssl.certificatePath || '/etc/ssl/certs/cert.pem'};`);
    push(`${ind(1)}ssl_certificate_key ${ssl.keyPath || '/etc/ssl/private/key.pem'};`);
    push(`${ind(1)}ssl_protocols ${ssl.protocols.join(' ')};`);

    // Use preset ciphers 
    const ciphers = getCiphersForPreset(ssl.preset || 'intermediate');
    if (ciphers) {
        push(`${ind(1)}ssl_ciphers '${ciphers}';`);
    }
    push(`${ind(1)}ssl_prefer_server_ciphers ${preset.preferServerCiphers ? 'on' : 'off'};`);

    // Session settings (defaults from preset)
    push(`${ind(1)}ssl_session_timeout ${preset.sessionTimeout};`);
    push(`${ind(1)}ssl_session_cache shared:SSL:10m;`);
    push(`${ind(1)}ssl_session_tickets ${preset.sessionTickets ? 'on' : 'off'};`);

    // HSTS
    if (ssl.enableHSTS) {
        push(`${ind(1)}add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;`);
    }

    // OCSP
    if (ssl.enableOCSP) {
        push(`${ind(1)}ssl_stapling on;`);
        push(`${ind(1)}ssl_stapling_verify on;`);
    }

    blank();
}

function generateSecurityBlock(
    input: NginxConfig,
    push: (line: string) => void,
    blank: () => void,
): void {
    const sec = input.security;

    push(`${ind(1)}# ─── Security ───`);

    if (sec.hideVersion) {
        push(`${ind(1)}server_tokens off;`);
    }

    if (sec.securityHeaders) {
        push(`${ind(1)}add_header X-Frame-Options "SAMEORIGIN" always;`);
        push(`${ind(1)}add_header X-Content-Type-Options "nosniff" always;`);
        push(`${ind(1)}add_header Referrer-Policy "strict-origin-when-cross-origin" always;`);
    }

    if (sec.ipAllowlist && sec.ipAllowlist.length > 0) {
        sec.ipAllowlist.forEach(ip => {
            if (ip.trim()) push(`${ind(1)}allow ${ip.trim()};`);
        });
    }
    if (sec.ipDenylist && sec.ipDenylist.length > 0) {
        sec.ipDenylist.forEach(ip => {
            if (ip.trim()) push(`${ind(1)}deny ${ip.trim()};`);
        });
    }

    // Basic auth
    if (sec.basicAuth) {
        push(`${ind(1)}auth_basic "${sec.basicAuthRealm || 'Restricted Area'}";`);
        push(`${ind(1)}auth_basic_user_file ${sec.basicAuthFile || '/etc/nginx/.htpasswd'};`);
    }

    blank();
}

function generatePerformanceBlock(
    input: NginxConfig,
    push: (line: string) => void,
    blank: () => void,
): void {
    const perf = input.performance;

    push(`${ind(1)}# ─── Performance ───`);

    // Gzip
    if (perf.gzip) {
        push(`${ind(1)}gzip on;`);
        push(`${ind(1)}gzip_vary on;`);
        push(`${ind(1)}gzip_proxied any;`);
        if (perf.gzipTypes && perf.gzipTypes.length > 0) {
            push(`${ind(1)}gzip_types ${perf.gzipTypes.join(' ')};`);
        } else {
            push(`${ind(1)}gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;`);
        }
    }

    if (perf.brotli) {
        push(`${ind(1)}brotli on;`);
    }

    if (perf.clientMaxBodySize) {
        push(`${ind(1)}client_max_body_size ${perf.clientMaxBodySize}${perf.clientMaxBodyUnit};`);
    }

    if (perf.keepaliveTimeout) {
        push(`${ind(1)}keepalive_timeout ${perf.keepaliveTimeout}s;`);
    }

    if (perf.workerConnections) {
        // NOTE: worker_connections is a global level directive, usually in nginx.conf main block, not server block.
        // It is ignored here for server block generation or commented out.
        push(`${ind(1)}# worker_connections ${perf.workerConnections}; # (Global setting)`);
    }

    blank();
}

function generateLoggingBlock(
    input: NginxConfig,
    push: (line: string) => void,
    blank: () => void,
): void {
    const log = input.logging;
    push(`${ind(1)}# ─── Logging ───`);

    if (log.accessLog) {
        push(`${ind(1)}access_log ${log.accessLogPath || '/var/log/nginx/access.log'};`);
    } else {
        push(`${ind(1)}access_log off;`);
    }

    if (log.errorLog) {
        push(`${ind(1)}error_log ${log.errorLogPath || '/var/log/nginx/error.log'} ${log.errorLogLevel || 'error'};`);
    }

    blank();
}

function generateLocationBlock(
    loc: LocationConfig,
    input: NginxConfig,
    push: (line: string) => void,
    blank: () => void,
): void {
    // Build location directive with match type
    let locationDirective: string;
    switch (loc.matchType) {
        case 'exact': locationDirective = `= ${loc.path}`; break;
        case 'regex': locationDirective = `~ ${loc.path}`; break;
        case 'regex_case_insensitive': locationDirective = `~* ${loc.path}`; break;
        case 'prefix': default: locationDirective = loc.path; break;
    }

    push(`${ind(1)}location ${locationDirective} {`);

    // Rate limiting
    if (input.security.rateLimiting) {
        const burst = input.security.rateBurst || 5;
        push(`${ind(2)}limit_req zone=req_limit burst=${burst} nodelay;`);
    }

    switch (loc.type) {
        case 'static':
            if (loc.root) push(`${ind(2)}root ${loc.root};`);
            if (loc.tryFiles) push(`${ind(2)}try_files ${loc.tryFiles};`);
            if (loc.index) push(`${ind(2)}index ${loc.index};`);
            if (loc.autoindex) push(`${ind(2)}autoindex on;`);
            if (loc.cacheExpiry) {
                push(`${ind(2)}expires ${loc.cacheExpiry};`);
                push(`${ind(2)}add_header Cache-Control "public";`);
            }
            break;
        case 'proxy':
            if (loc.proxyPass) {
                push(`${ind(2)}proxy_pass ${loc.proxyPass};`);
                push(`${ind(2)}proxy_http_version 1.1;`);

                // Common proxy headers
                push(`${ind(2)}proxy_set_header Host $host;`);
                push(`${ind(2)}proxy_set_header X-Real-IP $remote_addr;`);
                push(`${ind(2)}proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`);
                push(`${ind(2)}proxy_set_header X-Forwarded-Proto $scheme;`);

                if (loc.proxyWebSocket) {
                    push(`${ind(2)}proxy_set_header Upgrade $http_upgrade;`);
                    push(`${ind(2)}proxy_set_header Connection "upgrade";`);
                }

                if (loc.proxyHeaders) {
                    loc.proxyHeaders.forEach(h => {
                        if (h.key && h.value) push(`${ind(2)}proxy_set_header ${h.key} ${h.value};`);
                    });
                }
            }
            break;
        case 'redirect':
            if (loc.redirectUrl) {
                push(`${ind(2)}return ${loc.redirectCode} ${loc.redirectUrl};`);
            }
            break;
        case 'custom':
            if (loc.customDirectives) {
                loc.customDirectives.split('\n').forEach(line => {
                    if (line.trim()) push(`${ind(2)}${line}`);
                });
            }
            break;
    }

    push(`${ind(1)}}`);
    blank();
}
