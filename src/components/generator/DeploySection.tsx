'use client';

import { affiliateProviders, trackAffiliateClick } from '@/lib/affiliates';
import { ExternalLink, Server } from 'lucide-react';

export default function DeploySection() {
    return (
        <section className="mt-12 mb-8">
            <div className="rounded-2xl border border-dark-700 bg-surface-raised p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-500/15 text-accent-400">
                        <Server className="w-4 h-4" />
                    </div>
                    <h3 className="text-lg font-bold text-dark-300">Deploy this config</h3>
                </div>
                <p className="text-sm text-dark-400 mb-6">
                    Get a server and deploy your configuration in minutes.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {affiliateProviders.map((provider) => (
                        <a
                            key={provider.slug}
                            href={provider.url}
                            target="_blank"
                            rel="sponsored noopener"
                            onClick={() => trackAffiliateClick(provider.slug)}
                            className="group flex flex-col gap-2 p-4 rounded-xl border border-dark-700 bg-dark-900/50 hover:bg-dark-800 hover:border-dark-600 transition-all"
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-semibold text-sm text-dark-300 group-hover:text-white transition-colors">
                                    {provider.name}
                                </span>
                                <ExternalLink className="w-3.5 h-3.5 text-dark-500 group-hover:text-accent-400 transition-colors" />
                            </div>
                            <span className="text-xs text-dark-500">{provider.tagline}</span>
                            <span
                                className="text-xs font-medium mt-auto"
                                style={{ color: provider.color }}
                            >
                                {provider.credit}
                            </span>
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
}
