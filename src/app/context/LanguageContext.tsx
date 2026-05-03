import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Supported languages
export type Language = 'en' | 'hi' | 'mr' | 'bn' | 'ta' | 'te' | 'gu' | 'kn' | 'ml' | 'pa';

export interface LanguageInfo {
  code: Language;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
}

export const LANGUAGES: Record<Language, LanguageInfo> = {
  en: { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr' },
  hi: { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', direction: 'ltr' },
  mr: { code: 'mr', name: 'Marathi', nativeName: 'मराठी', direction: 'ltr' },
  bn: { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', direction: 'ltr' },
  ta: { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', direction: 'ltr' },
  te: { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', direction: 'ltr' },
  gu: { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', direction: 'ltr' },
  kn: { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', direction: 'ltr' },
  ml: { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', direction: 'ltr' },
  pa: { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', direction: 'ltr' },
};

// Translation dictionary (expandable)
type TranslationKey =
  | 'common.welcome'
  | 'common.login'
  | 'common.logout'
  | 'common.register'
  | 'common.dashboard'
  | 'common.services'
  | 'common.applications'
  | 'common.notifications'
  | 'common.settings'
  | 'common.help'
  | 'common.search'
  | 'common.apply'
  | 'common.submit'
  | 'common.cancel'
  | 'common.save'
  | 'common.edit'
  | 'common.delete'
  | 'common.view'
  | 'common.download'
  | 'auth.loginTitle'
  | 'auth.registerTitle'
  | 'auth.email'
  | 'auth.password'
  | 'auth.mobile'
  | 'auth.forgotPassword'
  | 'auth.rememberMe'
  | 'nav.home'
  | 'nav.about'
  | 'nav.features'
  | 'nav.contact'
  | 'nav.privacy'
  | 'nav.terms';

type Translations = Record<TranslationKey, string>;

const enTranslations: Translations = {
  'common.welcome': 'Welcome',
  'common.login': 'Log In',
  'common.logout': 'Log Out',
  'common.register': 'Register',
  'common.dashboard': 'Dashboard',
  'common.services': 'Services',
  'common.applications': 'Applications',
  'common.notifications': 'Notifications',
  'common.settings': 'Settings',
  'common.help': 'Help',
  'common.search': 'Search',
  'common.apply': 'Apply',
  'common.submit': 'Submit',
  'common.cancel': 'Cancel',
  'common.save': 'Save',
  'common.edit': 'Edit',
  'common.delete': 'Delete',
  'common.view': 'View',
  'common.download': 'Download',
  'auth.loginTitle': 'Welcome Back',
  'auth.registerTitle': 'Create Your Account',
  'auth.email': 'Email Address',
  'auth.password': 'Password',
  'auth.mobile': 'Mobile Number',
  'auth.forgotPassword': 'Forgot password?',
  'auth.rememberMe': 'Remember me',
  'nav.home': 'Home',
  'nav.about': 'About',
  'nav.features': 'Features',
  'nav.contact': 'Contact',
  'nav.privacy': 'Privacy Policy',
  'nav.terms': 'Terms of Service',
};

const translations: Record<Language, Translations> = {
  en: enTranslations,
  hi: {
    'common.welcome': 'स्वागत है',
    'common.login': 'लॉग इन करें',
    'common.logout': 'लॉग आउट',
    'common.register': 'पंजीकरण करें',
    'common.dashboard': 'डैशबोर्ड',
    'common.services': 'सेवाएँ',
    'common.applications': 'आवेदन',
    'common.notifications': 'सूचनाएं',
    'common.settings': 'सेटिंग्स',
    'common.help': 'मदद',
    'common.search': 'खोजें',
    'common.apply': 'आवेदन करें',
    'common.submit': 'जमा करें',
    'common.cancel': 'रद्द करें',
    'common.save': 'सहेजें',
    'common.edit': 'संपादित करें',
    'common.delete': 'हटाएं',
    'common.view': 'देखें',
    'common.download': 'डाउनलोड करें',
    'auth.loginTitle': 'वापस स्वागत है',
    'auth.registerTitle': 'अपना खाता बनाएं',
    'auth.email': 'ईमेल पता',
    'auth.password': 'पासवर्ड',
    'auth.mobile': 'मोबाइल नंबर',
    'auth.forgotPassword': 'पासवर्ड भूल गए?',
    'auth.rememberMe': 'मुझे याद रखें',
    'nav.home': 'मुख्य पृष्ठ',
    'nav.about': 'हमारे बारे में',
    'nav.features': 'विशेषताएं',
    'nav.contact': 'संपर्क करें',
    'nav.privacy': 'गोपनीयता नीति',
    'nav.terms': 'सेवा की शर्तें',
  },
  mr: {
    'common.welcome': 'स्वागत आहे',
    'common.login': 'लॉगिन करा',
    'common.logout': 'लॉग आऊट',
    'common.register': 'नोंदणी करा',
    'common.dashboard': 'डॅशबोर्ड',
    'common.services': 'सेवा',
    'common.applications': 'अर्ज',
    'common.notifications': 'सूचना',
    'common.settings': 'सेटिंग्ज',
    'common.help': 'मदत',
    'common.search': 'शोध',
    'common.apply': 'अर्ज करा',
    'common.submit': 'सबमिट करा',
    'common.cancel': 'रद्द करा',
    'common.save': 'जतन करा',
    'common.edit': 'संपादित करा',
    'common.delete': 'हटवा',
    'common.view': 'पहा',
    'common.download': 'डाउनलोड करा',
    'auth.loginTitle': 'परत स्वागत आहे',
    'auth.registerTitle': 'तुमचे खाते तयार करा',
    'auth.email': 'ईमेल पत्ता',
    'auth.password': 'पासवर्ड',
    'auth.mobile': 'मोबाइल नंबर',
    'auth.forgotPassword': 'पासवर्ड विसरलात?',
    'auth.rememberMe': 'मला लक्षात ठेवा',
    'nav.home': 'मुख्यपृष्ठ',
    'nav.about': 'आमच्याबद्दल',
    'nav.features': 'वैशिष्ट्ये',
    'nav.contact': 'संपर्क',
    'nav.privacy': 'गोपनीयता धोरण',
    'nav.terms': 'सेवा अटी',
  },
  // Simplified translations for other languages (can be expanded)
  bn: enTranslations,
  ta: enTranslations,
  te: enTranslations,
  gu: enTranslations,
  kn: enTranslations,
  ml: enTranslations,
  pa: enTranslations,
};

interface LanguageContextType {
  language: Language;
  languageInfo: LanguageInfo;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  languages: LanguageInfo[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Load language from localStorage or browser default
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    if (saved && saved in LANGUAGES) {
      return saved as Language;
    }

    // Detect browser language
    const browserLang = navigator.language.split('-')[0] as Language;
    return browserLang in LANGUAGES ? browserLang : 'en';
  });

  const languageInfo = LANGUAGES[language];

  // Update document language and direction
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = languageInfo.direction;
  }, [language, languageInfo.direction]);

  // Persist language to localStorage
  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
    localStorage.setItem('language', newLang);
  };

  // Translation function
  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations.en[key] || key;
  };

  // All available languages
  const languages = Object.values(LANGUAGES);

  return (
    <LanguageContext.Provider value={{ language, languageInfo, setLanguage, t, languages }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
