import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import zhTW from './locales/zh-TW.json';
import enUS from './locales/en-US.json';
import vi from './locales/vi.json';

const resources = {
    'zh-TW': { translation: zhTW },
    'zh': { translation: zhTW },
    'en-US': { translation: enUS },
    'en': { translation: enUS },
    'vi': { translation: vi },
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'zh-TW',
        load: 'languageOnly',
        nonExplicitSupportedLngs: true,
        interpolation: {
            escapeValue: false, // not needed for react as it escapes by default
        },
        detection: {
            order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
            caches: ['localStorage', 'cookie'],
        },
    });

export default i18n;
