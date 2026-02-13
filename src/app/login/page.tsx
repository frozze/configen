'use client';

import { useState } from 'react';
import { authClient } from '@/lib/auth-client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Server, Github } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleEmailLogin = async () => {
        const { data, error } = await authClient.signIn.email({
            email,
            password
        });
        if (error) {
            setError(error.message ?? 'An unknown error occurred');
        } else {
            router.push('/dashboard');
        }
    };

    const handleSocialLogin = async (provider: 'github' | 'google') => {
        await authClient.signIn.social({
            provider,
            callbackURL: '/dashboard'
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-dark-950 px-4">
            <div className="w-full max-w-md bg-dark-900 border border-dark-800 rounded-xl p-8 shadow-xl">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-500/15 text-accent-400">
                            <Server className="w-6 h-6" />
                        </div>
                        <span className="text-xl font-bold text-dark-100">
                            Nginx<span className="text-accent-400">Config</span>
                        </span>
                    </Link>
                    <h1 className="text-2xl font-bold text-white">Welcome back</h1>
                    <p className="text-dark-400 mt-2">Sign in to your account</p>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={() => handleSocialLogin('github')}
                        className="w-full flex items-center justify-center gap-2 bg-dark-800 hover:bg-dark-700 text-white p-3 rounded-lg border border-dark-700 transition-colors"
                    >
                        <Github className="w-5 h-5" />
                        Continue with GitHub
                    </button>
                    {/* Google button etc if needed */}
                </div>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-dark-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-dark-900 text-dark-400">Or continue with email</span>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-dark-300 mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-dark-950 border border-dark-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-accent-500 focus:outline-none"
                            placeholder="you@example.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-dark-300 mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-dark-950 border border-dark-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-accent-500 focus:outline-none"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && <div className="text-red-400 text-sm">{error}</div>}

                    <button
                        onClick={handleEmailLogin}
                        className="w-full bg-accent-600 hover:bg-accent-500 text-white font-medium p-3 rounded-lg transition-colors"
                    >
                        Sign in
                    </button>
                </div>

                <p className="mt-6 text-center text-sm text-dark-400">
                    Don&apos;t have an account?{' '}
                    <Link href="/register" className="text-accent-400 hover:text-accent-300">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}
