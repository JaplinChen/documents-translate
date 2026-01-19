import React from "react";
import { useTranslation } from "react-i18next";

function AiTab({
    llmTone, setLlmTone,
    useVisionContext, setUseVisionContext,
    useSmartLayout, setUseSmartLayout,
    onExtractGlossary,
    busy,
    status
}) {
    const { t } = useTranslation();

    return (
        <div className="tab-pane">
            <div className="settings-section">
                <h4 className="section-title">{t("settings.ai.tone_title")}</h4>
                <div className="form-group mt-4">
                    <label className="field-label">{t("settings.ai.tone_label")}</label>
                    <select
                        className="select-input"
                        value={llmTone}
                        onChange={(e) => setLlmTone(e.target.value)}
                    >
                        <option value="professional">{t("settings.ai.tone_options.professional")}</option>
                        <option value="concise">{t("settings.ai.tone_options.concise")}</option>
                        <option value="pm">{t("settings.ai.tone_options.pm")}</option>
                        <option value="humorous">{t("settings.ai.tone_options.humorous")}</option>
                        <option value="creative">{t("settings.ai.tone_options.creative")}</option>
                        <option value="academic">{t("settings.ai.tone_options.academic")}</option>
                    </select>
                    <p className="field-hint">{t("settings.ai.tone_hint")}</p>
                </div>
            </div>

            <div className="settings-section mt-6">
                <h4 className="section-title">{t("settings.ai.context_title")}</h4>
                <div className="toggle-list">
                    <label className="toggle-check">
                        <input
                            type="checkbox"
                            checked={useVisionContext}
                            onChange={(e) => setUseVisionContext(e.target.checked)}
                        />
                        <span>{t("settings.ai.vision")}</span>
                    </label>
                    <p className="field-hint pl-6 mb-4">{t("settings.ai.vision_hint")}</p>

                    <label className="toggle-check">
                        <input
                            type="checkbox"
                            checked={useSmartLayout}
                            onChange={(e) => setUseSmartLayout(e.target.checked)}
                        />
                        <span>{t("settings.ai.layout")}</span>
                    </label>
                    <p className="field-hint pl-6">{t("settings.ai.layout_hint")}</p>
                </div>
            </div>

        </div>
    );
}

export default AiTab;
