// ─── Configen — Pure Function ───────────────────────────────────────────────
import type { NginxConfig, LocationConfig } from './types';

/**
 * Core pure function: takes a structured NginxConfig and returns
 * a fully formatted, production-ready nginx.conf string.
 */
export function generateNginxConfig(config: NginxConfig): string {
    const lines: string[] = [];
    const ind = (level: number) => '    '.repeat(level);

    // ── Helper: push a block of lines ──
    const push = (line: string) => lines.push(line);
    const blank = () => lines.push('');

    // ════════════════════════════════════════════════════
    // Upstream block (if load balancing is enabled)
    // ════════════════════════════════════════════════════
    if (config.upstream.enabled && config.upstream.servers.length > 0) {
        push('# ─── Load Balancing ───────────────────────────');
        push(`upstream ${config.upstream.name || 'backend'} {`);
        if (config.upstream.method !== 'round-robin') {
            push(`${ind(1)}${config.upstream.method};`);
        }
        for (const srv of config.upstream.servers) {
            let line = `${ind(1)}server ${srv.address}`;
            if (srv.weight > 1) line += ` weight=${srv.weight}`;
            if (srv.maxFails > 0) line += ` max_fails=${srv.maxFails}`;
            if (srv.failTimeout > 0) line += ` fail_timeout=${srv.failTimeout}s`;
            line += ';';
            push(line);
        }
        push('}');
        blank();
    }

    // ════════════════════════════════════════════════════
    // HTTP → HTTPS redirect block
    // ════════════════════════════════════════════════════
    if (config.ssl.enabled && config.ssl.httpRedirect) {
        push('# ─── HTTP to HTTPS Redirect ───────────────────');
        push('server {');
        push(`${ind(1)}listen 80;`);
        push(`${ind(1)}listen [::]:80;`);
        if (config.serverName) {
            push(`${ind(1)}server_name ${config.serverName};`);
        }
        push(`${ind(1)}return 301 https://$host$request_uri;`);
        push('}');
        blank();
    }

    // ════════════════════════════════════════════════════
    // Rate limiting zone (if enabled)
    // ════════════════════════════════════════════════════
    if (config.security.rateLimiting) {
        push('# ─── Rate Limiting Zone ───────────────────────');
        push(`limit_req_zone $binary_remote_addr zone=ratelimit:10m rate=${config.security.rateLimit}r/s;`);
        blank();
    }

    // ════════════════════════════════════════════════════
    // Main server block
    // ════════════════════════════════════════════════════
    push('# ─── Main Server Block ───────────────────────');
    push('server {');

    // Listen directives
    if (config.ssl.enabled) {
        push(`${ind(1)}listen ${config.listen443 ? 443 : config.listenPort} ssl${config.performance.http2 ? ' http2' : ''};`);
        push(`${ind(1)}listen [::]:${config.listen443 ? 443 : config.listenPort} ssl${config.performance.http2 ? ' http2' : ''};`);
    } else {
        push(`${ind(1)}listen ${config.listenPort};`);
        push(`${ind(1)}listen [::]:${config.listenPort};`);
    }

    // Server name
    if (config.serverName) {
        push(`${ind(1)}server_name ${config.serverName};`);
    }

    // Root & index
    if (!config.reverseProxy.enabled) {
        push(`${ind(1)}root ${config.rootPath};`);
        if (config.indexFiles.length > 0) {
            push(`${ind(1)}index ${config.indexFiles.join(' ')};`);
        }
    }
    blank();

    // ── SSL Configuration ──
    if (config.ssl.enabled) {
        push(`${ind(1)}# ─── SSL Configuration ───`);
        push(`${ind(1)}ssl_certificate ${config.ssl.certificatePath || '/etc/ssl/certs/cert.pem'};`);
        push(`${ind(1)}ssl_certificate_key ${config.ssl.keyPath || '/etc/ssl/private/key.pem'};`);
        push(`${ind(1)}ssl_protocols ${config.ssl.protocols.join(' ')};`);

        // Cipher suites based on preset
        if (config.ssl.preset === 'modern') {
            push(`${ind(1)}ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';`);
        } else if (config.ssl.preset === 'intermediate') {
            push(`${ind(1)}ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384';`);
        } else {
            push(`${ind(1)}ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA256';`);
        }
        push(`${ind(1)}ssl_prefer_server_ciphers on;`);

        if (config.ssl.enableHSTS) {
            push(`${ind(1)}add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;`);
        }

        if (config.ssl.enableOCSP) {
            push(`${ind(1)}ssl_stapling on;`);
            push(`${ind(1)}ssl_stapling_verify on;`);
        }
        blank();
    }

    // ── Security ──
    const hasSecurity = config.security.hideVersion || config.security.securityHeaders ||
        config.security.basicAuth || config.security.rateLimiting ||
        config.security.ipAllowlist.length > 0 || config.security.ipDenylist.length > 0;

    if (hasSecurity) {
        push(`${ind(1)}# ─── Security ───`);

        if (config.security.hideVersion) {
            push(`${ind(1)}server_tokens off;`);
        }

        if (config.security.securityHeaders) {
            push(`${ind(1)}add_header X-Frame-Options "SAMEORIGIN" always;`);
            push(`${ind(1)}add_header X-Content-Type-Options "nosniff" always;`);
            push(`${ind(1)}add_header Referrer-Policy "strict-origin-when-cross-origin" always;`);
            push(`${ind(1)}add_header X-XSS-Protection "1; mode=block" always;`);
        }

        if (config.security.ipAllowlist.length > 0) {
            for (const ip of config.security.ipAllowlist) {
                if (ip.trim()) push(`${ind(1)}allow ${ip.trim()};`);
            }
        }
        if (config.security.ipDenylist.length > 0) {
            for (const ip of config.security.ipDenylist) {
                if (ip.trim()) push(`${ind(1)}deny ${ip.trim()};`);
            }
        }

        if (config.security.basicAuth) {
            push(`${ind(1)}auth_basic "${config.security.basicAuthRealm || 'Restricted'}";`);
            push(`${ind(1)}auth_basic_user_file ${config.security.basicAuthFile || '/etc/nginx/.htpasswd'};`);
        }
        blank();
    }

    // ── Performance ──
    const hasPerf = config.performance.gzip || config.performance.brotli ||
        config.performance.clientMaxBodySize > 0 || config.performance.keepaliveTimeout > 0;

    if (hasPerf) {
        push(`${ind(1)}# ─── Performance ───`);

        if (config.performance.gzip) {
            push(`${ind(1)}gzip on;`);
            push(`${ind(1)}gzip_vary on;`);
            push(`${ind(1)}gzip_proxied any;`);
            push(`${ind(1)}gzip_comp_level 6;`);
            if (config.performance.gzipTypes.length > 0) {
                push(`${ind(1)}gzip_types ${config.performance.gzipTypes.join(' ')};`);
            }
        }

        if (config.performance.brotli) {
            push(`${ind(1)}brotli on;`);
            push(`${ind(1)}brotli_comp_level 6;`);
            push(`${ind(1)}brotli_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;`);
        }

        if (config.performance.clientMaxBodySize > 0) {
            push(`${ind(1)}client_max_body_size ${config.performance.clientMaxBodySize}${config.performance.clientMaxBodyUnit === 'GB' ? 'g' : 'm'};`);
        }

        if (config.performance.keepaliveTimeout > 0) {
            push(`${ind(1)}keepalive_timeout ${config.performance.keepaliveTimeout}s;`);
        }
        blank();
    }

    // ── Logging ──
    if (config.logging.accessLog || config.logging.errorLog) {
        push(`${ind(1)}# ─── Logging ───`);
        if (config.logging.accessLog) {
            push(`${ind(1)}access_log ${config.logging.accessLogPath || '/var/log/nginx/access.log'};`);
        } else {
            push(`${ind(1)}access_log off;`);
        }
        if (config.logging.errorLog) {
            push(`${ind(1)}error_log ${config.logging.errorLogPath || '/var/log/nginx/error.log'} ${config.logging.errorLogLevel};`);
        }
        blank();
    }

    // ── Reverse Proxy (default location) ──
    if (config.reverseProxy.enabled && config.locations.length === 0) {
        push(`${ind(1)}# ─── Reverse Proxy ───`);
        push(`${ind(1)}location / {`);
        push(`${ind(2)}proxy_pass ${config.reverseProxy.backendAddress || 'http://127.0.0.1:3000'};`);
        push(`${ind(2)}proxy_http_version 1.1;`);
        if (config.reverseProxy.webSocket) {
            push(`${ind(2)}proxy_set_header Upgrade $http_upgrade;`);
            push(`${ind(2)}proxy_set_header Connection "upgrade";`);
        }
        if (config.reverseProxy.realIpHeaders) {
            push(`${ind(2)}proxy_set_header Host $host;`);
            push(`${ind(2)}proxy_set_header X-Real-IP $remote_addr;`);
            push(`${ind(2)}proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`);
            push(`${ind(2)}proxy_set_header X-Forwarded-Proto $scheme;`);
        }
        for (const h of config.reverseProxy.customHeaders) {
            if (h.key && h.value) {
                push(`${ind(2)}proxy_set_header ${h.key} ${h.value};`);
            }
        }
        push(`${ind(1)}}`);
        blank();
    }

    // ── Location blocks ──
    if (config.locations.length > 0) {
        push(`${ind(1)}# ─── Location Blocks ───`);
        for (const loc of config.locations) {
            generateLocationBlock(loc, config, lines, ind);
            blank();
        }
    }

    // ── Rate limiting in default location (if no custom locations) ──
    if (config.security.rateLimiting && config.locations.length === 0 && !config.reverseProxy.enabled) {
        push(`${ind(1)}location / {`);
        push(`${ind(2)}limit_req zone=ratelimit burst=${config.security.rateBurst} nodelay;`);
        push(`${ind(2)}try_files $uri $uri/ =404;`);
        push(`${ind(1)}}`);
        blank();
    }

    // ── Static file caching ──
    if (config.performance.staticCaching) {
        push(`${ind(1)}# ─── Static File Caching ───`);
        push(`${ind(1)}location ~* \\.(jpg|jpeg|png|gif|ico|svg|webp)$ {`);
        push(`${ind(2)}expires ${config.performance.cacheExpiry || '30d'};`);
        push(`${ind(2)}add_header Cache-Control "public, immutable";`);
        push(`${ind(1)}}`);
        blank();
        push(`${ind(1)}location ~* \\.(css|js|woff2|woff|ttf)$ {`);
        push(`${ind(2)}expires ${config.performance.cacheExpiry || '7d'};`);
        push(`${ind(2)}add_header Cache-Control "public";`);
        push(`${ind(1)}}`);
        blank();
    }

    push('}');

    return lines.join('\n');
}

