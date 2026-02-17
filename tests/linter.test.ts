import { describe, it, expect } from 'vitest';
import { lintConfig, applyLintFix, applyAllLintFixes, type LintSeverity } from '../src/lib/nginx/linter';
import type { NginxConfig } from '../src/lib/nginx/types';

type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends readonly (infer U)[]
        ? DeepPartial<U>[]
        : T[P] extends object
            ? DeepPartial<T[P]>
            : T[P];
};

function makeConfig(overrides: DeepPartial<NginxConfig> = {}): NginxConfig {
    const defaults: NginxConfig = {
        serverName: 'example.com',
        listenPort: 443,
        listen443: true,
        rootPath: '/var/www/html',
        indexFiles: ['index.html'],
        ssl: {
            enabled: true,
            certificatePath: '/etc/ssl/cert.pem',
            keyPath: '/etc/ssl/key.pem',
            httpRedirect: true,
            protocols: ['TLSv1.2', 'TLSv1.3'],
            enableHSTS: true,
            enableOCSP: true,
            preset: 'modern',
        },
        reverseProxy: {
            enabled: false,
            backendAddress: '',
            webSocket: false,
            realIpHeaders: true,
            customHeaders: [],
        },
        locations: [
            {
                id: '1',
                path: '/',
                matchType: 'prefix',
                type: 'static',
                root: '/var/www/html',
                tryFiles: '$uri $uri/ =404',
                index: 'index.html',
                autoindex: false,
                cacheExpiry: '30d',
                proxyPass: '',
                proxyWebSocket: false,
                proxyHeaders: [],
                redirectUrl: '',
                redirectCode: 301,
                customDirectives: '',
            },
        ],
        security: {
            rateLimiting: true,
            rateLimit: 10,
            rateBurst: 20,
            securityHeaders: true,
            hideVersion: true,
            ipAllowlist: [],
            ipDenylist: [],
            basicAuth: false,
            basicAuthRealm: '',
            basicAuthFile: '',
        },
        performance: {
            gzip: true,
            gzipTypes: ['text/plain'],
            brotli: true,
            staticCaching: true,
            cacheExpiry: '30d',
            http2: true,
            clientMaxBodySize: 10,
            clientMaxBodyUnit: 'MB',
            keepaliveTimeout: 65,
            workerConnections: 1024,
        },
        logging: {
            accessLog: true,
            accessLogPath: '/var/log/nginx/access.log',
            errorLog: true,
            errorLogPath: '/var/log/nginx/error.log',
            errorLogLevel: 'warn',
            customLogFormat: false,
        },
        upstream: {
            enabled: false,
            name: 'backend',
            servers: [],
            method: 'round-robin',
        },
    };

    const config = { ...defaults, ...overrides } as NginxConfig;

    if (overrides.ssl) config.ssl = { ...defaults.ssl, ...overrides.ssl };
    if (overrides.reverseProxy) {
        config.reverseProxy = { ...defaults.reverseProxy, ...overrides.reverseProxy } as NginxConfig['reverseProxy'];
    }
    if (overrides.security) config.security = { ...defaults.security, ...overrides.security };
    if (overrides.performance) config.performance = { ...defaults.performance, ...overrides.performance };
    if (overrides.logging) config.logging = { ...defaults.logging, ...overrides.logging };
    if (overrides.upstream) {
        config.upstream = { ...defaults.upstream, ...overrides.upstream } as NginxConfig['upstream'];
    }

    return config;
}

describe('lintConfig', () => {
    it('returns healthy report for robust config', () => {
        const report = lintConfig(makeConfig());
        expect(report.valid).toBe(true);
        expect(report.results).toHaveLength(0);
        expect(report.score).toBe(100);
    });

    it('detects SSL enabled without cert paths', () => {
        const report = lintConfig(makeConfig({ ssl: { certificatePath: '' } }));
        expect(report.results.some((r) => r.ruleId === 'security-ssl-enabled-missing-certs')).toBe(true);
    });

    it('detects reverse proxy enabled without backend', () => {
        const report = lintConfig(makeConfig({ reverseProxy: { enabled: true, backendAddress: '' } }));
        expect(report.results.some((r) => r.ruleId === 'correctness-proxy-enabled-without-backend')).toBe(true);
    });

    it('sorts findings by severity priority', () => {
        const report = lintConfig(makeConfig({
            security: { hideVersion: false, rateLimiting: false },
            performance: { keepaliveTimeout: 90 },
        }));

        const rank: Record<LintSeverity, number> = {
            error: 0,
            warning: 1,
            info: 2,
        };

        for (let i = 1; i < report.results.length; i += 1) {
            expect(rank[report.results[i - 1].severity]).toBeLessThanOrEqual(rank[report.results[i].severity]);
        }
    });

    it('applies single rule fix only when violated', () => {
        const broken = makeConfig({ security: { hideVersion: false } });
        const fixed = applyLintFix(broken, 'security-server-tokens');

        expect(fixed.applied).toBe(true);
        expect(fixed.config.security.hideVersion).toBe(true);

        const noOp = applyLintFix(fixed.config, 'security-server-tokens');
        expect(noOp.applied).toBe(false);
    });

    it('applies all fixes idempotently', () => {
        const broken = makeConfig({
            security: { hideVersion: false, securityHeaders: false, rateLimiting: false },
            performance: { gzip: false, staticCaching: false, keepaliveTimeout: 90 },
            logging: { accessLog: false },
        });

        const firstPass = applyAllLintFixes(broken);
        expect(firstPass.applied).toBe(true);
        expect(firstPass.appliedRuleIds.length).toBeGreaterThan(0);

        const secondPass = applyAllLintFixes(firstPass.config);
        expect(secondPass.applied).toBe(false);
        expect(secondPass.appliedRuleIds).toHaveLength(0);
    });
});
