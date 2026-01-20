/**
 * BatchReplaceToolbar - Batch find & replace component
 * Supports exact match, regex, and case sensitivity options
 */
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

export function BatchReplaceToolbar({ onReplace, disabled = false }) {
    const { t } = useTranslation();
    const [isExpanded, setIsExpanded] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [replaceText, setReplaceText] = useState("");
    const [useRegex, setUseRegex] = useState(false);
    const [caseSensitive, setCaseSensitive] = useState(true);
    const [selectedOnly, setSelectedOnly] = useState(true);
    const [lastResult, setLastResult] = useState(null);

    const handleReplace = () => {
        if (!searchText.trim()) return;

        const count = onReplace(searchText, replaceText, {
            useRegex,
            caseSensitive,
            selectedOnly
        });

        setLastResult(count);
        // Clear result after 3 seconds
        setTimeout(() => setLastResult(null), 3000);
    };

    if (!isExpanded) {
        return (
            <button
                className="btn ghost compact batch-replace-toggle"
                type="button"
                onClick={() => setIsExpanded(true)}
                disabled={disabled}
                title={t("editor.batch.toggle_title")}
            >
                🔄 {t("editor.batch.toggle")}
            </button>
        );
    }

    return (
        <div className="batch-replace-toolbar">
            <div className="batch-replace-header">
                <span className="batch-replace-title">🔄 {t("editor.batch.title")}</span>
                <button
                    className="btn ghost compact"
                    type="button"
                    onClick={() => setIsExpanded(false)}
                    title={t("common.cancel")}
                >
                    ✕
                </button>
            </div>

            <div className="batch-replace-inputs">
                <div className="batch-replace-field">
                    <label className="field-label">{t("editor.batch.find")}</label>
                    <input
                        type="text"
                        className="select-input"
                        placeholder={t("editor.batch.find_placeholder")}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                </div>
                <div className="batch-replace-field">
                    <label className="field-label">{t("editor.batch.replace")}</label>
                    <input
                        type="text"
                        className="select-input"
                        placeholder={t("editor.batch.replace_placeholder")}
                        value={replaceText}
                        onChange={(e) => setReplaceText(e.target.value)}
                    />
                </div>
            </div>

            <div className="batch-replace-options">
                <label className="batch-option">
                    <input
                        type="checkbox"
                        checked={useRegex}
                        onChange={(e) => setUseRegex(e.target.checked)}
                    />
                    <span>{t("editor.batch.regex")}</span>
                </label>
                <label className="batch-option">
                    <input
                        type="checkbox"
                        checked={caseSensitive}
                        onChange={(e) => setCaseSensitive(e.target.checked)}
                    />
                    <span>{t("editor.batch.case_sensitive")}</span>
                </label>
                <label className="batch-option">
                    <input
                        type="checkbox"
                        checked={selectedOnly}
                        onChange={(e) => setSelectedOnly(e.target.checked)}
                    />
                    <span>{t("editor.batch.selected_only")}</span>
                </label>
            </div>

            <div className="batch-replace-actions">
                <button
                    className="btn primary compact"
                    type="button"
                    onClick={handleReplace}
                    disabled={disabled || !searchText.trim()}
                >
                    {t("editor.batch.replace_all")}
                </button>
                {lastResult !== null && (
                    <span className="batch-result">
                        {t("editor.batch.result", { count: lastResult })}
                    </span>
                )}
            </div>
        </div>
    );
}
