import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { translations, Language, TranslationKey } from './translations';

const STORAGE_KEY = 'appLanguage';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  // Load saved language on mount
  useEffect(() => {
    SecureStore.getItemAsync(STORAGE_KEY).then((saved) => {
      if (saved === 'en' || saved === 'tr') {
        setLanguageState(saved);
      }
    });
  }, []);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    await SecureStore.setItemAsync(STORAGE_KEY, lang);
  };

  const t = (key: TranslationKey): string => {
    return translations[language][key] ?? translations['en'][key] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
