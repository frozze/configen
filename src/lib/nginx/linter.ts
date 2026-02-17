import { NginxConfig } from './types';

export type LintCategory = 'security' | 'performance' | 'correctness' | 'best-practice';
export type LintSeverity = 'error' | 'warning' | 'info';

export interface LintRule {
    id: string;
    title: string;
    message: string;
    category: LintCategory;
    severity: LintSeverity;
    /**
     * Returns true if the rule is VIOLATED (i.e., an issue is found).
     */
    test: (config: NginxConfig) => boolean;
    /**
     * Returns a partial config object to merge to fix the issue.
     */
    fix?: (config: NginxConfig) => DeepPartial<NginxConfig>;
    docsUrl?: string;
}

export interface LintResult {
    ruleId: string;
    severity: LintSeverity;
    title: string;
    message: string;
    category: LintCategory;
    docsUrl?: string;
}

export interface LintReport {
    valid: boolean;
    score: number;
    results: LintResult[];
    counts: {
        error: number;
        warning: number;
        info: number;
    };
}

export interface ApplyFixResult {
    config: NginxConfig;
    applied: boolean;
    appliedRuleIds: string[];
}

// Utility type for nested partials
type DeepPartial<T> = T extends readonly (infer U)[]
    ? readonly DeepPartial<U>[]
    : T extends object
        ? { [P in keyof T]?: DeepPartial<T[P]> }
        : T;

