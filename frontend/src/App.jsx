import React, { useEffect, useRef, useState } from "react";
import SettingsModal from "./components/SettingsModal";
import ManageModal from "./components/ManageModal";
import { Navbar } from "./components/Navbar";
import { Sidebar } from "./components/Sidebar";
import { EditorPanel } from "./components/EditorPanel";
import { API_BASE } from "./constants";

// Hooks
import { useLlmSettings } from "./hooks/useLlmSettings";
import { useTerminology } from "./hooks/useTerminology";
import { useAppUI } from "./hooks/useAppUI";
import { usePptxProcessor } from "./hooks/usePptxProcessor";

function App() {
  // --- Persistent States (Managed in App for sharing) ---
  const [file, setFile] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [mode, setMode] = useState("bilingual");
  const [bilingualLayout, setBilingualLayout] = useState("inline");
  const [sourceLang, setSourceLang] = useState("");
  const [secondaryLang, setSecondaryLang] = useState("");
  const [targetLang, setTargetLang] = useState("zh-TW");
  const [sourceLocked, setSourceLocked] = useState(false);
  const [secondaryLocked, setSecondaryLocked] = useState(false);
  const [targetLocked, setTargetLocked] = useState(false);

  // Correction Settings (with localStorage persistence)
  // Correction Settings (with localStorage persistence)
  const [fillColor, setFillColor] = useState(() => {
    const v = localStorage.getItem("correction_fillColor");
    return (v && v !== "undefined" && v !== "null") ? v : "#FFF16A";
  });
  const [textColor, setTextColor] = useState(() => {
    const v = localStorage.getItem("correction_textColor");
    return (v && v !== "undefined" && v !== "null") ? v : "#D90000";
  });
  const [lineColor, setLineColor] = useState(() => {
    const v = localStorage.getItem("correction_lineColor");
    return (v && v !== "undefined" && v !== "null") ? v : "#7B2CB9";
  });
  const [lineDash, setLineDash] = useState(() => {
    const v = localStorage.getItem("correction_lineDash");
    return (v && v !== "undefined" && v !== "null") ? v : "dash";
  });

  // Auto-save correction settings whenever they change
  useEffect(() => {
    if (fillColor) localStorage.setItem("correction_fillColor", fillColor);
    if (textColor) localStorage.setItem("correction_textColor", textColor);
    if (lineColor) localStorage.setItem("correction_lineColor", lineColor);
    if (lineDash) localStorage.setItem("correction_lineDash", lineDash);
  }, [fillColor, textColor, lineColor, lineDash]);

  // Advanced AI Settings
  const [llmTone, setLlmTone] = useState("professional"); // professional, concise, humorous, pm, creative
  const [useVisionContext, setUseVisionContext] = useState(true);
  const [useSmartLayout, setUseSmartLayout] = useState(true);

  const leftPanelRef = useRef(null);
  const editorRefs = useRef({});

  // --- Hooks Extraction ---
  const llm = useLlmSettings();
  const tm = useTerminology();
  const ui = useAppUI(blocks, leftPanelRef);

  const processor = usePptxProcessor({
    file, blocks, setBlocks,
    sourceLang, secondaryLang, targetLang, mode,
    useTm: tm.useTm,
    llmProvider: llm.llmProvider,
    llmApiKey: llm.llmApiKey,
    llmBaseUrl: llm.llmBaseUrl,
    llmModel: llm.llmModel,
    llmFastMode: llm.llmFastMode,
    bilingualLayout,
    fillColor, textColor, lineColor, lineDash,
    setStatus: ui.setStatus,
    setBusy: ui.setBusy
  });

  // --- Helpers ---
  const languageOptions = [
    { code: "auto", label: "自動" },
    { code: "vi", label: "越南語" },
    { code: "zh-TW", label: "繁體中文" },
    { code: "zh-CN", label: "簡體中文" },
    { code: "en", label: "英文" },
    { code: "ja", label: "日文" },
    { code: "ko", label: "韓文" }
  ];

  const extractLanguageLines = (text, lang) => {
    const cjkRegex = /[\u4e00-\u9fff\u3400-\u4dbf]/;
    const viRegex = /[\u00C0-\u00C3\u00C8-\u00CA\u00CC-\u00CD\u00D2-\u00D5\u00D9-\u00DA\u00DD\u00E0-\u00E3\u00E8-\u00EA\u00EC-\u00ED\u00F2-\u00F5\u00F9-\u00FA\u00FD\u0102\u0103\u0110\u0111\u0128\u0129\u0168\u0169\u01A0\u01A1\u01AF\u01B0\u1EA0-\u1EF9]/i;
    const lines = (text || "").split("\n").map(l => l.trim()).filter(Boolean);
    if (!lang || lang === "auto") return lines;
    if (lang.startsWith("zh")) return lines.filter(l => cjkRegex.test(l));
    if (lang === "vi") return lines.filter(l => viRegex.test(l));
    return lines;
  };

  const applyDetectedLanguages = (summary) => {
    const primary = summary?.primary || "";
    const secondary = summary?.secondary || "";
    if (!sourceLocked && primary) setSourceLang(primary);
    if (!secondaryLocked && secondary) setSecondaryLang(secondary);
    if (!targetLocked) setTargetLang(secondary || "zh-TW");
  };

  // --- Effects ---
  // Auto-extract: When file is selected, immediately extract text and detect language
  // This is separate from translation - just getting the content ready
  useEffect(() => {
    if (!file) return;
    processor.handleExtract().then(applyDetectedLanguages);
  }, [file]);

  useEffect(() => {
    document.documentElement.style.setProperty("--correction-fill", fillColor);
    document.documentElement.style.setProperty("--correction-text", textColor);
    document.documentElement.style.setProperty("--correction-line", lineColor);
  }, [fillColor, textColor, lineColor]);

  const handleBlockChange = (uid, value) => {
    setBlocks(prev => prev.map(b => b._uid === uid ? { ...b, translated_text: value } : b));
  };

  const handleBlockSelect = (uid, checked) => {
    setBlocks(prev => prev.map(b => b._uid === uid ? { ...b, selected: checked } : b));
  };

  const handleOutputModeChange = (uid, value) => {
    setBlocks(prev => prev.map(b => b._uid === uid ? { ...b, output_mode: value } : b));
  };

  const isFileSelected = !!file;
  const isExtracted = blocks.length > 0;
  const hasTranslation = blocks.some(b => b.translated_text);
  const isFinished = ui.status.includes("輸出") || ui.status.includes("完成");

  // Determine current step (1-4): Upload → Settings → Translate → Download
  let currentStep = 1;
  if (isFinished) currentStep = 4;
  else if (hasTranslation || ui.status.includes("翻譯")) currentStep = 3;
  else if (isExtracted) currentStep = 2;

  const steps = [
    { id: 1, label: "上傳" },
    { id: 2, label: "設定" },
    { id: 3, label: "翻譯" },
    { id: 4, label: "下載" }
  ];

  return (
    <div className="app">
      <div className="app-sticky-header">
        <Navbar
          currentStep={currentStep}
          steps={steps}
          status={ui.status}
          progress={processor.progress}
          onOpenSettings={() => llm.setLlmOpen(true)}
          onOpenManage={() => tm.setManageOpen(true)}
        />
      </div>

      <main className="main-grid">
        <Sidebar
          file={file} setFile={setFile}
          mode={mode} setMode={setMode}
          bilingualLayout={bilingualLayout} setBilingualLayout={setBilingualLayout}
          sourceLang={sourceLang} setSourceLang={setSourceLang} setSourceLocked={setSourceLocked}
          secondaryLang={secondaryLang} setSecondaryLang={setSecondaryLang} setSecondaryLocked={setSecondaryLocked}
          targetLang={targetLang} setTargetLang={setTargetLang} setTargetLocked={setTargetLocked}
          useTm={tm.useTm} setUseTm={tm.setUseTm}
          languageOptions={languageOptions}
          busy={ui.busy}
          onExtract={processor.handleExtract}
          onExtractGlossary={() => tm.handleExtractGlossary({
            blocks,
            targetLang,
            llmProvider: llm.llmProvider,
            llmApiKey: llm.llmApiKey,
            llmBaseUrl: llm.llmBaseUrl,
            llmModel: llm.llmModel,
            setStatus: ui.setStatus,
            setBusy: ui.setBusy
          })}
          onTranslate={processor.handleTranslate}
          onApply={processor.handleApply}
          canApply={file && blocks.length > 0 && !ui.busy}
          blockCount={blocks.length}
          selectedCount={blocks.filter(b => b.selected !== false).length}
          status={ui.status}
          sidebarRef={leftPanelRef}
          modeDescription={mode === "correction" ? "中文校正模式" : "翻譯模式"}
          llmTone={llmTone} setLlmTone={setLlmTone}
          useVisionContext={useVisionContext} setUseVisionContext={setUseVisionContext}
          useSmartLayout={useSmartLayout} setUseSmartLayout={setUseSmartLayout}
          blocks={blocks}
        />

        <EditorPanel
          blockCount={blocks.length}
          filteredBlocks={ui.filteredBlocks}
          filterText={ui.filterText} setFilterText={ui.setFilterText}
          filterType={ui.filterType} setFilterType={ui.setFilterType}
          filterSlide={ui.filterSlide} setFilterSlide={ui.setFilterSlide}
          onSelectAll={() => setBlocks(prev => prev.map(b => ({ ...b, selected: true })))}
          onClearSelection={() => setBlocks(prev => prev.map(b => ({ ...b, selected: false })))}
          onBlockSelect={handleBlockSelect}
          onBlockChange={handleBlockChange}
          onOutputModeChange={handleOutputModeChange}
          onAddGlossary={tm.upsertGlossary}
          onAddMemory={tm.upsertMemory}
          mode={mode}
          sourceLang={sourceLang}
          secondaryLang={secondaryLang}
          extractLanguageLines={extractLanguageLines}
          editorRefs={editorRefs}
        />
      </main>

      <SettingsModal
        open={llm.llmOpen} onClose={() => llm.setLlmOpen(false)}
        tab={llm.llmTab} setTab={llm.setLlmTab}
        llmProvider={llm.llmProvider} setLlmProvider={llm.setLlmProvider}
        llmApiKey={llm.llmApiKey} setLlmApiKey={llm.setLlmApiKey}
        llmBaseUrl={llm.llmBaseUrl} setLlmBaseUrl={llm.setLlmBaseUrl}
        llmModel={llm.llmModel} setLlmModel={llm.setLlmModel}
        llmFastMode={llm.llmFastMode} setLlmFastMode={llm.setLlmFastMode}
        llmModels={llm.llmModels} llmStatus={llm.llmStatus}
        onDetect={llm.handleDetectModels} onSave={llm.handleSaveLlm}
        onSaveCorrection={() => {
          // Triggered when "Check" button is clicked in Correction tab
          // Settings are already auto-saved via useEffect above
          ui.setStatus("已儲存設定");
          llm.setLlmOpen(false);
        }}
        defaultBaseUrl={llm.defaultBaseUrl}
        fillColor={fillColor} setFillColor={setFillColor}
        textColor={textColor} setTextColor={setTextColor}
        lineColor={lineColor} setLineColor={setLineColor}
        lineDash={lineDash} setLineDash={setLineDash}

        llmTone={llmTone} setLlmTone={setLlmTone}
        useVisionContext={useVisionContext} setUseVisionContext={setUseVisionContext}
        useSmartLayout={useSmartLayout} setUseSmartLayout={setUseSmartLayout}
        onExtractGlossary={() => tm.handleExtractGlossary({
          blocks,
          targetLang,
          llmProvider: llm.llmProvider,
          llmApiKey: llm.llmApiKey,
          llmBaseUrl: llm.llmBaseUrl,
          llmModel: llm.llmModel,
          setStatus: ui.setStatus,
          setBusy: ui.setBusy
        })}
        busy={ui.busy}
        status={ui.status}
        apiBase={API_BASE}
      />

      <ManageModal
        open={tm.manageOpen} onClose={() => tm.setManageOpen(false)}
        tab={tm.manageTab} setTab={tm.setManageTab}
        languageOptions={languageOptions}
        defaultSourceLang={sourceLang || "vi"}
        defaultTargetLang={targetLang || "zh-TW"}
        glossaryItems={tm.glossaryItems}
        tmItems={tm.tmItems}
        onSeed={tm.handleSeedTm}
        onUpsertGlossary={tm.upsertGlossary}
        onDeleteGlossary={tm.deleteGlossary}
        onClearGlossary={tm.clearGlossary}
        onUpsertMemory={tm.upsertMemory}
        onDeleteMemory={tm.deleteMemory}
        onClearMemory={tm.clearMemory}
        onConvertToGlossary={tm.convertMemoryToGlossary}
        onConvertToPreserveTerm={tm.convertGlossaryToPreserveTerm}
      />

    </div>
  );
}

export default App;
