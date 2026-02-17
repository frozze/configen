import React, { useEffect, useRef } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-nginx';
import 'prismjs/themes/prism-tomorrow.css';

interface CodeEditorProps {
    value: string;
    onChange: (value: string) => void;
    language?: string;
    placeholder?: string;
    className?: string;
    ariaLabel?: string;
    readOnly?: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
    value,
    onChange,
    language = 'nginx',
    placeholder,
    className = '',
    ariaLabel,
    readOnly = false,
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const preRef = useRef<HTMLPreElement>(null);

    // Sync scroll
    const handleScroll = () => {
        if (textareaRef.current && preRef.current) {
            preRef.current.scrollTop = textareaRef.current.scrollTop;
            preRef.current.scrollLeft = textareaRef.current.scrollLeft;
        }
    };

    // Highlight on effect
    useEffect(() => {
        if (preRef.current) {
            Prism.highlightElement(preRef.current);
        }
    }, [value, language]);

    // Handle tab key
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = e.currentTarget.selectionStart;
            const end = e.currentTarget.selectionEnd;
            const newValue = value.substring(0, start) + '    ' + value.substring(end);
            onChange(newValue);

            // Restore cursor position (needs timeout/useEffect usually, but simple approach here)
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
                }
            }, 0);
        }
    };

    return (
        <div className={`relative font-mono text-sm leading-6 ${className} bg-dark-950`}>
            {/* Syntax Highlight Layer */}
            <pre
                ref={preRef}
                aria-hidden="true"
                className={`absolute inset-0 m-0 pointer-events-none p-4 overflow-hidden whitespace-pre-wrap break-words z-0 custom-scrollbar text-[#dadada]`}
                style={{ fontFamily: 'inherit' }}
            >
                <code className={`language-${language}`}>
                    {value || ' '}
                </code>
            </pre>

            {!value && placeholder && (
                <div className="absolute inset-0 p-4 text-dark-500 pointer-events-none z-5">
                    {placeholder}
                </div>
            )}

            {/* Input Layer */}
            <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onScroll={handleScroll}
                onKeyDown={handleKeyDown}
                readOnly={readOnly}
                aria-label={ariaLabel || 'Code editor'}
                placeholder={placeholder}
                spellCheck={false}
                className="absolute inset-0 w-full h-full p-4 bg-transparent text-transparent caret-white resize-none outline-none z-10 overflow-auto whitespace-pre-wrap break-words custom-scrollbar"
                style={{
                    fontFamily: 'inherit',
                    lineHeight: 'inherit',
                    color: 'transparent',
                }}
            />
        </div>
    );
};