export const rules: LintRule[] = [
    // ─── Security ─────────────────────────────────────────────────────────────
    {
        id: 'security-server-tokens',
        title: 'Server Tokens Visible',
        message: 'Nginx version is visible in error pages and headers. Disable server_tokens to obscure version info.',
        category: 'security',
        severity: 'warning',
        test: (c) => !c.security.hideVersion, // Violated if hideVersion is false
        fix: () => ({ security: { hideVersion: true } } as DeepPartial<NginxConfig>),
        docsUrl: '/docs/lint/security-server-tokens',
    },
    {
        id: 'security-headers-missing',
        title: 'Missing Security Headers',
        message: 'Standard security headers (X-Frame-Options, X-Content-Type-Options, etc.) are disabled.',
        category: 'security',
        severity: 'error',
        test: (c) => !c.security.securityHeaders,
        fix: () => ({ security: { securityHeaders: true } } as DeepPartial<NginxConfig>),
        docsUrl: '/docs/lint/security-headers-missing',
    },
    {
        id: 'security-ssl-missing',
        title: 'SSL/TLS Disabled',
        message: 'Site is served over HTTP. Enable SSL/TLS for encryption (required for 100/100 score).',
        category: 'security',
        severity: 'error',
        test: (c) => !c.ssl.enabled && c.listenPort === 80,
        docsUrl: '/docs/lint/security-ssl-missing',
    },
    {
        id: 'security-ssl-enabled-missing-certs',
        title: 'SSL Enabled Without Certificate Paths',
        message: 'SSL/TLS is enabled but certificate or key path is missing. Nginx will fail to start with an invalid TLS server block.',
        category: 'security',
        severity: 'error',
        test: (c) => c.ssl.enabled && (!c.ssl.certificatePath.trim() || !c.ssl.keyPath.trim()),
    },
    // ...
    {
        id: 'bp-http-redirect-without-ssl',
        title: 'HTTP Redirect Without SSL',
        message: 'HTTP-to-HTTPS redirect is configured but SSL is not enabled. The redirect will fail or cause a loop.',
        category: 'best-practice',
        severity: 'error',
        test: (c) => c.ssl.httpRedirect && !c.ssl.enabled,
        fix: () => ({ ssl: { httpRedirect: false } } as DeepPartial<NginxConfig>),
        docsUrl: '/docs/lint/bp-http-redirect-without-ssl',
    },
    {
        id: 'security-upstream-needs-ssl',
        title: 'Upstream Traffic Unencrypted',
        message: 'Proxying to a remote backend without HTTPS. Consider using SSL between Nginx and Upstream if traversing public networks.',
        category: 'security',
        severity: 'info',
        test: (c) => c.reverseProxy.enabled && c.reverseProxy.backendAddress.startsWith('http://') && !c.reverseProxy.backendAddress.includes('localhost') && !c.reverseProxy.backendAddress.includes('127.0.0.1'),
        docsUrl: '/docs/lint/security-upstream-needs-ssl',
    },
    {
        id: 'correctness-proxy-enabled-without-backend',
        title: 'Reverse Proxy Enabled Without Backend',
        message: 'Reverse proxy mode is enabled, but backend address is empty. Requests will fail because there is no upstream destination.',
        category: 'correctness',
        severity: 'error',
        test: (c) => c.reverseProxy.enabled && !c.reverseProxy.backendAddress.trim(),
        fix: () => ({ reverseProxy: { enabled: false } } as DeepPartial<NginxConfig>),
    },

    // ─── Performance ──────────────────────────────────────────────────────────
    {
        id: 'perf-gzip-disabled',
        title: 'Gzip Compression Disabled',
        message: 'Gzip compression is disabled. Enable it to reduce bandwidth usage and improve load times.',
        category: 'performance',
        severity: 'warning',
        test: (c) => !c.performance.gzip,
        fix: () => ({ performance: { gzip: true } } as DeepPartial<NginxConfig>),
        docsUrl: '/docs/lint/perf-gzip-disabled',
    },
    {
        id: 'perf-http2-disabled',
        title: 'HTTP/2 Disabled',
        message: 'HTTP/2 is not enabled. Enable it for better multiplexing and performance over SSL.',
        category: 'performance',
        severity: 'info',
        test: (c) => c.ssl.enabled && !c.performance.http2,
        fix: () => ({ performance: { http2: true } } as DeepPartial<NginxConfig>),
        docsUrl: '/docs/lint/perf-http2-disabled',
    },

    // ─── Correctness / Best Practice ──────────────────────────────────────────
    {
        id: 'bp-worker-connections-low',
        title: 'Low Worker Connections',
        message: 'Worker connections is set low (< 1024). Default is usually 1024 or higher for production.',
        category: 'best-practice',
        severity: 'warning',
        test: () => false, // c.performance.workerConnections < 1024, // Disabled: meaningless for server-block only configs
        fix: () => ({ performance: { workerConnections: 1024 } } as DeepPartial<NginxConfig>),
        docsUrl: '/docs/lint/bp-worker-connections-low',
    },
    {
        id: 'bp-keepalive-timeout-high',
        title: 'High Keepalive Timeout',
        message: 'Keepalive timeout > 75s. Nginx default is 75s. Higher values may waste resources.',
        category: 'best-practice',
        severity: 'info',
        test: (c) => c.performance.keepaliveTimeout > 75,
        fix: () => ({ performance: { keepaliveTimeout: 65 } } as DeepPartial<NginxConfig>),
        docsUrl: '/docs/lint/bp-keepalive-timeout-high',
    },

    // ─── Security (additional) ────────────────────────────────────────────────
    {
        id: 'security-ssl-protocols-outdated',
        title: 'Outdated SSL/TLS Protocols',
        message: 'SSL is enabled but outdated protocols (TLSv1 or TLSv1.1) may be in use. Only TLSv1.2 and TLSv1.3 are considered secure.',
        category: 'security',
        severity: 'error',
        test: (c) => c.ssl.enabled && c.ssl.protocols.some(p => p === 'TLSv1' || p === 'TLSv1.1'),
        fix: (c) => ({ ssl: { protocols: c.ssl.protocols.filter(p => p !== 'TLSv1' && p !== 'TLSv1.1') } } as DeepPartial<NginxConfig>),
        docsUrl: '/docs/lint/security-ssl-protocols-outdated',
    },
    {
        id: 'security-no-rate-limiting',
        title: 'Rate Limiting Disabled',
        message: 'Rate limiting is not enabled. Without it, your server is more vulnerable to brute-force and DDoS attacks.',
        category: 'security',
        severity: 'info',
        test: (c) => !c.security.rateLimiting,
        fix: () => ({ security: { rateLimiting: true, rateLimit: 10, rateBurst: 20 } } as DeepPartial<NginxConfig>),
        docsUrl: '/docs/lint/security-no-rate-limiting',
    },
    {
        id: 'security-basic-auth-no-ssl',
        title: 'Basic Auth Without SSL',
        message: 'Basic authentication is enabled without SSL/TLS. Credentials are sent in plain text over HTTP.',
        category: 'security',
        severity: 'error',
        test: (c) => c.security.basicAuth && !c.ssl.enabled,
        docsUrl: '/docs/lint/security-basic-auth-no-ssl',
    },
    {
        id: 'security-open-autoindex',
        title: 'Directory Listing Enabled',
        message: 'autoindex is enabled on one or more locations. This exposes your directory structure to visitors.',
        category: 'security',
        severity: 'warning',
        test: (c) => c.locations.some(loc => loc.autoindex),
        docsUrl: '/docs/lint/security-open-autoindex',
    },

    // ─── Performance (additional) ─────────────────────────────────────────────
    {
        id: 'perf-brotli-disabled',
        title: 'Brotli Compression Disabled',
        message: 'Brotli compression is not enabled. Brotli offers 15-25% better compression than gzip for text content.',
        category: 'performance',
        severity: 'info',
        test: (c) => c.ssl.enabled && !c.performance.brotli,
        fix: () => ({ performance: { brotli: true } } as DeepPartial<NginxConfig>),
        docsUrl: '/docs/lint/perf-brotli-disabled',
    },
    {
        id: 'perf-no-static-caching',
        title: 'Static File Caching Disabled',
        message: 'Static file caching is not configured. Adding cache headers for assets (.js, .css, images) significantly improves page load times.',
        category: 'performance',
        severity: 'warning',
        test: (c) => !c.performance.staticCaching,
        fix: () => ({ performance: { staticCaching: true, cacheExpiry: '30d' } } as DeepPartial<NginxConfig>),
        docsUrl: '/docs/lint/perf-no-static-caching',
    },
    {
        id: 'perf-large-client-body',
        title: 'Large Client Body Size Limit',
        message: 'client_max_body_size is set above 100 MB. This may allow excessively large file uploads and consume server resources.',
        category: 'performance',
        severity: 'warning',
        test: (c) => {
            const sizeInMB = c.performance.clientMaxBodyUnit === 'GB'
                ? c.performance.clientMaxBodySize * 1024
                : c.performance.clientMaxBodySize;
            return sizeInMB > 100;
        },
        docsUrl: '/docs/lint/perf-large-client-body',
    },
    {
        id: 'perf-low-keepalive',
        title: 'Keepalive Timeout Too Low',
        message: 'Keepalive timeout is set very low (< 10s). This forces frequent TCP reconnections, adding latency.',
        category: 'performance',
        severity: 'info',
        test: (c) => c.performance.keepaliveTimeout > 0 && c.performance.keepaliveTimeout < 10,
        fix: () => ({ performance: { keepaliveTimeout: 65 } } as DeepPartial<NginxConfig>),
        docsUrl: '/docs/lint/perf-low-keepalive',
    },

    // ─── Correctness / Best Practice (additional) ─────────────────────────────
    {
        id: 'bp-missing-root-or-proxy',
        title: 'No Root Path or Reverse Proxy',
        message: 'No locations defined and reverse proxy is disabled. Nginx won\'t know where to find files or where to forward requests.',
        category: 'best-practice',
        severity: 'warning',
        test: (c) => c.locations.length === 0 && !c.reverseProxy.enabled,
        docsUrl: '/docs/lint/bp-missing-root-or-proxy',
    },

    {
        id: 'bp-single-server-upstream',
        title: 'Single Server in Upstream',
        message: 'Upstream block has only one server. Consider using proxy_pass directly for simplicity, or add more servers for redundancy.',
        category: 'best-practice',
        severity: 'info',
        test: (c) => c.upstream.enabled && c.upstream.servers.length === 1,
        docsUrl: '/docs/lint/bp-single-server-upstream',
    },
    {
        id: 'bp-logging-disabled',
        title: 'Access Logging Disabled',
        message: 'Access logging is disabled. Logs are essential for debugging, monitoring, and security auditing.',
        category: 'best-practice',
        severity: 'warning',
        test: (c) => !c.logging.accessLog,
        fix: () => ({ logging: { accessLog: true, accessLogPath: '/var/log/nginx/access.log' } } as DeepPartial<NginxConfig>),
        docsUrl: '/docs/lint/bp-logging-disabled',
    },
];

