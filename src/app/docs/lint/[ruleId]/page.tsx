import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Shield, Zap, CheckCircle, AlertTriangle, BookOpen } from 'lucide-react';

interface LintDocContent {
    title: string;
    description: string;
    severity: 'error' | 'warning' | 'info';
    category: 'security' | 'performance' | 'correctness' | 'best-practice';
    what: string;
    why: string;
    bad: string;
    good: string;
    howToFix: string;
    relatedRules: string[];
}

const lintDocs: Record<string, LintDocContent> = {
    'security-server-tokens': {
        title: 'Server Tokens Visible',
        description: 'Why you should disable server_tokens in Nginx to hide your server version.',
        severity: 'warning',
        category: 'security',
        what: 'This rule checks whether the `server_tokens` directive is set to `off`. When enabled (the default), Nginx exposes its version number in response headers and error pages.',
        why: 'Exposing your Nginx version reveals information attackers can use to find known vulnerabilities specific to that version. This is a common finding in security audits and penetration tests.',
        bad: `server {
    listen 80;
    server_name example.com;
    # server_tokens is "on" by default — version exposed
}`,
        good: `server {
    listen 80;
    server_name example.com;
    server_tokens off;
}`,
        howToFix: 'Add `server_tokens off;` to your `http`, `server`, or `location` block. The `http` block is recommended so it applies globally.',
        relatedRules: ['security-headers-missing', 'security-ssl-missing'],
    },
    'security-headers-missing': {
        title: 'Missing Security Headers',
        description: 'Essential HTTP security headers that should be present in every Nginx configuration.',
        severity: 'error',
        category: 'security',
        what: 'This rule checks whether standard security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, etc.) are enabled in your Nginx configuration.',
        why: 'Security headers instruct browsers on how to handle your content. Without them, your site is vulnerable to clickjacking (X-Frame-Options), MIME sniffing attacks (X-Content-Type-Options), and information leakage (Referrer-Policy).',
        bad: `server {
    listen 80;
    server_name example.com;
    # No security headers — browsers use defaults
}`,
        good: `server {
    listen 80;
    server_name example.com;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header X-XSS-Protection "1; mode=block" always;
}`,
        howToFix: 'Enable security headers in Configen\'s Security section, or manually add the `add_header` directives shown above to your server block.',
        relatedRules: ['security-server-tokens', 'security-ssl-missing'],
    },
    'security-ssl-missing': {
        title: 'SSL/TLS Disabled',
        description: 'Why HTTPS is required for modern web servers and how to enable it with Nginx.',
        severity: 'error',
        category: 'security',
        what: 'This rule detects when your server is listening on port 80 without SSL/TLS encryption configured.',
        why: 'Without SSL/TLS, all traffic between users and your server is transmitted in plain text. This includes passwords, cookies, and sensitive data. HTTPS is also required for HTTP/2, and search engines boost rankings for HTTPS sites.',
        bad: `server {
    listen 80;
    server_name example.com;
    root /var/www/html;
}`,
        good: `server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
}

server {
    listen 80;
    server_name example.com;
    return 301 https://$host$request_uri;
}`,
        howToFix: 'Enable SSL in Configen\'s SSL/TLS section and provide your certificate paths. Use Let\'s Encrypt for free certificates with `certbot`.',
        relatedRules: ['security-ssl-protocols-outdated', 'security-basic-auth-no-ssl'],
    },
    'security-ssl-enabled-missing-certs': {
        title: 'SSL Enabled Without Certificate Paths',
        description: 'Why enabling SSL without certificate/key paths breaks your Nginx startup.',
        severity: 'error',
        category: 'security',
        what: 'This rule checks if SSL/TLS is enabled while `ssl_certificate` or `ssl_certificate_key` is empty or missing.',
        why: 'Nginx cannot start an SSL server block without valid certificate paths. This causes deployment failures and immediate downtime after config reload.',
        bad: `server {
    listen 443 ssl;
    server_name example.com;
    # Missing cert/key paths
}`,
        good: `server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
}`,
        howToFix: 'Set both certificate and key paths in Configen\'s SSL section before enabling SSL mode.',
        relatedRules: ['security-ssl-missing', 'security-ssl-protocols-outdated'],
    },
    'security-upstream-needs-ssl': {
        title: 'Upstream Traffic Unencrypted',
        description: 'When to encrypt traffic between Nginx and your backend servers.',
        severity: 'info',
        category: 'security',
        what: 'This rule detects when Nginx is proxying requests to a remote backend server over plain HTTP (not localhost/127.0.0.1).',
        why: 'If your backend isn\'t on the same machine or local network, traffic between Nginx and the backend can be intercepted. This is especially risky in cloud environments or across data centers.',
        bad: `location / {
    proxy_pass http://10.0.0.5:3000;
}`,
        good: `location / {
    proxy_pass https://10.0.0.5:3000;
}`,
        howToFix: 'If your backend is on a different machine, configure it to accept HTTPS connections and change the proxy_pass URL to use `https://`.',
        relatedRules: ['security-ssl-missing'],
    },
    'security-ssl-protocols-outdated': {
        title: 'Outdated SSL/TLS Protocols',
        description: 'TLSv1 and TLSv1.1 are insecure — how to configure modern SSL protocols in Nginx.',
        severity: 'error',
        category: 'security',
        what: 'This rule checks if your SSL configuration includes outdated protocols like TLSv1 or TLSv1.1.',
        why: 'TLSv1.0 and TLSv1.1 have known vulnerabilities (BEAST, POODLE). All major browsers have dropped support for these protocols. PCI DSS compliance requires TLSv1.2 minimum.',
        bad: `ssl_protocols TLSv1 TLSv1.1 TLSv1.2;`,
        good: `ssl_protocols TLSv1.2 TLSv1.3;`,
        howToFix: 'Remove TLSv1 and TLSv1.1 from your `ssl_protocols` directive. In Configen, select the "Modern" or "Intermediate" SSL preset.',
        relatedRules: ['security-ssl-missing', 'security-headers-missing'],
    },
    'security-no-rate-limiting': {
        title: 'Rate Limiting Disabled',
        description: 'How Nginx rate limiting protects against brute-force and DDoS attacks.',
        severity: 'info',
        category: 'security',
        what: 'This rule checks whether rate limiting is configured for your server.',
        why: 'Without rate limiting, a single client can flood your server with requests. This enables brute-force attacks on login pages, API abuse, and denial-of-service attacks. Nginx\'s built-in `limit_req` module is lightweight and effective.',
        bad: `server {
    listen 80;
    server_name api.example.com;
    # No rate limiting — unlimited requests allowed
}`,
        good: `limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

server {
    listen 80;
    server_name api.example.com;

    location / {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:3000;
    }
}`,
        howToFix: 'Enable rate limiting in Configen\'s Security section. Set a reasonable rate (e.g., 10 requests/second) with a burst allowance.',
        relatedRules: ['security-headers-missing', 'security-server-tokens'],
    },
    'security-basic-auth-no-ssl': {
        title: 'Basic Auth Without SSL',
        description: 'Why HTTP Basic Authentication requires HTTPS encryption.',
        severity: 'error',
        category: 'security',
        what: 'This rule detects when HTTP Basic Authentication is enabled without SSL/TLS.',
        why: 'Basic Auth sends credentials as a Base64-encoded string in every request. Without HTTPS, anyone on the network can decode and read the username and password in plain text.',
        bad: `server {
    listen 80;
    server_name admin.example.com;

    auth_basic "Admin Area";
    auth_basic_user_file /etc/nginx/.htpasswd;
}`,
        good: `server {
    listen 443 ssl http2;
    server_name admin.example.com;

    ssl_certificate /etc/letsencrypt/live/admin.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.example.com/privkey.pem;

    auth_basic "Admin Area";
    auth_basic_user_file /etc/nginx/.htpasswd;
}`,
        howToFix: 'Enable SSL/TLS before using Basic Auth. In Configen, enable SSL in the SSL/TLS section first, then enable Basic Auth in the Security section.',
        relatedRules: ['security-ssl-missing', 'security-ssl-protocols-outdated'],
    },
    'security-open-autoindex': {
        title: 'Directory Listing Enabled',
        description: 'Why directory listing (autoindex) is a security risk in Nginx.',
        severity: 'warning',
        category: 'security',
        what: 'This rule checks if `autoindex` is enabled on any location block.',
        why: 'Directory listing exposes your file structure to anyone who visits a URL without an index file. Attackers can discover backup files, configuration files, and other sensitive content that shouldn\'t be publicly accessible.',
        bad: `location /files {
    root /var/www;
    autoindex on;
}`,
        good: `location /files {
    root /var/www;
    autoindex off;
    try_files $uri $uri/ =404;
}`,
        howToFix: 'Disable autoindex on your locations in Configen, or set `autoindex off;` in your Nginx config. If you need a file browser, consider a dedicated application with access controls.',
        relatedRules: ['security-server-tokens', 'security-headers-missing'],
    },
    'perf-gzip-disabled': {
        title: 'Gzip Compression Disabled',
        description: 'How enabling gzip in Nginx reduces bandwidth and improves page load times.',
        severity: 'warning',
        category: 'performance',
        what: 'This rule checks whether gzip compression is enabled.',
        why: 'Gzip compression reduces the size of text-based responses (HTML, CSS, JavaScript, JSON) by 60-80%. This significantly reduces bandwidth usage and improves page load times, especially on slower connections.',
        bad: `server {
    listen 80;
    server_name example.com;
    # gzip is off by default
}`,
        good: `server {
    listen 80;
    server_name example.com;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml;
}`,
        howToFix: 'Enable gzip in Configen\'s Performance section. The generator will add optimized gzip settings automatically.',
        relatedRules: ['perf-brotli-disabled', 'perf-no-static-caching'],
    },
    'perf-http2-disabled': {
        title: 'HTTP/2 Disabled',
        description: 'Benefits of HTTP/2 in Nginx and how to enable it.',
        severity: 'info',
        category: 'performance',
        what: 'This rule checks if HTTP/2 is enabled when SSL is active. HTTP/2 requires HTTPS.',
        why: 'HTTP/2 provides multiplexing (multiple requests over one connection), header compression, and server push. These features significantly improve page load performance, especially for sites with many assets.',
        bad: `server {
    listen 443 ssl;
    server_name example.com;
    # Missing http2
}`,
        good: `server {
    listen 443 ssl http2;
    server_name example.com;
}`,
        howToFix: 'Enable HTTP/2 in Configen\'s Performance section. Note: HTTP/2 requires SSL/TLS to be enabled first.',
        relatedRules: ['security-ssl-missing', 'perf-gzip-disabled'],
    },
    'perf-brotli-disabled': {
        title: 'Brotli Compression Disabled',
        description: 'Brotli vs gzip — why Brotli offers better compression for web content.',
        severity: 'info',
        category: 'performance',
        what: 'This rule checks if Brotli compression is enabled alongside SSL (Brotli is typically served over HTTPS).',
        why: 'Brotli offers 15-25% better compression ratios than gzip for text content. Developed by Google, it\'s supported by all modern browsers. It\'s especially effective for static assets.',
        bad: `server {
    listen 443 ssl http2;
    gzip on;
    # No brotli — missing 15-25% compression improvement
}`,
        good: `server {
    listen 443 ssl http2;
    gzip on;
    brotli on;
    brotli_types text/plain text/css application/json application/javascript;
}`,
        howToFix: 'Enable Brotli in Configen\'s Performance section. Note: Brotli requires the `ngx_brotli` module to be compiled into Nginx.',
        relatedRules: ['perf-gzip-disabled', 'perf-no-static-caching'],
    },
    'perf-no-static-caching': {
        title: 'Static File Caching Disabled',
        description: 'How to configure browser caching for static assets in Nginx.',
        severity: 'warning',
        category: 'performance',
        what: 'This rule checks if static file caching (expires/Cache-Control headers) is configured.',
        why: 'Without caching headers, browsers re-download static assets on every visit. Adding `expires` or `Cache-Control` headers for CSS, JS, and images allows browsers to cache them, dramatically reducing page load times for returning visitors.',
        bad: `location /static {
    root /var/www;
    # No caching headers — every visit re-downloads assets
}`,
        good: `location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff2)$ {
    root /var/www;
    expires 30d;
    add_header Cache-Control "public, immutable";
}`,
        howToFix: 'Enable static file caching in Configen\'s Performance section and set an appropriate cache duration (e.g., 30 days for versioned assets).',
        relatedRules: ['perf-gzip-disabled', 'perf-brotli-disabled'],
    },
    'perf-large-client-body': {
        title: 'Large Client Body Size Limit',
        description: 'Risks of setting client_max_body_size too high in Nginx.',
        severity: 'warning',
        category: 'performance',
        what: 'This rule checks if `client_max_body_size` is set above 100 MB.',
        why: 'A very large body size limit (>100 MB) means clients can upload massive files, potentially consuming all available disk space or memory. This can be used in denial-of-service attacks.',
        bad: `server {
    client_max_body_size 500m;
    # Allows 500 MB uploads — risky
}`,
        good: `server {
    client_max_body_size 25m;
    # Reasonable limit for most applications
}`,
        howToFix: 'Set `client_max_body_size` to the minimum required for your application. In Configen, adjust the value in the Performance section.',
        relatedRules: ['security-no-rate-limiting', 'perf-no-static-caching'],
    },
    'perf-low-keepalive': {
        title: 'Keepalive Timeout Too Low',
        description: 'Impact of very low keepalive_timeout settings on Nginx connection performance.',
        severity: 'info',
        category: 'performance',
        what: 'This rule triggers when `keepalive_timeout` is set below 10 seconds.',
        why: 'A very low keepalive timeout forces clients to establish new TCP connections frequently. Each new connection requires a TCP handshake (and TLS handshake for HTTPS), adding latency to every request.',
        bad: `keepalive_timeout 2;`,
        good: `keepalive_timeout 65;`,
        howToFix: 'Set `keepalive_timeout` to 60-75 seconds for most applications. Adjust in Configen\'s Performance section.',
        relatedRules: ['bp-keepalive-timeout-high'],
    },
    'bp-worker-connections-low': {
        title: 'Low Worker Connections',
        description: 'How worker_connections limits concurrent users in Nginx.',
        severity: 'warning',
        category: 'best-practice',
        what: 'This rule checks if `worker_connections` is set below 1024.',
        why: 'The `worker_connections` directive sets the maximum number of simultaneous connections per worker process. With a low value, Nginx will start rejecting connections under moderate load. The default (1024) is suitable for most setups.',
        bad: `events {
    worker_connections 256;
}`,
        good: `events {
    worker_connections 1024;
}`,
        howToFix: 'Set `worker_connections` to at least 1024 in Configen\'s Performance section. For high-traffic sites, consider 2048 or 4096.',
        relatedRules: ['perf-gzip-disabled', 'bp-keepalive-timeout-high'],
    },
    'bp-keepalive-timeout-high': {
        title: 'High Keepalive Timeout',
        description: 'Why excessively high keepalive_timeout wastes server resources.',
        severity: 'info',
        category: 'best-practice',
        what: 'This rule triggers when `keepalive_timeout` exceeds 75 seconds.',
        why: 'Very high keepalive timeouts keep idle connections open, consuming file descriptors and memory. Nginx\'s default is 75 seconds, which is suitable for most applications.',
        bad: `keepalive_timeout 300;`,
        good: `keepalive_timeout 65;`,
        howToFix: 'Set `keepalive_timeout` to 60-75 seconds. Adjust in Configen\'s Performance section.',
        relatedRules: ['perf-low-keepalive', 'bp-worker-connections-low'],
    },
    'bp-missing-root-or-proxy': {
        title: 'No Root Path or Reverse Proxy',
        description: 'Why Nginx needs a root directive or proxy_pass to serve content.',
        severity: 'warning',
        category: 'best-practice',
        what: 'This rule detects when no locations are defined and the reverse proxy is disabled.',
        why: 'Without a `root` directive (in locations) or a `proxy_pass`, Nginx doesn\'t know where to find files or where to forward requests. The server will return 404 for all requests.',
        bad: `server {
    listen 80;
    server_name example.com;
    # No root, no locations, no proxy — 404 for everything
}`,
        good: `server {
    listen 80;
    server_name example.com;
    root /var/www/html;

    location / {
        try_files $uri $uri/ =404;
    }
}`,
        howToFix: 'Add at least one location block with a root path, or enable reverse proxy in Configen\'s configuration.',
        relatedRules: ['bp-http-redirect-without-ssl'],
    },
    'correctness-proxy-enabled-without-backend': {
        title: 'Reverse Proxy Enabled Without Backend',
        description: 'Why enabling reverse proxy without backend address creates a broken config.',
        severity: 'error',
        category: 'correctness',
        what: 'This rule checks if reverse proxy mode is enabled while backend address is empty.',
        why: 'A proxy location without a backend target cannot route requests. In production this leads to immediate `502/500`-class failures for incoming traffic.',
        bad: `location / {
    proxy_pass ;
}`,
        good: `location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
}`,
        howToFix: 'Provide a valid backend URL in Reverse Proxy settings, or disable reverse proxy if you serve static files directly.',
        relatedRules: ['bp-missing-root-or-proxy', 'security-upstream-needs-ssl'],
    },
    'bp-http-redirect-without-ssl': {
        title: 'HTTP Redirect Without SSL',
        description: 'Why HTTP-to-HTTPS redirects fail when SSL is not configured.',
        severity: 'error',
        category: 'best-practice',
        what: 'This rule detects when HTTP-to-HTTPS redirect is enabled but SSL/TLS is not configured.',
        why: 'Enabling HTTP-to-HTTPS redirect without having SSL configured will cause an infinite redirect loop or connection refused error. Browsers will show "too many redirects" errors.',
        bad: `server {
    listen 80;
    server_name example.com;
    return 301 https://$host$request_uri;
    # But no SSL server block exists!
}`,
        good: `server {
    listen 443 ssl http2;
    server_name example.com;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    root /var/www/html;
}

server {
    listen 80;
    server_name example.com;
    return 301 https://$host$request_uri;
}`,
        howToFix: 'Enable SSL/TLS first in Configen\'s SSL section, then enable the HTTP-to-HTTPS redirect.',
        relatedRules: ['security-ssl-missing', 'security-ssl-protocols-outdated'],
    },
    'bp-single-server-upstream': {
        title: 'Single Server in Upstream',
        description: 'When to use upstream blocks vs direct proxy_pass in Nginx.',
        severity: 'info',
        category: 'best-practice',
        what: 'This rule detects upstream blocks that contain only one server.',
        why: 'An upstream block with a single server adds configuration complexity without providing load balancing or failover benefits. A direct `proxy_pass` to the server is simpler. However, an upstream can still be useful for keepalive connections to the backend.',
        bad: `upstream backend {
    server 10.0.0.1:3000;
}

location / {
    proxy_pass http://backend;
}`,
        good: `# Either use proxy_pass directly:
location / {
    proxy_pass http://10.0.0.1:3000;
}

# Or add more servers for redundancy:
upstream backend {
    server 10.0.0.1:3000;
    server 10.0.0.2:3000;
}`,
        howToFix: 'Either add more servers to the upstream block for redundancy, or remove the upstream and use `proxy_pass` directly.',
        relatedRules: ['bp-missing-root-or-proxy'],
    },
    'bp-logging-disabled': {
        title: 'Access Logging Disabled',
        description: 'Why Nginx access logs are essential for security and debugging.',
        severity: 'warning',
        category: 'best-practice',
        what: 'This rule checks if access logging is disabled.',
        why: 'Access logs record every request to your server. Without them, you can\'t debug issues, monitor traffic patterns, detect attacks, or comply with audit requirements. The performance cost of logging is minimal.',
        bad: `server {
    access_log off;
    # No record of any requests
}`,
        good: `server {
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log warn;
}`,
        howToFix: 'Enable access logging in Configen\'s Logging section. Set the log path to a location with adequate disk space.',
        relatedRules: ['bp-worker-connections-low', 'security-server-tokens'],
    },
};

