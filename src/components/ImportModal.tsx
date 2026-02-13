import React, { useState, useRef } from 'react';
import { parseNginxConfig } from '@/lib/nginx/parser';
import { useConfigStore } from '@/stores/configStore';
import { Upload, AlertTriangle, CheckCircle, FileText, X } from 'lucide-react';

interface ImportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ImportModal({ isOpen, onClose }: ImportModalProps) {
    const [rawConfig, setRawConfig] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [warnings, setWarnings] = useState<string[]>([]);
    const [success, setSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const setConfig = useConfigStore(state => state.setConfig);

    if (!isOpen) return null;

    const handleParse = () => {
        setError(null);
        setWarnings([]);
        setSuccess(false);

        if (!rawConfig.trim()) {
            setError('Please enter or upload a valid Nginx configuration.');
            return;
        }

        try {
            const result = parseNginxConfig(rawConfig);

            if (result.parseErrors.length > 0) {
                setError(`Parse errors: ${result.parseErrors.join(', ')}`);
                return;
            }

            if (result.warnings.length > 0) {
                setWarnings(result.warnings);
            }

            // Update store
            setConfig(result.config);
            setSuccess(true);

            // Auto close after success if no warnings, otherwise let user review
            if (result.warnings.length === 0) {
                setTimeout(() => {
                    onClose();
                    setSuccess(false);
                    setRawConfig('');
                }, 1000);
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unexpected error occurred during parsing.');
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            setRawConfig(text);
        };
        reader.readAsText(file);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                        <Upload className="w-5 h-5" />
                        Import Nginx Config
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-zinc-500" />
                    </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                    <div className="mb-4">
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                            Paste your existing <code>nginx.conf</code> content below or upload a file.
                            We&apos;ll do our best to map it to the generator settings.
                        </p>

                        <div className="relative">
                            <textarea
                                value={rawConfig}
                                onChange={(e) => setRawConfig(e.target.value)}
                                className="w-full h-64 p-4 font-mono text-sm bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                                placeholder="server { ... }"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-4 right-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
                            >
                                <FileText className="w-3 h-3" />
                                Upload File
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                className="hidden"
                                accept=".conf,text/plain"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 rounded-lg flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                            <div className="text-sm text-red-600 dark:text-red-400">
                                <span className="font-semibold block mb-1">Import Failed</span>
                                {error}
                            </div>
                        </div>
                    )}

                    {warnings.length > 0 && (
                        <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/50 rounded-lg flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                            <div className="text-sm text-yellow-700 dark:text-yellow-300">
                                <span className="font-semibold block mb-1">Warnings</span>
                                <ul className="list-disc pl-4 space-y-1">
                                    {warnings.map((w, i) => (
                                        <li key={i}>{w}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/50 rounded-lg flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                            <div className="text-sm text-green-600 dark:text-green-400">
                                Configuration imported successfully!
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3 bg-zinc-50 dark:bg-zinc-900/50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleParse}
                        disabled={!rawConfig.trim()}
                        className="px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors"
                    >
                        Parse & Import
                    </button>
                </div>
            </div>
        </div>
    );
}
