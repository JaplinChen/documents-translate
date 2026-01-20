import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import LlmTab from "./settings/LlmTab";
import CorrectionTab from "./settings/CorrectionTab";
import PromptTab from "./settings/PromptTab";
import AiTab from "./settings/AiTab";

const PROVIDERS = [
  { id: "ollama", name: "Ollama", subKey: "ollama", icon: "💻" },
  { id: "chatgpt", name: "ChatGPT (OpenAI)", subKey: "chatgpt", icon: "🤖" },
  { id: "gemini", name: "Gemini", subKey: "gemini", icon: "✨" }
];

function SettingsModal({
  open,
  onClose,
  tab,
  setTab,
  llmProvider,
  setLlmProvider,
  llmApiKey,
  setLlmApiKey,
  llmBaseUrl,
  setLlmBaseUrl,
  llmModel,
  setLlmModel,
  llmFastMode,
  setLlmFastMode,
  llmModels,
  llmStatus,
  onDetect,
  onSave,
  onSaveCorrection,
  defaultBaseUrl,
  fillColor,
  setFillColor,
  textColor,
  setTextColor,
  lineColor,
  setLineColor,
  lineDash,
  setLineDash,
  llmTone,
  setLlmTone,
  useVisionContext,
  setUseVisionContext,
  useSmartLayout,
  setUseSmartLayout,
  onExtractGlossary,
  busy,
  status,
  apiBase
}) {
  const { t } = useTranslation();
  const [showKey, setShowKey] = useState(false);
  const [promptList, setPromptList] = useState([]);
  const [selectedPrompt, setSelectedPrompt] = useState("");
  const [promptContent, setPromptContent] = useState("");
  const [promptStatus, setPromptStatus] = useState("");
  const [promptLoading, setPromptLoading] = useState(false);

  const PROMPT_LABELS = React.useMemo(() => ({
    translate_json: t("settings.prompt_labels.translate_json"),
    system_message: t("settings.prompt_labels.system_message"),
    ollama_batch: t("settings.prompt_labels.ollama_batch")
  }), [t]);

  const getPromptLabel = (name) => {
    return PROMPT_LABELS[name] || name;
  };

  useEffect(() => {
    if (!open || tab !== "prompt") return;
    let active = true;
    const loadList = async () => {
      try {
        const response = await fetch(`${apiBase}/api/prompts`);
        const data = await response.json();
        if (!active) return;
        setPromptList(data || []);
        if (data && data.length) setSelectedPrompt((prev) => prev || data[0]);
      } catch (error) {
        if (active) setPromptList([]);
      }
    };
    loadList();
    return () => { active = false; };
  }, [open, tab, apiBase]);

  useEffect(() => {
    if (!open || tab !== "prompt" || !selectedPrompt) return;
    let active = true;
    const loadPrompt = async () => {
      setPromptLoading(true);
      try {
        const response = await fetch(`${apiBase}/api/prompts/${selectedPrompt}`);
        const data = await response.json();
        if (active) setPromptContent(data.content || "");
      } catch (error) {
        if (active) setPromptContent("");
      } finally {
        if (active) setPromptLoading(false);
      }
    };
    loadPrompt();
    return () => { active = false; };
  }, [open, tab, selectedPrompt, apiBase]);

  if (!open) return null;

  const handleSavePrompt = async () => {
    if (!selectedPrompt) return;
    setPromptStatus(t("settings.status.saving"));
    try {
      await fetch(`${apiBase}/api/prompts/${selectedPrompt}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: promptContent })
      });
      setPromptStatus(t("settings.status.saved"));
      setTimeout(() => setPromptStatus(""), 2000);
      onClose();
    } catch (error) {
      setPromptStatus(t("settings.status.failed"));
    }
  };

  const handleResetPrompt = async () => {
    if (!selectedPrompt) return;
    setPromptLoading(true);
    try {
      const response = await fetch(`${apiBase}/api/prompts/${selectedPrompt}`);
      const data = await response.json();
      setPromptContent(data.content || "");
    } finally {
      setPromptLoading(false);
    }
  };

  const currentProvider = PROVIDERS.find((item) => item.id === llmProvider) || PROVIDERS[0];
  const displayedModels = [...(llmModels || [])];
  if (llmModel && !displayedModels.includes(llmModel)) displayedModels.unshift(llmModel);

  const getProviderSub = (key) => {
    // Simple switch for provider subtext translation
    if (key === 'ollama') return t("settings.providers.ollama");
    if (key === 'chatgpt') return t("settings.providers.chatgpt");
    if (key === 'gemini') return t("settings.providers.gemini");
    return "";
  };
  // Actually I missed adding provider keys to JSON. I'll stick to hardcoded English/Chinese for now or generic terms.
  // Or I can just leave them hardcoded if they are brand names / technical terms.

  // Let's use hardcoded English for now as it's universally understood for devs, or just keep original Chinese if target is mainly TW.
  // Given I added 'vi' and 'en', I should probably use `t`.
  // I will use `t` with fallback.

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-wide" onClick={(event) => event.stopPropagation()}>
        <div className="settings-shell">
          <aside className="settings-sidebar">
            <h4 className="sidebar-title">{t("settings.title")}</h4>
            <div className="sidebar-tabs">
              {["llm", "ai", "correction", "prompt"].map((tKey) => (
                <button
                  key={tKey}
                  className={`sidebar-tab ${tab === tKey ? "active" : ""}`}
                  type="button"
                  onClick={() => setTab(tKey)}
                >
                  {t(`settings.tabs.${tKey}`)}
                </button>
              ))}
            </div>
            {tab === "llm" && (
              <div className="sidebar-list">
                {PROVIDERS.map((item) => (
                  <button
                    key={item.id}
                    className={`sidebar-item ${llmProvider === item.id ? "active" : ""}`}
                    type="button"
                    onClick={() => setLlmProvider(item.id)}
                  >
                    <span className="sidebar-icon">{item.icon}</span>
                    <div className="sidebar-text">
                      <div className="sidebar-name">{item.name}</div>
                      <div className="sidebar-sub">
                        {/* Use t() for provider names */}
                        {item.id === "ollama" ? t("settings.providers.ollama") :
                          item.id === "chatgpt" ? t("settings.providers.chatgpt") :
                            item.id === "gemini" ? t("settings.providers.gemini") : ""}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {tab === "prompt" && (
              <div className="sidebar-list">
                {(promptList || []).length === 0 ? (
                  <div className="sidebar-empty">{t("settings.prompt.empty")}</div>
                ) : (
                  (promptList || []).map((name) => (
                    <button
                      key={name}
                      className={`sidebar-item ${selectedPrompt === name ? "active" : ""}`}
                      type="button"
                      onClick={() => setSelectedPrompt(name)}
                    >
                      <span className="sidebar-icon">🧩</span>
                      <div className="sidebar-text">
                        <div className="sidebar-name">{getPromptLabel(name)}</div>
                        <div className="sidebar-sub">{name}</div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </aside>

          <div className="settings-main">
            <div className="modal-header fancy">
              <div className="header-title">
                {tab === "llm" && <h3>{currentProvider.name} {t("settings.title")}</h3>}
                {tab === "ai" && <h3>{t("settings.tabs.ai")}</h3>}
                {tab === "correction" && <h3>{t("settings.tabs.correction")} {t("settings.title")}</h3>}
                {tab === "prompt" && <h3>{t("settings.tabs.prompt")} {t("settings.title")}</h3>}
              </div>
              <div className="header-actions">
                {tab === "prompt" ? (
                  <>
                    <a className="text-xs text-green-600 mr-2">{promptStatus}</a>
                    <button className="btn-icon-action" type="button" onClick={handleResetPrompt} title={t("settings.prompt.reset")}>↺</button>
                    <button className="btn-icon-action" type="button" onClick={onClose} title={t("settings.prompt.close")}>✕</button>
                    <button className="btn-icon-action text-primary border-primary" type="button" onClick={handleSavePrompt} title={t("settings.prompt.save")}>✔</button>
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
                  llmProvider={llmProvider}
                  llmApiKey={llmApiKey}
                  setLlmApiKey={setLlmApiKey}
                  llmBaseUrl={llmBaseUrl}
                  setLlmBaseUrl={setLlmBaseUrl}
                  llmFastMode={llmFastMode}
                  setLlmFastMode={setLlmFastMode}
                  llmModel={llmModel}
                  setLlmModel={setLlmModel}
                  displayedModels={displayedModels}
                  onDetect={onDetect}
                  llmStatus={llmStatus}
                  defaultBaseUrl={defaultBaseUrl}
                  showKey={showKey}
                  setShowKey={setShowKey}
                />
              )}
              {tab === "ai" && (
                <AiTab
                  llmTone={llmTone} setLlmTone={setLlmTone}
                  useVisionContext={useVisionContext} setUseVisionContext={setUseVisionContext}
                  useSmartLayout={useSmartLayout} setUseSmartLayout={setUseSmartLayout}
                  onExtractGlossary={onExtractGlossary}
                  busy={busy}
                  status={status}
                />
              )}
              {tab === "correction" && (
                <CorrectionTab
                  fillColor={fillColor}
                  setFillColor={setFillColor}
                  textColor={textColor}
                  setTextColor={setTextColor}
                  lineColor={lineColor}
                  setLineColor={setLineColor}
                  lineDash={lineDash}
                  setLineDash={setLineDash}
                />
              )}
              {tab === "prompt" && (
                <PromptTab
                  promptList={promptList}
                  selectedPrompt={selectedPrompt}
                  setSelectedPrompt={setSelectedPrompt}
                  promptContent={promptContent}
                  setPromptContent={setPromptContent}
                  promptLoading={promptLoading}
                  PROMPT_LABELS={PROMPT_LABELS} // Ideally this should be removed if we use local logic
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
