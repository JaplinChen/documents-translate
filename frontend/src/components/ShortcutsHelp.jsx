import { useState } from "react";
import { SHORTCUTS } from "../hooks/useKeyboardShortcuts";

/**
 * Keyboard Shortcuts Help Modal
 */
export default function ShortcutsHelp({ onClose }) {
    const [isOpen, setIsOpen] = useState(true);

    if (!isOpen) return null;

    const handleClose = () => {
        setIsOpen(false);
        if (onClose) onClose();
    };

    const categories = {
        general: "一般操作",
        translate: "翻譯",
        selection: "選取",
        navigation: "導航"
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
                <div className="modal-header">
                    <h3>⌨️ 快捷鍵說明</h3>
                    <button className="icon-btn ghost" type="button" onClick={handleClose}>×</button>
                </div>
                <div className="modal-body">
                    {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
                        <div key={category} className="shortcut-category">
                            <h4>{categories[category] || category}</h4>
                            <div className="shortcut-list">
                                {shortcuts.map((shortcut, idx) => (
                                    <div key={idx} className="shortcut-item">
                                        <div className="shortcut-keys">
                                            {shortcut.keys.map((key, i) => (
                                                <span key={i}>
                                                    <kbd>{key}</kbd>
                                                    {i < shortcut.keys.length - 1 && <span className="key-sep">+</span>}
                                                </span>
                                            ))}
                                        </div>
                                        <span className="shortcut-action">{shortcut.action}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="modal-footer">
                    <button className="btn primary" onClick={handleClose}>我知道了</button>
                </div>
            </div>
        </div>
    );
}