// Get all lint doc slugs for static generation
export function getAllLintDocSlugs(): string[] {
    return Object.keys(lintDocs);
}

// Get a specific lint doc
export function getLintDoc(ruleId: string): LintDocContent | undefined {
    return lintDocs[ruleId];
}

type Params = Promise<{ ruleId: string }>;

export async function generateStaticParams() {
    return Object.keys(lintDocs).map((ruleId) => ({ ruleId }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { ruleId } = await params;
    const doc = lintDocs[ruleId];
    if (!doc) return { title: 'Not Found' };
    return {
        title: `${doc.title} — Configen Lint Rule`,
        description: doc.description,
        openGraph: { title: `${doc.title} — Nginx Linter`, description: doc.description },
    };
}

function SeverityBadge({ severity }: { severity: string }) {
    const styles = {
        error: 'bg-red-500/15 text-red-400 border-red-500/30',
        warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        info: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    }[severity] || 'bg-gray-500/15 text-gray-400 border-gray-500/30';

    const icons = {
        error: <AlertTriangle className="w-3.5 h-3.5" />,
        warning: <AlertTriangle className="w-3.5 h-3.5" />,
        info: <BookOpen className="w-3.5 h-3.5" />,
    };

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${styles}`}>
            {icons[severity as keyof typeof icons]}
            {severity.charAt(0).toUpperCase() + severity.slice(1)}
        </span>
    );
}

function CategoryBadge({ category }: { category: string }) {
    const icons = {
        security: <Shield className="w-3.5 h-3.5" />,
        performance: <Zap className="w-3.5 h-3.5" />,
        correctness: <CheckCircle className="w-3.5 h-3.5" />,
        'best-practice': <CheckCircle className="w-3.5 h-3.5" />,
    };

    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-dark-800 text-dark-400 border border-dark-700">
            {icons[category as keyof typeof icons]}
            {category.replace('-', ' ')}
        </span>
    );
}

export default async function LintRulePage({ params }: { params: Params }) {
    const { ruleId } = await params;
    const doc = lintDocs[ruleId];

    if (!doc) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-20 text-center">
                <h1 className="text-2xl font-bold text-dark-300">Lint Rule Not Found</h1>
                <Link href="/lint" className="text-accent-400 hover:underline mt-4 inline-block">Back to Linter</Link>
            </div>
        );
    }

    return (
        <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
            <Link
                href="/lint"
                className="inline-flex items-center gap-1.5 text-sm text-dark-500 hover:text-accent-400 transition-colors mb-8"
            >
                <ArrowLeft className="w-4 h-4" /> Back to Linter
            </Link>

            <header className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                    <SeverityBadge severity={doc.severity} />
                    <CategoryBadge category={doc.category} />
                </div>
                <h1 className="text-3xl font-bold text-dark-300 mb-2">{doc.title}</h1>
                <p className="text-dark-400">{doc.description}</p>
            </header>

            {/* What */}
            <section className="mb-8">
                <h2 className="text-lg font-semibold text-dark-300 mb-3">What This Rule Checks</h2>
                <p className="text-sm text-dark-400 leading-relaxed">{doc.what}</p>
            </section>

            {/* Why */}
            <section className="mb-8">
                <h2 className="text-lg font-semibold text-dark-300 mb-3">Why It Matters</h2>
                <p className="text-sm text-dark-400 leading-relaxed">{doc.why}</p>
            </section>

            {/* Bad Example */}
            <section className="mb-8">
                <h2 className="text-lg font-semibold text-dark-300 mb-3">
                    <span className="text-red-400">✗</span> Bad — Triggers this rule
                </h2>
                <pre className="bg-[#0d1117] border border-dark-700 rounded-xl p-4 overflow-x-auto">
                    <code className="text-sm font-mono text-dark-400">{doc.bad}</code>
                </pre>
            </section>

            {/* Good Example */}
            <section className="mb-8">
                <h2 className="text-lg font-semibold text-dark-300 mb-3">
                    <span className="text-green-400">✓</span> Good — Passes this rule
                </h2>
                <pre className="bg-[#0d1117] border border-dark-700 rounded-xl p-4 overflow-x-auto">
                    <code className="text-sm font-mono text-dark-400">{doc.good}</code>
                </pre>
            </section>

            {/* How to Fix */}
            <section className="mb-8">
                <h2 className="text-lg font-semibold text-dark-300 mb-3">How to Fix</h2>
                <p className="text-sm text-dark-400 leading-relaxed">{doc.howToFix}</p>
            </section>

            {/* Related Rules */}
            {doc.relatedRules.length > 0 && (
                <section className="mb-10">
                    <h2 className="text-lg font-semibold text-dark-300 mb-3">Related Rules</h2>
                    <div className="flex flex-wrap gap-2">
                        {doc.relatedRules.map((rr) => (
                            <Link
                                key={rr}
                                href={`/docs/lint/${rr}`}
                                className="text-xs px-3 py-1.5 rounded-lg bg-dark-800 border border-dark-700 text-accent-400 hover:bg-dark-700 transition-colors"
                            >
                                {rr}
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* CTA */}
            <div className="p-6 rounded-xl border border-dark-700 bg-surface-raised text-center">
                <h3 className="text-lg font-bold text-dark-300 mb-2">Check your config now</h3>
                <p className="text-sm text-dark-400 mb-4">Paste your nginx.conf and get instant feedback on 20+ rules.</p>
                <Link
                    href="/lint"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-500 text-white font-semibold text-sm hover:bg-accent-600 transition-all"
                >
                    Open Linter →
                </Link>
            </div>
        </article>
    );
}
