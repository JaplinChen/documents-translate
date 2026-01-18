import React from "react";
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
    return (
        <section className="panel panel-right">
            <div className="panel-header">
                <h2>文字區塊</h2>
                <p>共 {blockCount} 筆，顯示 {filteredBlocks.length} 筆</p>
            </div>

            {blockCount === 0 ? (
                <div className="empty-state">
                    <p>尚未抽取任何文字區塊</p>
                    <span>請先上傳 PPTX 並按下「抽取區塊」</span>
                </div>
            ) : (
                <>
                    <div className="filter-row">
                        <div className="filter-item">
                            <label className="field-label">搜尋</label>
                            <input
                                className="select-input"
                                type="text"
                                value={filterText}
                                placeholder="搜尋原文/翻譯"
                                onChange={(e) => setFilterText(e.target.value)}
                            />
                        </div>
                        <div className="filter-item">
                            <label className="field-label">類型</label>
                            <select className="select-input" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                                <option value="all">全部</option>
                                <option value="textbox">textbox</option>
                                <option value="table_cell">table_cell</option>
                                <option value="notes">notes</option>
                            </select>
                        </div>
                        <div className="filter-item">
                            <label className="field-label">Slide</label>
                            <input
                                className="select-input"
                                type="number"
                                value={filterSlide}
                                placeholder="0"
                                onChange={(e) => setFilterSlide(e.target.value)}
                            />
                        </div>
                        <div className="filter-actions flex gap-2 ml-auto">
                            <button className="btn ghost compact" type="button" onClick={onSelectAll}>全選</button>
                            <button className="btn ghost compact" type="button" onClick={onClearSelection}>清除</button>
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
