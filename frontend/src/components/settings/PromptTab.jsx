import React from "react";
import { useTranslation } from "react-i18next";

function PromptTab({
    promptList,
    selectedPrompt,
    setSelectedPrompt,
    promptContent,
    setPromptContent,
    promptLoading,
    PROMPT_LABELS
}) {
    const { t } = useTranslation();

    return (
        <div className="prompt-editor-container">
            <div className="prompt-selector-row">
                <label className="prompt-selector-label">{t("settings.prompt.select_prompt")}</label>
                <select
                    className="prompt-template-select"
                    value={selectedPrompt}
                    onChange={(event) => setSelectedPrompt(event.target.value)}
                >
                    {(promptList || []).map((name) => (
                        <option key={name} value={name}>
                            {(PROMPT_LABELS || {})[name] || name}
                        </option>
                    ))}
                </select>
            </div>
            <textarea
                className="prompt-textarea"
                value={promptContent}
                onChange={(event) => setPromptContent(event.target.value)}
                placeholder={promptLoading ? t("settings.prompt.loading") : t("settings.prompt.prompt_placeholder")}
                rows={16}
                spellCheck="false"
                disabled={promptLoading}
            />
        </div>
    );
}

export default PromptTab;
