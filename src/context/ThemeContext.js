import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LIGHT_COLORS, DARK_COLORS } from '../utils/theme';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [override, setOverride] = useState(null); // null = follow system

  useEffect(() => {
    AsyncStorage.getItem('themeOverride').then((val) => {
      if (val === 'light' || val === 'dark') setOverride(val);
    });
  }, []);

  const isDark = override ? override === 'dark' : systemScheme === 'dark';

  const toggleTheme = async () => {
    const next = isDark ? 'light' : 'dark';
    setOverride(next);
    await AsyncStorage.setItem('themeOverride', next);
  };

  const useSystemTheme = async () => {
    setOverride(null);
    await AsyncStorage.removeItem('themeOverride');
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, useSystemTheme, override }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be inside ThemeProvider');
  return {
    ...ctx,
    colors: ctx.isDark ? DARK_COLORS : LIGHT_COLORS,
  };
}
