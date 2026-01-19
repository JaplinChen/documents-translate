import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { OLLAMA_BASE_URLS } from "../../constants";

function LlmTab({
    llmProvider,
    llmApiKey,
    setLlmApiKey,
    llmBaseUrl,
    setLlmBaseUrl,
    llmFastMode,
    setLlmFastMode,
    llmModel,
    setLlmModel,
    displayedModels,
    onDetect,
    llmStatus,
    defaultBaseUrl,
    showKey,
    setShowKey
}) {
    const { t } = useTranslation();

    const [showPresets, setShowPresets] = useState(false);
    const presetsRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (presetsRef.current && !presetsRef.current.contains(event.target)) {
                setShowPresets(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <form onSubmit={(event) => event.preventDefault()}>
            {llmProvider !== "ollama" ? (
                <div className="config-field compact">
                    <label>{t("settings.llm.api_key")}</label>
                    <div className="inline-row">
                        <input
                            name="llmApiKey"
                            type={showKey ? "text" : "password"}
                            value={llmApiKey}
                            onChange={(event) => setLlmApiKey(event.target.value)}
                            autoComplete="new-password"
                            placeholder={t("settings.llm.api_key_placeholder")}
                        />
                        <button
                            className="btn-icon-action"
                            type="button"
                            onClick={() => setShowKey((prev) => !prev)}
                        >
                            {showKey ? "🙈" : "👁️"}
                        </button>
                    </div>
                    <p className="hint">{t("settings.llm.api_key_hint")}</p>
                </div>
            ) : (
                <div className="config-field compact">
                    <label>{t("settings.llm.base_url")}</label>
                    <div className="inline-row" ref={presetsRef}>
                        <input
                            type="text"
                            value={llmBaseUrl}
                            onChange={(event) => setLlmBaseUrl(event.target.value)}
                            placeholder={defaultBaseUrl}
                            className="flex-grow"
                        />
                        <div className="relative">
                            <button
                                type="button"
                                className="h-9 px-3 rounded-md border border-slate-200 bg-slate-50 text-slate-600 text-xs font-medium hover:bg-white hover:text-blue-600 hover:border-blue-200 transition-all flex items-center gap-1"
                                onClick={() => setShowPresets(!showPresets)}
                            >
                                ⚡ Presets
                            </button>

                            {showPresets && (
                                <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 p-1.5 z-50 flex flex-col gap-1 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                    <div className="px-2 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 rounded-md mb-1">
                                        Common Endpoints
                                    </div>
                                    {OLLAMA_BASE_URLS.map((url) => (
                                        <button
                                            key={url}
                                            type="button"
                                            className="text-left px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-700 hover:font-medium transition-colors w-full truncate"
                                            onClick={() => {
                                                setLlmBaseUrl(url);
                                                setShowPresets(false);
                                            }}
                                            title={url}
                                        >
                                            {url}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <p className="hint">{t("settings.llm.base_url_hint", { url: defaultBaseUrl })}</p>
                </div>
            )}

            {llmProvider === "ollama" ? (
                <div className="config-field compact mt-6 mb-6">
                    <label>{t("settings.llm.fast_mode")}</label>
                    <label className="toggle-row">
                        <input
                            type="checkbox"
                            checked={llmFastMode}
                            onChange={(event) => setLlmFastMode(event.target.checked)}
                        />
                        <span>{t("settings.llm.fast_mode_label")}</span>
                    </label>
                </div>
            ) : null}

            <div className="config-field compact">
                <div className="inline-row between">
                    <label>{t("settings.llm.model")}</label>
                    <button className="text-btn" type="button" onClick={onDetect}>
                        {t("settings.llm.refresh")}
                    </button>
                </div>
                <select
                    className="model-select"
                    value={llmModel}
                    onChange={(event) => setLlmModel(event.target.value)}
                >
                    {(displayedModels || []).length === 0 ? (
                        <option value="">{t("settings.llm.select_model")}</option>
                    ) : (
                        (displayedModels || []).map((model) => (
                            <option key={model} value={model}>
                                {model}
                            </option>
                        ))
                    )}
                </select>
                <div className="inline-row">
                    <input
                        type="text"
                        value={llmModel}
                        onChange={(event) => setLlmModel(event.target.value)}
                        placeholder={t("settings.llm.custom_model")}
                    />
                    <button className="btn ghost" type="button" onClick={() => setLlmModel(llmModel)}>
                        {t("settings.llm.add")}
                    </button>
                </div>
                <p className="hint">{llmStatus || t("settings.llm.detect_hint")}</p>
            </div>
        </form>
    );
}

export default LlmTab;