export function lintConfig(config: NginxConfig): LintReport {
    const results: LintResult[] = [];
    const counts = { error: 0, warning: 0, info: 0 };
    const severityRank: Record<LintSeverity, number> = {
        error: 0,
        warning: 1,
        info: 2,
    };

    for (const rule of rules) {
        try {
            if (rule.test(config)) {
                results.push({
                    ruleId: rule.id,
                    severity: rule.severity,
                    title: rule.title,
                    message: rule.message,
                    category: rule.category,
                    docsUrl: rule.docsUrl,
                });
                counts[rule.severity]++;
            }
        } catch (err) {
            console.error(`Error running lint rule ${rule.id}:`, err);
        }
    }

    results.sort((a, b) => {
        const severityDiff = severityRank[a.severity] - severityRank[b.severity];
        if (severityDiff !== 0) return severityDiff;
        return a.title.localeCompare(b.title);
    });

    // simple score calculation
    // Start at 100
    // Error: -20
    // Warning: -10
    // Info: -2
    let score = 100;
    score -= (counts.error * 20);
    score -= (counts.warning * 10);
    score -= (counts.info * 2);

    return {
        valid: counts.error === 0,
        score: Math.max(0, score),
        results,
        counts,
    };
}

export function applyLintFix(config: NginxConfig, ruleId: string): ApplyFixResult {
    const rule = rules.find((item) => item.id === ruleId);

    if (!rule?.fix || !rule.test(config)) {
        return {
            config,
            applied: false,
            appliedRuleIds: [],
        };
    }

    const updates = rule.fix(config);
    const nextConfig = deepMergeConfig(config, updates);
    const changed = !isSameConfig(config, nextConfig);

    return {
        config: changed ? nextConfig : config,
        applied: changed,
        appliedRuleIds: changed ? [rule.id] : [],
    };
}

