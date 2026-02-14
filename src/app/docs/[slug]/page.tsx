import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, BookOpen, ExternalLink } from 'lucide-react';

interface DocContent {
    title: string;
    description: string;
    content: string;
}

const docs: Record<string, DocContent> = {
    'reverse-proxy': {
        title: 'How to Set Up Nginx Reverse Proxy',
        description: 'Complete guide to configuring Nginx as a reverse proxy for your web applications.',
        content: `
## What is a Reverse Proxy?

A reverse proxy sits between client devices and your backend servers, forwarding client requests to the appropriate server. Nginx is one of the most popular choices for reverse proxy due to its high performance and low resource consumption.

## Basic Reverse Proxy Configuration

The simplest reverse proxy setup forwards all traffic from one domain to a backend application:

\`\`\`nginx
server {
    listen 80;
    server_name app.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
\`\`\`

## Passing Headers

When running behind a reverse proxy, your backend needs to know the real client IP and protocol. The key headers are:

- **X-Real-IP** — The actual client IP address
- **X-Forwarded-For** — Chain of proxy IPs
- **X-Forwarded-Proto** — Original protocol (http/https)
- **Host** — The original host header

## WebSocket Support

To proxy WebSocket connections, add the Upgrade headers:

\`\`\`nginx
location /ws {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
}
\`\`\`

## Load Balancing with Upstream

For high-availability setups, use an upstream block:

\`\`\`nginx
upstream backend {
    least_conn;
    server 10.0.0.1:8080 weight=3;
    server 10.0.0.2:8080 weight=2;
    server 10.0.0.3:8080 weight=1;
}

server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://backend;
    }
}
\`\`\`

## Use Our Generator

Instead of writing these configs by hand, use [Configen](/) to build your reverse proxy configuration visually!
`,
    },
    'ssl-setup': {
        title: 'Nginx SSL/TLS Configuration Guide',
        description: 'Step-by-step guide to configuring SSL/TLS on Nginx for secure HTTPS connections.',
        content: `
## Why SSL/TLS?

SSL/TLS encrypts traffic between your users and your server. It's essential for security, required for HTTP/2, and is a ranking factor for search engines.

## Basic SSL Configuration

\`\`\`nginx
server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
}
\`\`\`

## HTTP to HTTPS Redirect

Always redirect HTTP traffic to HTTPS:

\`\`\`nginx
server {
    listen 80;
    server_name example.com;
    return 301 https://$host$request_uri;
}
\`\`\`

## HSTS (HTTP Strict Transport Security)

Tell browsers to always use HTTPS:

\`\`\`nginx
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
\`\`\`

## OCSP Stapling

Improve SSL handshake performance:

\`\`\`nginx
ssl_stapling on;
ssl_stapling_verify on;
\`\`\`

## Mozilla SSL Presets

Mozilla provides recommended cipher configurations:

- **Modern** — TLS 1.3 only, highest security
- **Intermediate** — TLS 1.2+, balance of security and compatibility
- **Legacy** — Broad compatibility, lower security

Use our [generator](/) to apply these presets automatically!
`,
    },
    'load-balancing': {
        title: 'Nginx Load Balancing Explained',
        description: 'Learn how to configure Nginx load balancing with upstream blocks, methods, and health checks.',
        content: `
## What is Load Balancing?

Load balancing distributes incoming requests across multiple backend servers to improve performance, reliability, and scalability.

## Load Balancing Methods

### Round Robin (Default)
Distributes requests evenly across all servers:
\`\`\`nginx
upstream backend {
    server 10.0.0.1:8080;
    server 10.0.0.2:8080;
}
\`\`\`

### Least Connections
Sends requests to the server with fewest active connections:
\`\`\`nginx
upstream backend {
    least_conn;
    server 10.0.0.1:8080;
    server 10.0.0.2:8080;
}
\`\`\`

### IP Hash
Ensures requests from the same IP always go to the same server (session persistence):
\`\`\`nginx
upstream backend {
    ip_hash;
    server 10.0.0.1:8080;
    server 10.0.0.2:8080;
}
\`\`\`

## Server Weights

Assign different weights to servers:
\`\`\`nginx
upstream backend {
    server 10.0.0.1:8080 weight=3;
    server 10.0.0.2:8080 weight=1;
}
\`\`\`

## Health Checks

Configure passive health checks:
\`\`\`nginx
upstream backend {
    server 10.0.0.1:8080 max_fails=3 fail_timeout=30s;
    server 10.0.0.2:8080 max_fails=3 fail_timeout=30s;
}
\`\`\`

Generate your load balancing config with our [visual generator](/)!
`,
    },
    'security-headers': {
        title: 'Security Headers in Nginx',
        description: 'Complete guide to configuring security headers in Nginx to protect your web application.',
        content: `
## Why Security Headers?

Security headers tell browsers how to behave when handling your site's content. They protect against XSS, clickjacking, MIME sniffing, and other attacks.

## Essential Security Headers

### X-Frame-Options
Prevents your page from being loaded in an iframe (clickjacking protection):
\`\`\`nginx
add_header X-Frame-Options "SAMEORIGIN" always;
\`\`\`

### X-Content-Type-Options
Prevents MIME type sniffing:
\`\`\`nginx
add_header X-Content-Type-Options "nosniff" always;
\`\`\`

### Referrer-Policy
Controls how much referrer information is sent:
\`\`\`nginx
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
\`\`\`

### Content-Security-Policy
Controls which resources the browser can load:
\`\`\`nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';" always;
\`\`\`

### X-XSS-Protection
Enables browser's built-in XSS filter:
\`\`\`nginx
add_header X-XSS-Protection "1; mode=block" always;
\`\`\`

## Hide Server Version

Hide the Nginx version from response headers:
\`\`\`nginx
server_tokens off;
\`\`\`

## All-in-One Example

\`\`\`nginx
server {
    # ...
    server_tokens off;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=63072000" always;
}
\`\`\`

Use [Configen](/) to add all security headers with one click!
`,
    },
};

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
    return Object.keys(docs).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { slug } = await params;
    const doc = docs[slug];
    if (!doc) return { title: 'Not Found' };
    return {
        title: `${doc.title} — Configen`,
        description: doc.description,
        openGraph: { title: doc.title, description: doc.description },
    };
}

