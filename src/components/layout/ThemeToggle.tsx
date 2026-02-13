'use client';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
    const [dark, setDark] = useState(true);

    useEffect(() => {
        const saved = localStorage.getItem('theme');
        if (saved === 'light') {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setDark(false);
            document.documentElement.classList.add('light');
        }
    }, []);

    const toggle = () => {
        setDark((prev) => {
            const next = !prev;
            if (next) {
                document.documentElement.classList.remove('light');
                localStorage.setItem('theme', 'dark');
            } else {
                document.documentElement.classList.add('light');
                localStorage.setItem('theme', 'light');
            }
            return next;
        });
    };

    return (
        <button
            onClick={toggle}
            className="p-2 rounded-lg text-dark-400 hover:text-dark-300 hover:bg-dark-800 transition-colors"
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
            {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
    );
}
