'use client';
import Link from 'next/link';
import { Server, Menu, X, Upload } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useState } from 'react';
import ImportModal from '../ImportModal';
import { useUIStore } from '@/stores/uiStore';

const navLinks = [
    { href: '/#generator', label: 'Generator' },
    { href: '/lint', label: 'Linter' },
    { href: '/docs', label: 'Docs' },
    { href: 'https://github.com/frozze/configen', label: 'GitHub', external: true },
];

export default function Header() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const { isImportModalOpen, openImportModal, closeImportModal } = useUIStore();

    return (
        <>
            <header className="sticky top-0 z-50 border-b border-dark-700/50 bg-dark-950/80 backdrop-blur-xl">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2.5 group">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500/15 text-accent-400 group-hover:bg-accent-500/25 transition-colors">
                                <Server className="w-5 h-5" />
                            </div>
                            <span className="text-lg font-bold text-dark-300 hidden sm:block">
                                Confi<span className="text-accent-400">gen</span>
                            </span>
                        </Link>

                        {/* Desktop nav */}
                        <nav className="hidden md:flex items-center gap-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.label}
                                    href={link.href}
                                    target={link.external ? '_blank' : undefined}
                                    rel={link.external ? 'noopener noreferrer' : undefined}
                                    className="px-3 py-2 rounded-lg text-sm font-medium text-dark-400 hover:text-dark-300 hover:bg-dark-800 transition-colors"
                                >
                                    {link.label}
                                </Link>
                            ))}

                            <button
                                onClick={openImportModal}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-dark-400 hover:text-dark-300 hover:bg-dark-800 transition-colors"
                            >
                                <Upload className="w-4 h-4" />
                                Import
                            </button>

                            <div className="ml-2 border-l border-dark-700 pl-2">
                                <ThemeToggle />
                            </div>
                        </nav>

                        {/* Mobile menu button */}
                        <div className="flex md:hidden items-center gap-2">
                            <ThemeToggle />
                            <button
                                onClick={() => setMobileOpen(!mobileOpen)}
                                className="p-2 rounded-lg text-dark-400 hover:text-dark-300 hover:bg-dark-800 transition-colors"
                                aria-label="Toggle menu"
                            >
                                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Mobile nav */}
                    {mobileOpen && (
                        <nav className="md:hidden pb-4 space-y-1 animate-fade-in-up">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.label}
                                    href={link.href}
                                    target={link.external ? '_blank' : undefined}
                                    onClick={() => setMobileOpen(false)}
                                    className="block px-3 py-2 rounded-lg text-sm font-medium text-dark-400 hover:text-dark-300 hover:bg-dark-800 transition-colors"
                                >
                                    {link.label}
                                </Link>
                            ))}
                            <button
                                onClick={() => {
                                    setMobileOpen(false);
                                    openImportModal();
                                }}
                                className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-dark-400 hover:text-dark-300 hover:bg-dark-800 transition-colors"
                            >
                                <Upload className="w-4 h-4" />
                                Import Config
                            </button>
                        </nav>
                    )}
                </div>
            </header>

            <ImportModal isOpen={isImportModalOpen} onClose={closeImportModal} />
        </>
    );
}
