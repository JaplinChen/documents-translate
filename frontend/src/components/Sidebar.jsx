import React, { useState, useEffect } from "react";
import { API_BASE } from "../constants";

// Inline ExportButton component for multi-format exports
function ExportButton({ format, label, blocks, disabled }) {
    const [exporting, setExporting] = useState(false);

    const handleExport = async () => {
        if (disabled || exporting || !blocks?.length) return;
        setExporting(true);
        try {
            const response = await fetch(`${API_BASE}/api/export/${format}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ blocks }),
            });
            if (!response.ok) throw new Error("匯出失敗");
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `translation.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Export error:", err);
        } finally {
            setExporting(false);
        }
    };

    return (
        <button
            className="btn secondary btn-sm"
            onClick={handleExport}
            disabled={disabled || exporting}
            style={{ padding: "6px 12px", fontSize: "12px" }}
        >
            {exporting ? "..." : label}
        </button>
    );
}

export function Sidebar({
    file, setFile,
    mode, setMode,
    bilingualLayout, setBilingualLayout,
    sourceLang, setSourceLang, setSourceLocked,
    secondaryLang, setSecondaryLang, setSecondaryLocked,
    targetLang, setTargetLang, setTargetLocked,
    useTm, setUseTm,
    languageOptions,
    busy,
    onExtract,
    onExtractGlossary,
    onTranslate,
    onApply,
    canApply,
    blockCount,
    selectedCount,
    status,
    sidebarRef,
    modeDescription,
    llmTone, setLlmTone,
    useVisionContext, setUseVisionContext,
    useSmartLayout, setUseSmartLayout,
    blocks  // Add blocks prop for export functionality
}) {
    const isFileSelected = !!file;
    const isExtracted = blockCount > 0;

    // 精確狀態判斷 - 使用完全匹配或開頭匹配，避免子字串誤判
    const hasTranslation = status === "翻譯完成" || status.startsWith("翻譯完成");
    const isFinished = status === "已輸出檔案" || status === "下載完成";

    const [openSections, setOpenSections] = useState({
        step1: true,
        step2: false,
        step3: false,
        step4: false
    });

    // Auto-open sections based on progress
    // 只在特定狀態變化時觸發，優先順序從下往上（最終狀態優先）
    useEffect(() => {
        // 最終狀態：已輸出
        if (isFinished) {
            setOpenSections({ step1: false, step2: false, step3: false, step4: true });
            return;
        }

        // 翻譯完成：展開下載
        if (hasTranslation) {
            setOpenSections({ step1: false, step2: false, step3: false, step4: true });
            return;
        }

        // 有區塊但未翻譯：展開設定與翻譯
        if (isExtracted && !hasTranslation) {
            setOpenSections({ step1: false, step2: true, step3: true, step4: false });
            return;
        }

        // 只有選擇檔案（等待解析）：展開設定
        if (isFileSelected && !isExtracted) {
            setOpenSections({ step1: false, step2: true, step3: false, step4: false });
            return;
        }

        // 初始狀態
        setOpenSections({ step1: true, step2: false, step3: false, step4: false });
    }, [isFileSelected, isExtracted, hasTranslation, isFinished]);

    const toggleSection = (section) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    return (
        <section className="panel panel-left" ref={sidebarRef}>
            <div className="panel-header">
                <h2>引導導航</h2>
                <p>請依序完成各項配置</p>
            </div>

            <div className="sidebar-scrollable-content">
                {/* Step 1: 上傳檔案 */}
                <div className={`accordion-section ${openSections.step1 ? "is-open" : ""} ${isFileSelected ? "is-done" : ""}`}>
                    <div className="accordion-header" onClick={() => toggleSection("step1")}>
                        <span>{isFileSelected ? "✓" : "1."} 上傳檔案</span>
                        <span className="accordion-indicator">▼</span>
                    </div>
                    <div className="accordion-content" style={{ maxHeight: openSections.step1 ? "500px" : "0", opacity: openSections.step1 ? 1 : 0 }}>
                        <div className="form-group pt-2">
                            <div className="file-input-container">
                                <label className={`file-input-label ${isFileSelected ? "is-selected" : ""}`}>
                                    <span className="icon">{isFileSelected ? "📄" : "📁"}</span>
                                    <div className="flex flex-col items-center">
                                        <span className="text-main">
                                            {isFileSelected ? file.name : "選擇或拖放 PPTX 檔案"}
                                        </span>
                                        {!isFileSelected && <span className="text-sub">支援微軟 PowerPoint (.pptx)</span>}
                                        {isFileSelected && <span className="text-sub text-blue-600">✓ 已就緒</span>}
                                    </div>
                                    <input
                                        className="file-input-hidden"
                                        type="file"
                                        accept=".pptx"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    />
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Step 2: 設定 */}
                <div className={`accordion-section ${openSections.step2 ? "is-open" : ""} ${isExtracted ? "is-done" : ""}`}>
                    <div className="accordion-header" onClick={() => toggleSection("step2")}>
                        <span>{isExtracted ? "✓" : "2."} 設定</span>
                        <span className="accordion-indicator">▼</span>
                    </div>
                    <div className="accordion-content" style={{ maxHeight: openSections.step2 ? "800px" : "0", opacity: openSections.step2 ? 1 : 0 }}>
                        <div className="space-y-4 pt-2">
                            <div className="row-group">
                                <div className="form-group">
                                    <label className="field-label">模式</label>
                                    <select className="select-input" value={mode} onChange={(e) => setMode(e.target.value)}>
                                        <option value="bilingual">雙語輸出</option>
                                        <option value="translated">翻譯文件</option>
                                        <option value="correction">校正模式</option>
                                    </select>
                                </div>
                                {mode === "bilingual" && (
                                    <div className="form-group">
                                        <label className="field-label">版面</label>
                                        <select className="select-input" value={bilingualLayout} onChange={(e) => setBilingualLayout(e.target.value)}>
                                            <option value="inline">同框</option>
                                            <option value="auto">自動</option>
                                            <option value="new_slide">新頁</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="field-label">語言設定</label>
                                <div className="row-group-3">
                                    <select className="select-input" value={sourceLang || "auto"} onChange={(e) => { setSourceLang(e.target.value); setSourceLocked(true); }}>
                                        {(languageOptions || []).map(opt => <option key={opt.code} value={opt.code}>{opt.label}</option>)}
                                    </select>
                                    <div className="text-center font-bold text-slate-300">→</div>
                                    <select className="select-input" value={targetLang} onChange={(e) => { setTargetLang(e.target.value); setTargetLocked(true); }}>
                                        {(languageOptions || []).filter(opt => opt.code !== "auto").map(opt => <option key={opt.code} value={opt.code}>{opt.label}</option>)}
                                    </select>
                                </div>
                            </div>

                            <label className="toggle-check">
                                <input type="checkbox" checked={useTm} onChange={(e) => setUseTm(e.target.checked)} />
                                使用翻譯記憶庫
                            </label>

                            {isExtracted && (
                                <p className="field-hint">✓ 已自動解析 {blockCount} 個區塊</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Step 3: 翻譯 */}
                <div className={`accordion-section ${openSections.step3 ? "is-open" : ""} ${hasTranslation ? "is-done" : ""}`}>
                    <div className="accordion-header" onClick={() => toggleSection("step3")}>
                        <span>{hasTranslation ? "✓" : "3."} 翻譯</span>
                        <span className="accordion-indicator">▼</span>
                    </div>
                    <div className="accordion-content" style={{ maxHeight: openSections.step3 ? "400px" : "0", opacity: openSections.step3 ? 1 : 0 }}>
                        <div className="py-2 flex flex-col gap-3">
                            {/* 智慧提取核心術語庫 */}
                            <div className="smart-extract-section">
                                <p className="field-label mb-2">數據預處理</p>
                                <button
                                    className="btn secondary w-full"
                                    onClick={onExtractGlossary}
                                    disabled={busy || !isExtracted}
                                >
                                    📊 智慧提取核心術語庫
                                </button>
                                <p className="field-hint mt-1">預先分析簡報內容，設定專業名詞以確保翻譯一致</p>
                            </div>

                            <hr className="border-slate-200" />

                            {/* AI 翻譯 */}
                            <button
                                className={`btn primary w-full ${isExtracted && !status.includes("翻譯") ? "pulse-shadow" : ""}`}
                                onClick={onTranslate}
                                disabled={busy || !isExtracted}
                            >
                                {status.includes("翻譯") ? "AI 執行中..." : "🚀 開始 AI 自動翻譯"}
                            </button>
                            {!isExtracted && (
                                <p className="field-hint text-center">請先完成步驟 1-2</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Step 4: 下載 */}
                <div className={`accordion-section ${openSections.step4 ? "is-open" : ""} ${isFinished ? "is-done" : ""}`}>
                    <div className="accordion-header" onClick={() => toggleSection("step4")}>
                        <span>{isFinished ? "✓" : "4."} 下載</span>
                        <span className="accordion-indicator">▼</span>
                    </div>
                    <div className="accordion-content" style={{ maxHeight: openSections.step4 ? "400px" : "0", opacity: openSections.step4 ? 1 : 0 }}>
                        <div className="py-2 flex flex-col gap-3">
                            {/* Primary: PPTX */}
                            <button className="btn success w-full" onClick={onApply} disabled={!canApply}>
                                📊 套用排版並下載 PPTX
                            </button>

                            {/* Secondary export formats */}
                            {canApply && (
                                <div className="export-alternatives">
                                    <p className="field-label mb-2">其他格式</p>
                                    <div className="flex gap-2 flex-wrap">
                                        <ExportButton format="docx" label="📝 DOCX" blocks={blocks} disabled={!canApply} />
                                        <ExportButton format="xlsx" label="📈 XLSX" blocks={blocks} disabled={!canApply} />
                                        <ExportButton format="txt" label="📄 TXT" blocks={blocks} disabled={!canApply} />
                                    </div>
                                </div>
                            )}

                            {!canApply && (
                                <p className="field-hint text-center">請先完成翻譯</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
