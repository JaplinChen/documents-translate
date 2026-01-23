import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";

const LANGUAGES = [
    { code: "zh-TW", label: "繁體中文", flag: "tw" },
    { code: "en-US", label: "English", flag: "us" },
    { code: "vi", label: "Tiếng Việt", flag: "vn" }
];

export default function LanguageSelector() {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const currentLang = LANGUAGES.find(l => i18n.language === l.code || i18n.language?.startsWith(l.code)) || LANGUAGES[0];

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
                className="lang-btn group"
                onClick={() => setIsOpen(!isOpen)}
                title={currentLang.label} // Tooltip showing language name
                type="button"
            >
                <img
                    src={`https://flagcdn.com/w40/${currentLang.flag}.png`}
                    alt={currentLang.label}
                />
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
                            <img
                                src={`https://flagcdn.com/w40/${lang.flag}.png`}
                                alt={lang.label}
                                className="w-6 h-4 object-cover rounded-sm border border-slate-100 shadow-sm"
                            />
                            <span className="text-sm font-medium">{lang.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
