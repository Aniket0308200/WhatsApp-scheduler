import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({ dark: false, toggle: () => {} });

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    try {
      const stored = localStorage.getItem('wa-theme');
      return stored === null ? true : stored === 'dark';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) { root.classList.add('dark'); }
    else       { root.classList.remove('dark'); }
    try { localStorage.setItem('wa-theme', dark ? 'dark' : 'light'); } catch {}
  }, [dark]);

  return (
    <ThemeContext.Provider value={{ dark, toggle: () => setDark(d => !d) }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
