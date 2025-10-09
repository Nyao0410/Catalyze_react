import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, ColorSchemeName, useColorScheme } from 'react-native';
import { getColors } from './colors';
import { useResponsive } from '../hooks/useResponsive';

type ThemeMode = 'light' | 'dark' | 'system';

type ThemeContextValue = {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  colors: ReturnType<typeof getColors>;
  // responsive
  isTablet: boolean;
  width: number;
  height: number;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // follow system by default
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('system');

  // derive active theme based on mode and system setting
  const activeScheme: ColorSchemeName = useMemo(() => {
    if (mode === 'system') return systemScheme ?? 'light';
    return mode as ColorSchemeName;
  }, [mode, systemScheme]);

  const colors = useMemo(() => getColors(activeScheme === 'dark' ? 'dark' : 'light'), [activeScheme]);

  // Keep in sync if system changes and mode === 'system'
  useEffect(() => {
    const sub = Appearance.addChangeListener(() => {
      // no-op: useColorScheme hook will update systemScheme which updates activeScheme
    });
    return () => sub.remove();
  }, []);

  const value = { mode, setMode, colors } as ThemeContextValue;

  const responsive = useResponsive();
  const valueWithResponsive = {
    ...value,
    isTablet: responsive.isTablet,
    width: responsive.width,
    height: responsive.height,
  } as ThemeContextValue;

  return <ThemeContext.Provider value={valueWithResponsive}>{children}</ThemeContext.Provider>;
};

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

export default ThemeProvider;