export function applyAllLintFixes(config: NginxConfig, maxPasses = 3): ApplyFixResult {
    let currentConfig = config;
    const appliedRuleIds: string[] = [];
    const seenSignatures = new Set<string>([configSignature(config)]);

    for (let pass = 0; pass < maxPasses; pass += 1) {
        let changedInPass = false;

        for (const rule of rules) {
            if (!rule.fix || !rule.test(currentConfig)) continue;

            const updates = rule.fix(currentConfig);
            const nextConfig = deepMergeConfig(currentConfig, updates);

            if (!isSameConfig(currentConfig, nextConfig)) {
                currentConfig = nextConfig;
                appliedRuleIds.push(rule.id);
                changedInPass = true;
            }
        }

        const signature = configSignature(currentConfig);
        if (seenSignatures.has(signature)) break;
        seenSignatures.add(signature);

        if (!changedInPass) break;
    }

    return {
        config: currentConfig,
        applied: !isSameConfig(config, currentConfig),
        appliedRuleIds,
    };
}

function deepMergeConfig(target: NginxConfig, source: DeepPartial<NginxConfig>): NginxConfig {
    const output = { ...target } as Record<string, unknown>;

    if (isObject(target) && isObject(source)) {
        (Object.keys(source) as Array<keyof NginxConfig>).forEach((key) => {
            const sourceValue = source[key];
            const targetValue = target[key];

            if (isObject(sourceValue) && isObject(targetValue) && !Array.isArray(sourceValue) && !Array.isArray(targetValue)) {
                output[key] = deepMergeConfig(
                    targetValue as unknown as NginxConfig,
                    sourceValue as unknown as DeepPartial<NginxConfig>
                );
            } else {
                output[key] = sourceValue;
            }
        });
    }

    return output as unknown as NginxConfig;
}

function isObject(item: unknown): item is Record<string, unknown> {
    return Boolean(item) && typeof item === 'object' && !Array.isArray(item);
}

function configSignature(config: NginxConfig): string {
    return JSON.stringify(config);
}

function isSameConfig(left: NginxConfig, right: NginxConfig): boolean {
    return configSignature(left) === configSignature(right);
}

export const availableRules = rules;
