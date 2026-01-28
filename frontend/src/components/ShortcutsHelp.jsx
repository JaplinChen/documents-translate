import { useState } from "react";
import { useTranslation } from "react-i18next";
import { SHORTCUTS } from "../hooks/useKeyboardShortcuts";

/**
 * Keyboard Shortcuts Help Modal
 */
export default function ShortcutsHelp({ onClose }) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(true);

    if (!isOpen) return null;

    const handleClose = () => {
        setIsOpen(false);
        if (onClose) onClose();
    };

    const groupedShortcuts = SHORTCUTS.reduce((acc, shortcut) => {
        const cat = shortcut.category || "general";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(shortcut);
        return acc;
    }, {});

    return (
        <div className="modal-backdrop" onClick={handleClose}>
            <div className="modal shortcuts-modal" onClick={(e) => e.stopPropagation()}>
                <div className="help-content">
                    <div className="help-header">
                        <h3>{t("components.shortcuts.title")}</h3>
                        <button className="icon-btn ghost" type="button" onClick={handleClose}>×</button>
                    </div>
                    <div className="help-body">
                        <div className="shortcuts-grid">
                            {SHORTCUTS.map((shortcut, index) => (
                                <div key={index} className="shortcut-item">
                                    <div className="shortcut-keys">
                                        {shortcut.keys.map((key, i) => (
                                            <span key={i} className="key-wrapper">
                                                <kbd className="key">{key}</kbd>
                                                {i < shortcut.keys.length - 1 && <span className="key-sep">+</span>}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="shortcut-desc">
                                        {t(shortcut.translationKey)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="help-footer">
                        <button className="btn primary" onClick={handleClose}>{t("components.shortcuts.confirm")}</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