export default async function DocPage({ params }: { params: Params }) {
    const { slug } = await params;
    const doc = docs[slug];

    if (!doc) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-20 text-center">
                <h1 className="text-2xl font-bold text-dark-300">Page Not Found</h1>
                <Link href="/" className="text-accent-400 hover:underline mt-4 inline-block">Go Home</Link>
            </div>
        );
    }

    return (
        <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
            <Link
                href="/docs"
                className="inline-flex items-center gap-1.5 text-sm text-dark-500 hover:text-accent-400 transition-colors mb-8"
            >
                <ArrowLeft className="w-4 h-4" /> Back to Docs
            </Link>

            <header className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="w-5 h-5 text-accent-400" />
                    <span className="text-xs font-medium text-accent-400 uppercase tracking-wider">Documentation</span>
                </div>
                <h1 className="text-3xl font-bold text-dark-300">{doc.title}</h1>
                <p className="text-dark-400 mt-2">{doc.description}</p>
            </header>

            <div
                className="prose prose-invert prose-sm max-w-none
          prose-headings:text-dark-300
          prose-p:text-dark-400
          prose-strong:text-dark-300
          prose-li:text-dark-400
          prose-code:text-accent-400 prose-code:bg-dark-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
          prose-pre:bg-[#0d1117] prose-pre:border prose-pre:border-dark-700 prose-pre:rounded-xl
          prose-a:text-accent-400 prose-a:no-underline hover:prose-a:underline
        "
                dangerouslySetInnerHTML={{ __html: simpleMarkdown(doc.content) }}
            />

            {/* Related Guides */}
            <div className="mt-12">
                <h3 className="text-sm font-semibold text-dark-400 uppercase tracking-wider mb-4">Other Guides</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(docs)
                        .filter(([s]) => s !== slug)
                        .map(([s, d]) => (
                            <Link
                                key={s}
                                href={`/docs/${s}`}
                                className="p-4 rounded-xl border border-dark-700 bg-dark-900/50 hover:bg-dark-800 hover:border-dark-600 transition-all group"
                            >
                                <span className="text-sm font-medium text-dark-300 group-hover:text-white transition-colors">{d.title}</span>
                                <p className="text-xs text-dark-500 mt-1 line-clamp-1">{d.description}</p>
                            </Link>
                        ))}
                </div>
            </div>

            {/* CTA */}
            <div className="mt-8 p-6 rounded-xl border border-dark-700 bg-surface-raised text-center">
                <h3 className="text-lg font-bold text-dark-300 mb-2">Ready to build your config?</h3>
                <p className="text-sm text-dark-400 mb-4">Use Configen to generate or audit your server configuration — no coding required.</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link
                        href="/#generator"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-500 text-white font-semibold text-sm hover:bg-accent-600 transition-all"
                    >
                        Open Generator <ExternalLink className="w-4 h-4" />
                    </Link>
                    <Link
                        href="/lint"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-dark-600 text-dark-300 font-semibold text-sm hover:bg-dark-800 transition-all"
                    >
                        Try the Linter →
                    </Link>
                </div>
            </div>
        </article>
    );
}

/** Minimal markdown → HTML (handles ## headings, ```code blocks```, `inline code`, **bold**, [links](), and paragraphs) */
function simpleMarkdown(md: string): string {
    let html = md;

    // Code blocks
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
        return `<pre><code class="language-${lang}">${escapeHtml(code.trim())}</code></pre>`;
    });

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Headings
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');

    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

    // Lists
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`);

    // Paragraphs
    html = html
        .split('\n\n')
        .map((block) => {
            block = block.trim();
            if (!block) return '';
            if (
                block.startsWith('<h') ||
                block.startsWith('<pre') ||
                block.startsWith('<ul') ||
                block.startsWith('<li')
            )
                return block;
            return `<p>${block}</p>`;
        })
        .join('\n');

    return html;
}

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
