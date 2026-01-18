import React, { useEffect, useState } from "react";
import LlmTab from "./settings/LlmTab";
import CorrectionTab from "./settings/CorrectionTab";
import PromptTab from "./settings/PromptTab";
import AiTab from "./settings/AiTab";

const PROMPT_LABELS = {
  translate_json: "翻譯 JSON 提示",
  system_message: "System 提示",
  ollama_batch: "Ollama 批次提示"
};

const PROVIDERS = [
  { id: "ollama", name: "Ollama", sub: "本機模型", icon: "💻" },
  { id: "chatgpt", name: "ChatGPT (OpenAI)", sub: "標準 API", icon: "🤖" },
  { id: "gemini", name: "Gemini", sub: "Google AI Studio", icon: "✨" }
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
  const [showKey, setShowKey] = useState(false);
  const [promptList, setPromptList] = useState([]);
  const [selectedPrompt, setSelectedPrompt] = useState("");
  const [promptContent, setPromptContent] = useState("");
  const [promptStatus, setPromptStatus] = useState("");
  const [promptLoading, setPromptLoading] = useState(false);

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
    setPromptStatus("儲存中...");
    try {
      await fetch(`${apiBase}/api/prompts/${selectedPrompt}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: promptContent })
      });
      setPromptStatus("已儲存");
      setTimeout(() => setPromptStatus(""), 2000);
      onClose();
    } catch (error) {
      setPromptStatus("儲存失敗");
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-wide" onClick={(event) => event.stopPropagation()}>
        <div className="settings-shell">
          <aside className="settings-sidebar">
            <h4 className="sidebar-title">設定</h4>
            <div className="sidebar-tabs">
              {["llm", "ai", "correction", "prompt"].map((t) => (
                <button
                  key={t}
                  className={`sidebar-tab ${tab === t ? "active" : ""}`}
                  type="button"
                  onClick={() => setTab(t)}
                >
                  {t === "llm" ? "LLM" : t === "ai" ? "AI 智控" : t === "correction" ? "校正" : "Prompt"}
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
                      <div className="sidebar-sub">{item.sub}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {tab === "prompt" && (
              <div className="sidebar-list">
                {(promptList || []).length === 0 ? (
                  <div className="sidebar-empty">尚無 Prompt</div>
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
                        <div className="sidebar-name">{PROMPT_LABELS[name] || name}</div>
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
                {tab === "llm" && <h3>{currentProvider.name} 設定</h3>}
                {tab === "ai" && <h3>AI 進階智控</h3>}
                {tab === "correction" && <h3>校正設定</h3>}
                {tab === "prompt" && <h3>Prompt 設定</h3>}
              </div>
              <div className="header-actions">
                {tab === "prompt" ? (
                  <>
                    <a className="text-xs text-green-600 mr-2">{promptStatus}</a>
                    <button className="btn-icon-action" type="button" onClick={handleResetPrompt} title="重置 Prompt">↺</button>
                    <button className="btn-icon-action text-2xl" type="button" onClick={onClose} title="關閉">✕</button>
                    <button className="btn-icon-action text-primary border-primary text-2xl" type="button" onClick={handleSavePrompt} title="儲存 Prompt">✔</button>
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
                  PROMPT_LABELS={PROMPT_LABELS}
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
