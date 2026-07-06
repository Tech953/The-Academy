import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { i18nManager, Language } from '@/lib/i18n';

interface I18nContextType {
  language: Language;
  languageCode: string;
  setLanguage: (code: string) => boolean;
  t: (key: string, replacements?: Record<string, string>) => string;
  availableLanguages: Language[];
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(i18nManager.getCurrentLanguage());
  const [version, setVersion] = useState(0);

  const setLanguage = useCallback((code: string): boolean => {
    const success = i18nManager.setLanguage(code);
    if (success) {
      setLanguageState(i18nManager.getCurrentLanguage());
      setVersion(v => v + 1);
      window.dispatchEvent(new CustomEvent('language-change', { detail: code }));
    }
    return success;
  }, []);

  const t = useCallback((key: string, replacements?: Record<string, string>): string => {
    return i18nManager.t(key, replacements);
  }, [version]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'academy-language') {
        const newLang = i18nManager.getCurrentLanguage();
        setLanguageState(newLang);
        setVersion(v => v + 1);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const value: I18nContextType = {
    language,
    languageCode: language.code,
    setLanguage,
    t,
    availableLanguages: i18nManager.getAvailableLanguages(),
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

export { I18nContext };
