import '@testing-library/jest-dom';
import i18n from '../i18n';

// Mock localStorage for zustand persist middleware
const localStorageMock = {
    getItem: () => null,
    setItem: () => { },
    removeItem: () => { },
    clear: () => { },
};
global.localStorage = localStorageMock;

// Ensure tests use zh-TW strings
i18n.changeLanguage('zh-TW');
