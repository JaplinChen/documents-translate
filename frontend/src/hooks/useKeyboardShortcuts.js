import { useEffect, useCallback } from "react";

/**
 * Keyboard Shortcuts Hook
 * 
 * Provides global keyboard shortcuts for the application.
 * 
 * Shortcuts:
 * - Ctrl/Cmd + S: Save (prevent default)
 * - Ctrl/Cmd + Enter: Trigger translate
 * - Ctrl/Cmd + Shift + A: Select/deselect all blocks
 * - Escape: Close modals
 */
export function useKeyboardShortcuts({
    onSave,
    onTranslate,
    onSelectAll,
    onDeselectAll,
    onCloseModal,
    isModalOpen = false,
    disabled = false
}) {
    const handleKeyDown = useCallback((event) => {
        if (disabled) return;

        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const isCtrlOrCmd = isMac ? event.metaKey : event.ctrlKey;

        // Escape - Close modal
        if (event.key === "Escape") {
            if (isModalOpen && onCloseModal) {
                event.preventDefault();
                onCloseModal();
            }
            return;
        }

        // Ctrl/Cmd + S - Save
        if (isCtrlOrCmd && event.key === "s") {
            event.preventDefault();
            if (onSave) onSave();
            return;
        }

        // Ctrl/Cmd + Enter - Translate
        if (isCtrlOrCmd && event.key === "Enter") {
            event.preventDefault();
            if (onTranslate) onTranslate();
            return;
        }

        // Ctrl/Cmd + Shift + A - Select/Deselect All
        if (isCtrlOrCmd && event.shiftKey && event.key === "A") {
            event.preventDefault();
            // Toggle: if any selected, deselect all; otherwise select all
            if (onSelectAll && onDeselectAll) {
                // This will be controlled by the parent component
                onSelectAll();
            }
            return;
        }

        // Ctrl/Cmd + Shift + T - Toggle TM
        if (isCtrlOrCmd && event.shiftKey && event.key === "T") {
            event.preventDefault();
            // Reserved for future: toggle translation memory
            return;
        }

    }, [disabled, isModalOpen, onSave, onTranslate, onSelectAll, onDeselectAll, onCloseModal]);

    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [handleKeyDown]);

    return null;
}

/**
 * Shortcut definitions for help display
 */
export const SHORTCUTS = [
    { keys: ["Cmd/Ctrl", "S"], action: "儲存翻譯進度", category: "general" },
    { keys: ["Cmd/Ctrl", "Enter"], action: "開始 AI 翻譯", category: "translate" },
    { keys: ["Cmd/Ctrl", "Shift", "A"], action: "全選/取消全選區塊", category: "selection" },
    { keys: ["Esc"], action: "關閉彈窗", category: "navigation" },
];

export default useKeyboardShortcuts;
