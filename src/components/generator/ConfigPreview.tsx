'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useConfigStore } from '@/stores/configStore';
import { generateNginxConfig } from '@/lib/nginx/generator';
import { validateConfig } from '@/lib/nginx/validator';
import CopyButton from '@/components/ui/CopyButton';
import { Download, RotateCcw, AlertTriangle } from 'lucide-react';

export default function ConfigPreview() {
    const config = useConfigStore((s) => s.config);
    const resetConfig = useConfigStore((s) => s.resetConfig);
    const [output, setOutput] = useState('');
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Debounced config generation
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            const generated = generateNginxConfig(config);
            setOutput(generated);
        }, 200);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [config]);

    const warnings = useMemo(() => validateConfig(config), [config]);

    const handleDownload = () => {
        const blob = new Blob([output], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'nginx.conf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const lines = output.split('\n');

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                <h2 className="text-sm font-semibold text-dark-300">Generated Config</h2>
                <div className="flex items-center gap-2">
                    <CopyButton text={output} />
                    <button
                        onClick={handleDownload}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-dark-700 text-dark-300 hover:bg-dark-600 transition-colors"
                    >
                        <Download className="w-4 h-4" /> Download
                    </button>
                    <button
                        onClick={resetConfig}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-dark-400 hover:text-dark-300 hover:bg-dark-700 transition-colors"
                        title="Reset to Default"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Warnings */}
            {warnings.length > 0 && (
                <div className="mb-3 space-y-1.5">
                    {warnings.map((w, i) => (
                        <div
                            key={i}
                            className="flex items-start gap-2 px-3 py-2 rounded-lg bg-warn-500/10 border border-warn-500/20 text-xs"
                        >
                            <AlertTriangle className="w-3.5 h-3.5 text-warn-400 mt-0.5 flex-shrink-0" />
                            <span className="text-warn-400">
                                <strong>{w.section}:</strong> {w.message}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Code */}
            <div className="code-preview flex-1 overflow-auto p-4">
                <pre className="text-sm leading-relaxed">
                    {lines.map((line, i) => (
                        <div key={i} className="flex">
                            <span className="line-number">{i + 1}</span>
                            <code>{highlightLine(line)}</code>
                        </div>
                    ))}
                </pre>
            </div>
        </div>
    );
}

/**
 * Minimal syntax highlighting for nginx config.
 * Avoids heavy dependencies — just coloring comments, directives, strings, numbers.
 */
function highlightLine(line: string): React.ReactNode {
    // Comment line
    if (line.trim().startsWith('#')) {
        return <span className="token comment">{line}</span>;
    }

    // Process tokens
    const parts: React.ReactNode[] = [];
    const remaining = line;
    let key = 0;

    // Regex for strings, numbers, keywords
    const regex = /('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")|(\b\d+[smhdgGmMkK]?\b)|(\b(?:server|listen|location|upstream|proxy_pass|proxy_set_header|ssl_certificate|ssl_certificate_key|ssl_protocols|ssl_ciphers|ssl_prefer_server_ciphers|ssl_stapling|ssl_stapling_verify|add_header|gzip|gzip_vary|gzip_proxied|gzip_comp_level|gzip_types|brotli|brotli_comp_level|brotli_types|server_tokens|server_name|root|index|try_files|return|deny|allow|limit_req|limit_req_zone|access_log|error_log|client_max_body_size|keepalive_timeout|fastcgi_pass|fastcgi_param|include|auth_basic|auth_basic_user_file|proxy_http_version|autoindex|expires|worker_connections)\b)|(;)|(\{|\})/g;

    let match;
    let lastIndex = 0;

    while ((match = regex.exec(remaining)) !== null) {
        // Text before match
        if (match.index > lastIndex) {
            parts.push(<span key={key++}>{remaining.slice(lastIndex, match.index)}</span>);
        }

        if (match[1]) {
            // String
            parts.push(<span key={key++} className="token string">{match[0]}</span>);
        } else if (match[2]) {
            // Number
            parts.push(<span key={key++} className="token number">{match[0]}</span>);
        } else if (match[3]) {
            // Keyword
            parts.push(<span key={key++} className="token keyword">{match[0]}</span>);
        } else if (match[4]) {
            // Semicolon
            parts.push(<span key={key++} className="token punctuation">{match[0]}</span>);
        } else if (match[5]) {
            // Braces
            parts.push(<span key={key++} className="token punctuation">{match[0]}</span>);
        }

        lastIndex = match.index + match[0].length;
    }

    // Remaining text
    if (lastIndex < remaining.length) {
        parts.push(<span key={key++}>{remaining.slice(lastIndex)}</span>);
    }

    return parts.length > 0 ? <>{parts}</> : <span>{line}</span>;
}
