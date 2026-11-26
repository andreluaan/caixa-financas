import { useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';
export type Background = 'tinta' | 'memoria';

export const backgrounds: { id: Background; label: string }[] = [
  { id: 'tinta', label: 'Tinta' },
  { id: 'memoria', label: 'Memória' },
];

const themeColor: Record<Theme, string> = { dark: '#151515', light: '#ece8df' };

function stored<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  const value = localStorage.getItem(key) as T | null;
  return value && allowed.includes(value) ? value : fallback;
}

export function useAppearance() {
  const [theme, setTheme] = useState<Theme>(() =>
    stored('caixa.theme', ['dark', 'light'], matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'),
  );
  const [background, setBackground] = useState<Background>(() =>
    stored('caixa.bg', backgrounds.map((b) => b.id), 'tinta'),
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor[theme]);
    localStorage.setItem('caixa.theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('caixa.bg', background);
  }, [background]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  const nextBackground = () =>
    setBackground((b) => backgrounds[(backgrounds.findIndex((x) => x.id === b) + 1) % backgrounds.length].id);

  return { theme, background, toggleTheme, nextBackground };
}

export type Appearance = ReturnType<typeof useAppearance>;
