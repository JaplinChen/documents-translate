import React from "react";
import { useTranslation } from "react-i18next";
import BlockCard from "./BlockCard";

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
    mode,
    sourceLang,
    secondaryLang,
    extractLanguageLines,
    editorRefs
}) {
    const { t } = useTranslation();

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
                        </div>
                    </div>

                    <div className="block-list">
                        {(filteredBlocks || []).map((block, index) => (
                            <BlockCard
                                key={block._uid}
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
                        ))}
                    </div>
                </>
            )}
        </section>
    );
}
