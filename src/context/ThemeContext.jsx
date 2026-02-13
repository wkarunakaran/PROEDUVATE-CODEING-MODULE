import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // Check local storage or system preference on initial load
    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined') {
            const storedTheme = localStorage.getItem('theme');
            if (storedTheme) {
                return storedTheme;
            }
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                return 'dark';
            }
        }
        return 'dark'; // Default to dark
    });

    useEffect(() => {
        const root = window.document.documentElement;

        // Remove both potential classes to be safe
        root.classList.remove('light', 'dark');

        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.add('light'); // Optional, but good for specific selectors
        }

        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
