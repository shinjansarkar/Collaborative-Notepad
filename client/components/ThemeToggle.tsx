'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2.5 rounded-xl glass-panel text-gray-300 hover:text-white transition-all flex items-center justify-center cursor-pointer z-50 relative"
      aria-label="Toggle Theme"
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5 text-amber-400 text-glow" />
      ) : (
        <Moon className="w-5 h-5 text-indigo-500 text-glow" />
      )}
    </button>
  );
}
