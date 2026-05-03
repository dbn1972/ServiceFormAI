import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { LanguageProvider, useLanguage } from '../LanguageContext';

describe('LanguageContext', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.lang = 'en';
    document.documentElement.dir = 'ltr';
  });

  it('should provide default language as English', () => {
    const { result } = renderHook(() => useLanguage(), {
      wrapper: LanguageProvider,
    });

    expect(result.current.language).toBe('en');
    expect(result.current.languageInfo.name).toBe('English');
  });

  it('should update language when setLanguage is called', () => {
    const { result } = renderHook(() => useLanguage(), {
      wrapper: LanguageProvider,
    });

    act(() => {
      result.current.setLanguage('hi');
    });

    expect(result.current.language).toBe('hi');
    expect(result.current.languageInfo.nativeName).toBe('हिन्दी');
  });

  it('should update document language attribute', () => {
    const { result } = renderHook(() => useLanguage(), {
      wrapper: LanguageProvider,
    });

    act(() => {
      result.current.setLanguage('hi');
    });

    expect(document.documentElement.lang).toBe('hi');
  });

  it('should persist language to localStorage', () => {
    const { result } = renderHook(() => useLanguage(), {
      wrapper: LanguageProvider,
    });

    act(() => {
      result.current.setLanguage('mr');
    });

    expect(localStorage.getItem('language')).toBe('mr');
  });

  it('should load language from localStorage', () => {
    localStorage.setItem('language', 'ta');

    const { result } = renderHook(() => useLanguage(), {
      wrapper: LanguageProvider,
    });

    expect(result.current.language).toBe('ta');
  });

  it('should provide translation function', () => {
    const { result } = renderHook(() => useLanguage(), {
      wrapper: LanguageProvider,
    });

    const welcomeText = result.current.t('common.welcome');
    expect(welcomeText).toBe('Welcome');
  });

  it('should translate to Hindi', () => {
    const { result } = renderHook(() => useLanguage(), {
      wrapper: LanguageProvider,
    });

    act(() => {
      result.current.setLanguage('hi');
    });

    const welcomeText = result.current.t('common.welcome');
    expect(welcomeText).toBe('स्वागत है');
  });

  it('should fallback to English if translation missing', () => {
    const { result } = renderHook(() => useLanguage(), {
      wrapper: LanguageProvider,
    });

    act(() => {
      result.current.setLanguage('bn'); // Bengali uses English fallback
    });

    const welcomeText = result.current.t('common.welcome');
    expect(welcomeText).toBe('Welcome');
  });

  it('should provide list of all available languages', () => {
    const { result } = renderHook(() => useLanguage(), {
      wrapper: LanguageProvider,
    });

    expect(result.current.languages.length).toBe(10);
    expect(result.current.languages[0]?.code).toBe('en');
  });

  it('should throw error when useLanguage is used outside provider', () => {
    expect(() => {
      renderHook(() => useLanguage());
    }).toThrow('useLanguage must be used within LanguageProvider');
  });
});
