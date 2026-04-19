import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getItem, setItem } from '../storage';
import * as Localization from 'expo-localization';
import { translations, Language, TranslationKey } from './translations';

const STORAGE_KEY = 'user-language';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('tr');

  useEffect(() => {
    getItem(STORAGE_KEY).then((saved) => {
      if (saved && (saved === 'en' || saved === 'tr')) {
        setLanguageState(saved as Language);
      } else {
        const locale = Localization.getLocales()[0].languageCode;
        if (locale === 'en' || locale === 'tr') {
          setLanguageState(locale);
        }
      }
    });
  }, []);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    await setItem(STORAGE_KEY, lang);
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
