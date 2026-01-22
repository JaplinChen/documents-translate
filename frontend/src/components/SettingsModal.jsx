import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import LlmTab from "./settings/LlmTab";
import CorrectionTab from "./settings/CorrectionTab";
import PromptTab from "./settings/PromptTab";

import AiTab from "./settings/AiTab";
import { FontSettings } from "./settings/FontSettings";

const PROVIDERS = [
  { id: "ollama", name: "Ollama", subKey: "ollama", icon: "💻" },
  { id: "chatgpt", name: "ChatGPT (OpenAI)", subKey: "chatgpt", icon: "🤖" },
  { id: "gemini", name: "Gemini", subKey: "gemini", icon: "✨" }
];

import { useSettingsPrompts } from "../hooks/useSettingsPrompts";
import { SettingsSidebar } from "./settings/SettingsSidebar";

function SettingsModal({
  open, onClose, tab, setTab, llmProvider, setLlmProvider, llmApiKey, setLlmApiKey,
  llmBaseUrl, setLlmBaseUrl, llmModel, setLlmModel, llmFastMode, setLlmFastMode,
  llmModels, llmStatus, onDetect, onSave, onSaveCorrection, defaultBaseUrl,
  fillColor, setFillColor, textColor, setTextColor, lineColor, setLineColor,
  lineDash, setLineDash, llmTone, setLlmTone, useVisionContext, setUseVisionContext,
  useSmartLayout, setUseSmartLayout, onExtractGlossary, busy, status, apiBase,
  fontMapping, setFontMapping
}) {
  const { t } = useTranslation();
  const [showKey, setShowKey] = useState(false);
  const {
    promptList, selectedPrompt, setSelectedPrompt, promptContent, setPromptContent,
    promptStatus, promptLoading, handleSavePrompt, handleResetPrompt, PROMPT_LABELS
  } = useSettingsPrompts(open, tab, apiBase);

  if (!open) return null;

  const currentProvider = PROVIDERS.find((item) => item.id === llmProvider) || PROVIDERS[0];
  const displayedModels = [...(llmModels || [])];
  if (llmModel && !displayedModels.includes(llmModel)) displayedModels.unshift(llmModel);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="settings-shell">
          <SettingsSidebar
            tab={tab} setTab={setTab} PROVIDERS={PROVIDERS}
            llmProvider={llmProvider} setLlmProvider={setLlmProvider}
            promptList={promptList} selectedPrompt={selectedPrompt}
            setSelectedPrompt={setSelectedPrompt} PROMPT_LABELS={PROMPT_LABELS}
          />
          <div className="settings-main">
            <div className="modal-header fancy">
              <div className="header-title">
                {tab === "llm" && <h3>{currentProvider.name} {t("settings.title")}</h3>}
                {tab === "ai" && <h3>{t("settings.tabs.ai")}</h3>}
                {tab === "fonts" && <h3>{t("settings.tabs.fonts")}</h3>}
                {tab === "correction" && <h3>{t("settings.tabs.correction")} {t("settings.title")}</h3>}
                {tab === "prompt" && <h3>{t("settings.tabs.prompt")} {t("settings.title")}</h3>}
              </div>
              <div className="header-actions">
                {tab === "prompt" ? (
                  <>
                    <span className="text-xs text-green-600 mr-2">{promptStatus}</span>
                    <button className="btn-icon-action" type="button" onClick={handleResetPrompt} title={t("settings.prompt.reset")}>↺</button>
                    <button className="btn-icon-action" type="button" onClick={onClose} title={t("settings.prompt.close")}>✕</button>
                    <button className="btn-icon-action text-primary border-primary" type="button" onClick={() => handleSavePrompt(onClose)} title={t("settings.prompt.save")}>✔</button>
                  </>
                ) : (
                  <>
                    <button className="btn-icon-action" type="button" onClick={onClose}>✕</button>
                    <button className="btn-icon-action text-primary border-primary" type="button" onClick={tab === "llm" ? onSave : onSaveCorrection}>✔</button>
                  </>
                )}
              </div>
            </div>
            <div className="settings-content">
              {tab === "llm" && (
                <LlmTab
                  llmProvider={llmProvider} llmApiKey={llmApiKey} setLlmApiKey={setLlmApiKey}
                  llmBaseUrl={llmBaseUrl} setLlmBaseUrl={setLlmBaseUrl} llmFastMode={llmFastMode}
                  setLlmFastMode={setLlmFastMode} llmModel={llmModel} setLlmModel={setLlmModel}
                  displayedModels={displayedModels} onDetect={onDetect} llmStatus={llmStatus}
                  defaultBaseUrl={defaultBaseUrl} showKey={showKey} setShowKey={setShowKey}
                />
              )}
              {tab === "ai" && (
                <AiTab
                  llmTone={llmTone} setLlmTone={setLlmTone} useVisionContext={useVisionContext}
                  setUseVisionContext={setUseVisionContext} useSmartLayout={useSmartLayout}
                  setUseSmartLayout={setUseSmartLayout} onExtractGlossary={onExtractGlossary}
                  busy={busy} status={status}
                />
              )}
              {tab === "fonts" && <FontSettings fontMapping={fontMapping} setFontMapping={setFontMapping} />}
              {tab === "correction" && (
                <CorrectionTab
                  fillColor={fillColor} setFillColor={setFillColor} textColor={textColor}
                  setTextColor={setTextColor} lineColor={lineColor} setLineColor={setLineColor}
                  lineDash={lineDash} setLineDash={setLineDash}
                />
              )}
              {tab === "prompt" && (
                <PromptTab
                  promptList={promptList} selectedPrompt={selectedPrompt} setSelectedPrompt={setSelectedPrompt}
                  promptContent={promptContent} setPromptContent={setPromptContent}
                  promptLoading={promptLoading} PROMPT_LABELS={PROMPT_LABELS}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
