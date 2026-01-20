import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { API_BASE, APP_STATUS } from "../constants";
import { CustomSelect } from "./common/CustomSelect";

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
            if (!response.ok) throw new Error("Export failed");
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
    appStatus,
    sidebarRef,
    modeDescription,
    llmTone, setLlmTone,
    useVisionContext, setUseVisionContext,
    useSmartLayout, setUseSmartLayout,
    blocks
}) {
    const { t } = useTranslation();
    const isFileSelected = !!file;
    const isExtracted = blockCount > 0;

    // Status check - relies on block state for robustness
    const hasTranslation = blocks && blocks.some(b => b.translated_text);
    const isTranslating = appStatus === APP_STATUS.TRANSLATING;
    const isFinished = appStatus === APP_STATUS.EXPORT_COMPLETED;

    const [openSections, setOpenSections] = useState({
        step1: true,
        step2: false,
        step3: false,
        step4: false
    });

    // Auto-open sections based on progress
    useEffect(() => {
        if (isFinished) {
            setOpenSections({ step1: false, step2: false, step3: false, step4: true });
            return;
        }
        if (hasTranslation) {
            setOpenSections({ step1: false, step2: false, step3: false, step4: true });
            return;
        }
        if (isExtracted && !hasTranslation) {
            setOpenSections({ step1: false, step2: true, step3: true, step4: false });
            return;
        }
        if (isFileSelected && !isExtracted) {
            setOpenSections({ step1: false, step2: true, step3: false, step4: false });
            return;
        }
        setOpenSections({ step1: true, step2: false, step3: false, step4: false });
    }, [isFileSelected, isExtracted, hasTranslation, isFinished]);

    const toggleSection = (section) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    return (
        <section className="panel panel-left" ref={sidebarRef}>
            <div className="panel-header">
                <h2>{t("nav.title")}</h2>
                <p>{t("nav.subtitle")}</p>
            </div>

            <div className="sidebar-scrollable-content">
                {/* Step 1: Upload */}
                <div className={`accordion-section ${openSections.step1 ? "is-open" : ""} ${isFileSelected ? "is-done" : ""}`}>
                    <div className="accordion-header" onClick={() => toggleSection("step1")}>
                        <div className="flex items-center gap-2">
                            <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] ${isFileSelected ? "bg-blue-100 text-blue-600" : "bg-slate-200 text-slate-500"}`}>
                                {isFileSelected ? "✓" : "1"}
                            </span>
                            <span className="step-label">{t("nav.step1")}</span>
                        </div>
                        <span className="accordion-indicator">▼</span>
                    </div>
                    <div className="accordion-content" style={{ maxHeight: openSections.step1 ? "500px" : "0", opacity: openSections.step1 ? 1 : 0 }}>
                        <div className="form-group pt-2">
                            <div className="file-input-container">
                                <label className={`file-input-label ${isFileSelected ? "is-selected" : ""}`}>
                                    <span className="icon">{isFileSelected ? "📄" : "📁"}</span>
                                    <div className="flex flex-col items-center">
                                        <span className="text-main">
                                            {isFileSelected ? file.name : t("sidebar.upload.placeholder")}
                                        </span>
                                        {!isFileSelected && <span className="text-sub">{t("sidebar.upload.limit")}</span>}
                                        {isFileSelected && <span className="text-sub text-blue-600">{t("sidebar.upload.ready")}</span>}
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

                {/* Step 2: Settings */}
                <div className={`accordion-section ${openSections.step2 ? "is-open" : ""} ${isExtracted ? "is-done" : ""}`}>
                    <div className="accordion-header" onClick={() => toggleSection("step2")}>
                        <div className="flex items-center gap-2">
                            <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] ${isExtracted ? "bg-blue-100 text-blue-600" : "bg-slate-200 text-slate-500"}`}>
                                {isExtracted ? "✓" : "2"}
                            </span>
                            <span className="step-label">{t("nav.step2")}</span>
                        </div>
                        <span className="accordion-indicator">▼</span>
                    </div>
                    <div className="accordion-content" style={{ maxHeight: openSections.step2 ? "800px" : "0", opacity: openSections.step2 ? 1 : 0 }}>
                        <div className="space-y-4 pt-2">
                            <div className="row-group">
                                <div className="form-group">
                                    <label className="field-label">{t("sidebar.mode.label")}</label>
                                    <CustomSelect
                                        options={[
                                            { value: "bilingual", label: t("sidebar.mode.bilingual") },
                                            { value: "translated", label: t("sidebar.mode.translated") },
                                            { value: "correction", label: t("sidebar.mode.correction") }
                                        ]}
                                        value={mode}
                                        onChange={(e) => setMode(e.target.value)}
                                    />
                                </div>
                                {mode === "bilingual" && (
                                    <div className="form-group">
                                        <label className="field-label">{t("sidebar.layout.label")}</label>
                                        <CustomSelect
                                            options={[
                                                { value: "inline", label: t("sidebar.layout.inline") },
                                                { value: "auto", label: t("sidebar.layout.auto") },
                                                { value: "new_slide", label: t("sidebar.layout.new_slide") }
                                            ]}
                                            value={bilingualLayout}
                                            onChange={(e) => setBilingualLayout(e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="field-label">{t("sidebar.lang.label")}</label>
                                <div className="row-group-3">
                                    <CustomSelect
                                        options={languageOptions || []}
                                        value={sourceLang || "auto"}
                                        onChange={(e) => { setSourceLang(e.target.value); setSourceLocked(true); }}
                                    />
                                    <div className="text-center font-bold text-slate-300">→</div>
                                    <CustomSelect
                                        options={(languageOptions || []).filter(opt => opt.code !== "auto")}
                                        value={targetLang}
                                        onChange={(e) => { setTargetLang(e.target.value); setTargetLocked(true); }}
                                    />
                                </div>
                            </div>

                            <label className="toggle-check">
                                <input type="checkbox" checked={useTm} onChange={(e) => setUseTm(e.target.checked)} />
                                {t("sidebar.tm")}
                            </label>

                            {isExtracted && (
                                <p className="field-hint">{t("sidebar.extract.summary", { count: blockCount })}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Step 3: Translate */}
                <div className={`accordion-section ${openSections.step3 ? "is-open" : ""} ${hasTranslation ? "is-done" : ""}`}>
                    <div className="accordion-header" onClick={() => toggleSection("step3")}>
                        <div className="flex items-center gap-2">
                            <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] ${hasTranslation ? "bg-blue-100 text-blue-600" : "bg-slate-200 text-slate-500"}`}>
                                {hasTranslation ? "✓" : "3"}
                            </span>
                            <span className="step-label">{t("nav.step3")}</span>
                        </div>
                        <span className="accordion-indicator">▼</span>
                    </div>
                    <div className="accordion-content" style={{ maxHeight: openSections.step3 ? "400px" : "0", opacity: openSections.step3 ? 1 : 0 }}>
                        <div className="py-2 flex flex-col gap-3">
                            <div className="smart-extract-section">
                                <p className="field-label mb-2">{t("sidebar.preprocess")}</p>
                                <button
                                    className="btn secondary w-full"
                                    onClick={onExtractGlossary}
                                    disabled={busy || !isExtracted}
                                >
                                    {t("sidebar.extract.button")}
                                </button>
                                <p className="field-hint mt-1">{t("sidebar.extract.hint")}</p>
                            </div>

                            <hr className="border-slate-200" />

                            <button
                                className={`btn primary w-full ${isExtracted && !isTranslating ? "pulse-shadow" : ""}`}
                                onClick={onTranslate}
                                disabled={busy || !isExtracted}
                            >
                                {isTranslating ? (
                                    typeof status === 'string' ? status : (status?.key ? t(status.key, status.params) : "")
                                ) : t("sidebar.translate.button")}
                            </button>
                            {!isExtracted && (
                                <p className="field-hint text-center">{t("sidebar.hint.step12")}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Step 4: Download */}
                <div className={`accordion-section ${openSections.step4 ? "is-open" : ""} ${isFinished ? "is-done" : ""}`}>
                    <div className="accordion-header" onClick={() => toggleSection("step4")}>
                        <div className="flex items-center gap-2">
                            <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] ${isFinished ? "bg-blue-100 text-blue-600" : "bg-slate-200 text-slate-500"}`}>
                                {isFinished ? "✓" : "4"}
                            </span>
                            <span className="step-label">{t("nav.step4")}</span>
                        </div>
                        <span className="accordion-indicator">▼</span>
                    </div>
                    <div className="accordion-content" style={{ maxHeight: openSections.step4 ? "400px" : "0", opacity: openSections.step4 ? 1 : 0 }}>
                        <div className="py-2 flex flex-col gap-3">
                            <button className="btn success w-full" onClick={onApply} disabled={!canApply}>
                                {t("sidebar.apply.button")}
                            </button>

                            {canApply && (
                                <div className="export-alternatives">
                                    <p className="field-label mb-2">{t("sidebar.export.others")}</p>
                                    <div className="flex gap-2 flex-wrap">
                                        <ExportButton format="docx" label="DOCX" blocks={blocks} disabled={!canApply} />
                                        <ExportButton format="xlsx" label="XLSX" blocks={blocks} disabled={!canApply} />
                                        <ExportButton format="txt" label="TXT" blocks={blocks} disabled={!canApply} />
                                    </div>
                                </div>
                            )}

                            {!canApply && (
                                <p className="field-hint text-center">{t("sidebar.hint.step3")}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
