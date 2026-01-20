import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";

const LANGUAGES = [
    { code: "zh-TW", label: "繁體中文", flag: "🇹🇼" },
    { code: "en-US", label: "English", flag: "🇺🇸" },
    { code: "vi", label: "Tiếng Việt", flag: "🇻🇳" }
];

export default function LanguageSelector() {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const currentLang = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (code) => {
        i18n.changeLanguage(code);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                className="lang-btn"
                onClick={() => setIsOpen(!isOpen)}
                title={currentLang.label} // Tooltip showing language name
                type="button"
            >
                <span className="text-xl leading-none">{currentLang.flag}</span>
            </button>

            {isOpen && (
                <div className="lang-menu">
                    {LANGUAGES.map((lang) => (
                        <button
                            key={lang.code}
                            className={`lang-item ${i18n.language === lang.code ? "active" : ""}`}
                            onClick={() => handleSelect(lang.code)}
                            type="button"
                        >
                            <span className="text-lg">{lang.flag}</span>
                            <span className="text-sm font-medium">{lang.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
