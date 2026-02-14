// ─── Configen — Type Definitions ────────────────────────────────────────────

export interface SSLConfig {
    enabled: boolean;
    certificatePath: string;
    keyPath: string;
    httpRedirect: boolean;
    protocols: string[];
    enableHSTS: boolean;
    enableOCSP: boolean;
    preset: 'modern' | 'intermediate' | 'legacy';
}

export type LocationType = 'static' | 'proxy' | 'redirect' | 'custom';

export interface LocationConfig {
    id: string;
    path: string;
    matchType: 'prefix' | 'exact' | 'regex' | 'regex_case_insensitive'; // Added for parser support
    type: LocationType;
    // Static
    root: string;
    tryFiles: string;
    index: string;
    autoindex: boolean;
    cacheExpiry: string;
    // Proxy
    proxyPass: string;
    proxyWebSocket: boolean;
    proxyHeaders: { key: string; value: string }[];
    // Redirect
    redirectUrl: string;
    redirectCode: 301 | 302;
    // Custom
    customDirectives: string;
}

export interface SecurityConfig {
    rateLimiting: boolean;
    rateLimit: number;
    rateBurst: number;
    securityHeaders: boolean;
    hideVersion: boolean;
    ipAllowlist: string[];
    ipDenylist: string[];
    basicAuth: boolean;
    basicAuthRealm: string;
    basicAuthFile: string;
}

export interface PerformanceConfig {
    gzip: boolean;
    gzipTypes: string[];
    brotli: boolean;
    staticCaching: boolean;
    cacheExpiry: string;
    http2: boolean;
    clientMaxBodySize: number;
    clientMaxBodyUnit: 'MB' | 'GB';
    keepaliveTimeout: number;
    workerConnections: number;
}

export interface LoggingConfig {
    accessLog: boolean;
    accessLogPath: string;
    errorLog: boolean;
    errorLogPath: string;
    errorLogLevel: 'warn' | 'error' | 'crit';
    customLogFormat: boolean;
}

export interface UpstreamServer {
    id: string;
    address: string;
    weight: number;
    maxFails: number;
    failTimeout: number;
}

export interface UpstreamConfig {
    enabled: boolean;
    name: string;
    servers: UpstreamServer[];
    method: 'round-robin' | 'least_conn' | 'ip_hash' | 'random';
}

export interface ReverseProxyConfig {
    enabled: boolean;
    backendAddress: string;
    webSocket: boolean;
    realIpHeaders: boolean;
    customHeaders: { key: string; value: string }[];
}

export interface NginxConfig {
    serverName: string;
    listenPort: number;
    listen443: boolean;
    rootPath: string;
    indexFiles: string[];
    ssl: SSLConfig;
    reverseProxy: ReverseProxyConfig;
    locations: LocationConfig[];
    security: SecurityConfig;
    performance: PerformanceConfig;
    logging: LoggingConfig;
    upstream: UpstreamConfig;
    customDirectives?: string; // Added for top-level unknown directives
}

export interface ValidationWarning {
    field: string;
    message: string;
    severity: 'info' | 'warning' | 'error';
}

export interface ConfigWarning {
    section: string;
    message: string;
}

export interface GenerationResult {
    config: string;
    warnings: ConfigWarning[];
}