function generateLocationBlock(
    loc: LocationConfig,
    config: NginxConfig,
    lines: string[],
    ind: (level: number) => string
) {
    lines.push(`${ind(1)}location ${loc.path} {`);

    // Rate limiting
    if (config.security.rateLimiting) {
        lines.push(`${ind(2)}limit_req zone=ratelimit burst=${config.security.rateBurst} nodelay;`);
    }

    switch (loc.type) {
        case 'static':
            if (loc.root) lines.push(`${ind(2)}root ${loc.root};`);
            if (loc.tryFiles) lines.push(`${ind(2)}try_files ${loc.tryFiles};`);
            if (loc.index) lines.push(`${ind(2)}index ${loc.index};`);
            if (loc.autoindex) lines.push(`${ind(2)}autoindex on;`);
            if (loc.cacheExpiry) {
                lines.push(`${ind(2)}expires ${loc.cacheExpiry};`);
            }
            break;

        case 'proxy':
            lines.push(`${ind(2)}proxy_pass ${loc.proxyPass || 'http://127.0.0.1:3000'};`);
            lines.push(`${ind(2)}proxy_http_version 1.1;`);
            if (loc.proxyWebSocket) {
                lines.push(`${ind(2)}proxy_set_header Upgrade $http_upgrade;`);
                lines.push(`${ind(2)}proxy_set_header Connection "upgrade";`);
            }
            lines.push(`${ind(2)}proxy_set_header Host $host;`);
            lines.push(`${ind(2)}proxy_set_header X-Real-IP $remote_addr;`);
            lines.push(`${ind(2)}proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`);
            lines.push(`${ind(2)}proxy_set_header X-Forwarded-Proto $scheme;`);
            for (const h of loc.proxyHeaders) {
                if (h.key && h.value) {
                    lines.push(`${ind(2)}proxy_set_header ${h.key} ${h.value};`);
                }
            }
            break;

        case 'redirect':
            lines.push(`${ind(2)}return ${loc.redirectCode} ${loc.redirectUrl};`);
            break;

        case 'custom':
            if (loc.customDirectives) {
                const customLines = loc.customDirectives.split('\n');
                for (const cl of customLines) {
                    lines.push(`${ind(2)}${cl.trim()}`);
                }
            }
            break;
    }

    lines.push(`${ind(1)}}`);
}
