import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Shield, Zap, CheckCircle, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Nginx Documentation & Guides — Configen',
    description: 'In-depth guides on Nginx configuration: reverse proxies, SSL/TLS, load balancing, security headers, and 20+ lint rules explained.',
};

const guides = [
    {
        slug: 'reverse-proxy',
        title: 'Nginx Reverse Proxy',
        description: 'How to configure Nginx as a reverse proxy for Node.js, Python, and other backends.',
        icon: <ArrowRight className="w-4 h-4" />,
    },
    {
        slug: 'ssl-setup',
        title: 'SSL/TLS Configuration',
        description: 'Set up HTTPS with Let\'s Encrypt, configure modern cipher suites, and enable HSTS.',
        icon: <Shield className="w-4 h-4" />,
    },
    {
        slug: 'load-balancing',
        title: 'Load Balancing',
        description: 'Distribute traffic across multiple backend servers with upstream blocks.',
        icon: <Zap className="w-4 h-4" />,
    },
    {
        slug: 'security-headers',
        title: 'Security Headers',
        description: 'Add X-Frame-Options, CSP, HSTS, and other critical security headers.',
        icon: <Shield className="w-4 h-4" />,
    },
];

const lintCategories = [
    { category: 'Security', icon: <Shield className="w-4 h-4" />, color: 'text-red-400', count: 8 },
    { category: 'Performance', icon: <Zap className="w-4 h-4" />, color: 'text-amber-400', count: 7 },
    { category: 'Best Practice', icon: <CheckCircle className="w-4 h-4" />, color: 'text-blue-400', count: 5 },
];

export default function DocsIndexPage() {
    return (
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
            <header className="mb-12">
                <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="w-5 h-5 text-accent-400" />
                    <span className="text-xs font-medium text-accent-400 uppercase tracking-wider">Documentation</span>
                </div>
                <h1 className="text-3xl font-bold text-dark-300">Guides & Reference</h1>
                <p className="text-dark-400 mt-2">
                    Learn how to configure Nginx for common use cases, or explore our lint rules to harden your existing config.
                </p>
            </header>

            {/* Guides */}
            <section className="mb-12">
                <h2 className="text-lg font-semibold text-dark-300 mb-4">Configuration Guides</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {guides.map((guide) => (
                        <Link
                            key={guide.slug}
                            href={`/docs/${guide.slug}`}
                            className="group p-5 rounded-xl border border-dark-700 bg-dark-900/50 hover:bg-dark-800 hover:border-dark-600 transition-all"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-500/10 text-accent-400">
                                    {guide.icon}
                                </div>
                                <span className="text-sm font-semibold text-dark-300 group-hover:text-white transition-colors">{guide.title}</span>
                            </div>
                            <p className="text-xs text-dark-500">{guide.description}</p>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Lint Rules */}
            <section className="mb-12">
                <h2 className="text-lg font-semibold text-dark-300 mb-2">Lint Rules Reference</h2>
                <p className="text-sm text-dark-400 mb-4">
                    20 rules across security, performance, and best practices. Each rule page explains what it checks, why it matters, and how to fix it.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                    {lintCategories.map((cat) => (
                        <div key={cat.category} className="p-4 rounded-xl border border-dark-700 bg-dark-900/50">
                            <div className="flex items-center gap-2 mb-1">
                                <span className={cat.color}>{cat.icon}</span>
                                <span className="text-sm font-medium text-dark-300">{cat.category}</span>
                            </div>
                            <span className="text-xs text-dark-500">{cat.count} rules</span>
                        </div>
                    ))}
                </div>

                <Link
                    href="/lint"
                    className="inline-flex items-center gap-2 text-sm text-accent-400 hover:underline"
                >
                    Try the Linter →
                </Link>
            </section>

            {/* CTA */}
            <div className="p-6 rounded-xl border border-dark-700 bg-surface-raised text-center">
                <h3 className="text-lg font-bold text-dark-300 mb-2">Ready to build your config?</h3>
                <p className="text-sm text-dark-400 mb-4">Generate production-ready Nginx configs visually — no terminal required.</p>
                <Link
                    href="/#generator"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-500 text-white font-semibold text-sm hover:bg-accent-600 transition-all"
                >
                    Open Generator <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
        </div>
    );
}
