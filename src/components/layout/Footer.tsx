import Link from 'next/link';
import { Server, Heart } from 'lucide-react';
import AdSlot from '../ui/AdSlot';

export default function Footer() {
    return (
        <footer className="border-t border-dark-700/50 bg-dark-950 mt-24">
            <AdSlot position="footer" />
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="space-y-3">
                        <Link href="/" className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-500/15 text-accent-400">
                                <Server className="w-4 h-4" />
                            </div>
                            <span className="text-base font-bold text-dark-300">
                                Confi<span className="text-accent-400">gen</span>
                            </span>
                        </Link>
                        <p className="text-sm text-dark-500 max-w-xs">
                            Free, open-source server configuration generator. No signup, no tracking, everything runs in your browser.
                        </p>
                    </div>

                    {/* Links — Tools */}
                    <div>
                        <h3 className="text-sm font-semibold text-dark-400 mb-3">Tools</h3>
                        <ul className="space-y-2">
                            <li><Link href="/#generator" className="text-sm text-dark-500 hover:text-accent-400 transition-colors">Generator</Link></li>
                            <li><Link href="/lint" className="text-sm text-dark-500 hover:text-accent-400 transition-colors">Linter</Link></li>
                        </ul>
                    </div>

                    {/* Links — Resources */}
                    <div>
                        <h3 className="text-sm font-semibold text-dark-400 mb-3">Resources</h3>
                        <ul className="space-y-2">
                            <li><Link href="/docs" className="text-sm text-dark-500 hover:text-accent-400 transition-colors">Documentation</Link></li>
                            <li><Link href="/docs/reverse-proxy" className="text-sm text-dark-500 hover:text-accent-400 transition-colors">Reverse Proxy Guide</Link></li>
                            <li><Link href="/docs/ssl-setup" className="text-sm text-dark-500 hover:text-accent-400 transition-colors">SSL/TLS Setup</Link></li>
                        </ul>
                    </div>

                    {/* Links — Open Source */}
                    <div>
                        <h3 className="text-sm font-semibold text-dark-400 mb-3">Open Source</h3>
                        <ul className="space-y-2">
                            <li><Link href="https://github.com/frozze/configen" target="_blank" className="text-sm text-dark-500 hover:text-accent-400 transition-colors">GitHub</Link></li>
                            <li><Link href="https://github.com/frozze/configen/blob/main/CONTRIBUTING.md" target="_blank" className="text-sm text-dark-500 hover:text-accent-400 transition-colors">Contributing</Link></li>
                            <li><Link href="https://github.com/frozze/configen/blob/main/LICENSE" target="_blank" className="text-sm text-dark-500 hover:text-accent-400 transition-colors">License (AGPL-3.0)</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="mt-10 pt-6 border-t border-dark-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-dark-500">
                    <p>&copy; {new Date().getFullYear()} Configen. All rights reserved.</p>
                    <p className="flex items-center gap-1">
                        Made with <Heart className="w-3 h-3 text-err-400" /> for the dev community
                    </p>
                </div>
            </div>
        </footer>
    );
}
