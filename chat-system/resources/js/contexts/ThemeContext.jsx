import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    // 1. Theme Configuration (Dark / Light)
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'system');

    // 2. Color Configuration (Blue / Purple / Green / etc)
    const [primaryColor, setPrimaryColor] = useState(localStorage.getItem('primaryColor') || 'blue');

    const colors = {
        'blue': { hex: '#3b82f6', cls: 'text-blue-500' },
        'violet': { hex: '#8b5cf6', cls: 'text-violet-500' },
        'green': { hex: '#22c55e', cls: 'text-green-500' },
        'orange': { hex: '#f97316', cls: 'text-orange-500' },
        'rose': { hex: '#f43f5e', cls: 'text-rose-500' },
        'teal': { hex: '#14b8a6', cls: 'text-teal-500' },
    };

    useEffect(() => {
        const root = window.document.documentElement;

        // --- Apply Theme (Dark / Light) ---
        const removeOldTheme = () => {
            root.classList.remove('dark');
            root.classList.remove('light');
        };

        if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            removeOldTheme();
            root.classList.add(systemTheme);
        } else {
            removeOldTheme();
            root.classList.add(theme);
        }

        // --- Apply Pimary Color (CSS Variable) ---
        // This is the key: We update --color-primary dynamically
        const selectedColor = colors[primaryColor] ? colors[primaryColor].hex : colors['blue'].hex;
        root.style.setProperty('--color-primary', selectedColor);

        // Save preferences
        localStorage.setItem('theme', theme);
        localStorage.setItem('primaryColor', primaryColor);

    }, [theme, primaryColor]);

    // Listen for system theme changes
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            if (theme === 'system') {
                const root = window.document.documentElement;
                root.classList.remove('dark', 'light');
                root.classList.add(mediaQuery.matches ? 'dark' : 'light');
            }
        };
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, primaryColor, setPrimaryColor, colors }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);