import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import BlockCard from "./BlockCard";
import { BatchReplaceToolbar } from "./BatchReplaceToolbar";
import { SlidePreview } from "./SlidePreview";

export function EditorPanel({
    blockCount,
    filteredBlocks,
    filterText, setFilterText,
    filterType, setFilterType,
    filterSlide, setFilterSlide,
    onSelectAll,
    onClearSelection,
    onBlockSelect,
    onBlockChange,
    onOutputModeChange,
    onAddGlossary,
    onAddMemory,
    onBatchReplace,
    slideDimensions,
    mode,
    sourceLang,
    secondaryLang,
    extractLanguageLines,
    editorRefs
}) {
    const { t } = useTranslation();
    const [activeBlockId, setActiveBlockId] = useState(null);

    // Filter blocks for the current slide to show in preview
    const previewSlideIndex = parseInt(filterSlide) - 1;
    const currentSlideBlocks = filteredBlocks.filter(b => b.slide_index === previewSlideIndex);

    return (
        <section className="panel panel-right">
            <div className="panel-header">
                <h2>{t("editor.title")}</h2>
                <p>{t("editor.summary", { total: blockCount, filtered: filteredBlocks.length })}</p>
            </div>

            {blockCount === 0 ? (
                <div className="empty-state">
                    <p>{t("editor.empty.title")}</p>
                    <span>{t("editor.empty.hint")}</span>
                </div>
            ) : (
                <>
                    <div className="filter-row">
                        <div className="filter-item">
                            <label className="field-label">{t("editor.filter.search")}</label>
                            <input
                                className="select-input"
                                type="text"
                                value={filterText}
                                placeholder={t("editor.search_placeholder")}
                                onChange={(e) => setFilterText(e.target.value)}
                            />
                        </div>
                        <div className="filter-item">
                            <label className="field-label">{t("editor.filter.type")}</label>
                            <select className="select-input" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                                <option value="all">{t("editor.filter_type")}</option>
                                <option value="textbox">{t("components.editor.filter_textbox")}</option>
                                <option value="table_cell">{t("components.editor.filter_table")}</option>
                                <option value="notes">{t("components.editor.filter_notes")}</option>
                            </select>
                        </div>
                        <div className="filter-item">
                            <label className="field-label">{t("editor.filter.slide")}</label>
                            <input
                                className="select-input"
                                type="number"
                                value={filterSlide}
                                placeholder="0"
                                onChange={(e) => setFilterSlide(e.target.value)}
                            />
                        </div>
                        <div className="filter-actions flex gap-2 ml-auto">
                            <button className="btn ghost compact" type="button" onClick={onSelectAll}>{t("editor.select_all")}</button>
                            <button className="btn ghost compact" type="button" onClick={onClearSelection}>{t("editor.clear_selection")}</button>
                            {onBatchReplace && (
                                <BatchReplaceToolbar onReplace={onBatchReplace} disabled={blockCount === 0} />
                            )}
                        </div>
                    </div>

                    {/* High-Fidelity Preview Integration */}
                    {slideDimensions?.width > 0 ? (
                        currentSlideBlocks.length > 0 ? (
                            <div className="editor-preview-section p-4 bg-slate-50 border-b border-slate-200">
                                <SlidePreview
                                    dimensions={slideDimensions}
                                    blocks={currentSlideBlocks}
                                    activeBlockId={activeBlockId}
                                />
                            </div>
                        ) : (
                            <div className="editor-preview-guidance p-4 bg-slate-50 border-b border-slate-200 text-center">
                                <p className="text-xs text-slate-400">
                                    💡 {t("editor.preview_guidance", "Enter a Slide Number in the filter above to see a layout preview.")}
                                </p>
                            </div>
                        )
                    ) : null}

                    <div className="block-list">
                        {(filteredBlocks || []).map((block, index) => (
                            <div
                                key={block._uid}
                                onMouseEnter={() => setActiveBlockId(block._uid)}
                                onMouseLeave={() => setActiveBlockId(null)}
                                className={activeBlockId === block._uid ? "ring-2 ring-blue-500 rounded-lg" : ""}
                            >
                                <BlockCard
                                    block={block}
                                    index={index}
                                    mode={mode}
                                    sourceLang={sourceLang}
                                    secondaryLang={secondaryLang}
                                    extractLanguageLines={extractLanguageLines}
                                    editorRefs={editorRefs}
                                    onBlockSelect={(checked) => onBlockSelect(block._uid, checked)}
                                    onBlockChange={(val) => onBlockChange(block._uid, val)}
                                    onOutputModeChange={(val) => onOutputModeChange(block._uid, val)}
                                    onAddGlossary={() => onAddGlossary(block)}
                                    onAddMemory={() => onAddMemory(block)}
                                />
                            </div>
                        ))}
                    </div>
                </>
            )}
        </section>
    );
}


