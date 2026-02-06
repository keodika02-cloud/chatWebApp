import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    // Lấy theme từ localStorage hoặc mặc định là 'system'
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'system');

    useEffect(() => {
        const root = window.document.documentElement;

        // Hàm xóa class cũ
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

        // Lưu vào storage
        localStorage.setItem('theme', theme);
    }, [theme]);

    // Lắng nghe sự thay đổi của hệ thống nếu đang chọn 'system'
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
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);