import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProContext = createContext();

const FREE_OPS_PER_DAY = 3;

export function ProProvider({ children }) {
  const [isPro, setIsPro] = useState(false);
  const [dailyUsage, setDailyUsage] = useState(0);

  useEffect(() => { loadState(); }, []);

  const loadState = async () => {
    const [proVal, usageVal, dateVal] = await Promise.all([
      AsyncStorage.getItem('isPro'),
      AsyncStorage.getItem('dailyUsage'),
      AsyncStorage.getItem('usageDate'),
    ]);
    setIsPro(proVal === 'true');
    const today = new Date().toDateString();
    if (dateVal === today) {
      setDailyUsage(parseInt(usageVal || '0', 10));
    } else {
      setDailyUsage(0);
      await AsyncStorage.multiSet([['usageDate', today], ['dailyUsage', '0']]);
    }
  };

  const canUse = (isProFeature = false) => {
    if (isPro) return true;
    if (isProFeature) return false;
    return dailyUsage < FREE_OPS_PER_DAY;
  };

  const consume = async () => {
    if (isPro) return;
    const next = dailyUsage + 1;
    setDailyUsage(next);
    await AsyncStorage.setItem('dailyUsage', String(next));
  };

  const upgradeToPro = async () => {
    // Replace with real IAP purchase flow
    setIsPro(true);
    await AsyncStorage.setItem('isPro', 'true');
  };

  const opsRemaining = isPro ? Infinity : Math.max(0, FREE_OPS_PER_DAY - dailyUsage);

  return (
    <ProContext.Provider value={{ isPro, dailyUsage, opsRemaining, canUse, consume, upgradeToPro }}>
      {children}
    </ProContext.Provider>
  );
}

export function usePro() {
  const ctx = useContext(ProContext);
  if (!ctx) throw new Error('usePro must be inside ProProvider');
  return ctx;
}
