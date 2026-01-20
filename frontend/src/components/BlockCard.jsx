import { useTranslation } from "react-i18next";
import { resolveOutputMode, extractLanguageLines, normalizeText } from "../utils";

/**
 * Single block card for displaying/editing translation block
 */
export default function BlockCard({
    block,
    index,
    mode,
    sourceLang,
    secondaryLang,
    editorRefs,
    onBlockSelect,
    onBlockChange,
    onOutputModeChange,
    onEditorInput,
    onAddGlossary,
    onAddMemory
}) {
    const { t } = useTranslation();
    const outputMode = resolveOutputMode(block);

    const renderCorrectionPreview = () => {
        const translatedText = block.translated_text || "";

        // Check if source already contains bilingual content (mixed languages)
        const sourceText = block.source_text || "";
        const hasMixedLanguages = /[a-zA-Z]/.test(sourceText) && /[\u4e00-\u9fff\u3040-\u30ff\u0e00-\u0e7f]/.test(sourceText);

        // If source is already bilingual, use it directly without language extraction
        const displaySource = hasMixedLanguages ? sourceText : extractLanguageLines(sourceText, sourceLang || "auto").join("\n");

        const showTranslation = normalizeText(translatedText) && normalizeText(translatedText) !== normalizeText(displaySource);

        if (!showTranslation) return null;
        return (
            <>
                <div className="correction-source">{displaySource}</div>
                <div
                    className="correction-editor"
                    contentEditable
                    role="textbox"
                    aria-multiline="true"
                    suppressContentEditableWarning
                    ref={(node) => { editorRefs.current[index] = node; }}
                    onInput={(e) => onEditorInput(index, e)}
                >
                    {translatedText}
                </div>
            </>
        );
    };

    return (
        <div className={`block-card ${block.selected === false ? "is-muted" : ""} ${block.isTranslating ? "is-translating" : ""}`}>
            <div className="block-meta">
                <span className="block-number">#{index + 1}</span>
                <label className="select-box">
                    <input type="checkbox" checked={block.selected !== false} onChange={(e) => onBlockSelect(index, e.target.checked)} />
                    <span>{t("components.block_card.apply")}</span>
                </label>
                <span>{t("components.block_card.slide")} {block.slide_index}</span>
                <span>{t("components.block_card.shape")} {block.shape_id}</span>
                <span className="pill">{block.block_type}</span>
                {block.isTranslating ? (
                    <span className="status-pill is-running">{t("components.block_card.translating")}</span>
                ) : block.updatedAt ? (
                    <span className="status-pill">{t("components.block_card.updated_at", { time: block.updatedAt })}</span>
                ) : null}

                <div className="block-meta-tools ml-auto flex gap-1">
                    <button className="btn-tool" type="button" onClick={() => onAddGlossary(block)} title={t("components.block_card.tools_glossary_title")}>
                        <span className="icon">📖</span> {t("components.block_card.glossary")}
                    </button>
                    <button className="btn-tool" type="button" onClick={() => onAddMemory(block)} title={t("components.block_card.tools_memory_title")}>
                        <span className="icon">🧠</span> {t("components.block_card.memory")}
                    </button>
                </div>
            </div>
            <div className="block-body">
                <div>
                    <div className="field-label-row">
                        <span className="field-label">{t("components.block_card.source")}</span>
                        {mode === "correction" && (
                            <label className="toggle-check">
                                <input type="checkbox" checked={outputMode === "source"} onChange={() => onOutputModeChange(index, "source")} />
                                <span>{t("components.block_card.output")}</span>
                            </label>
                        )}
                    </div>
                    <div className="readonly-box">{block.source_text}</div>
                </div>
                <div>
                    <div className="field-label-row">
                        <span className="field-label">{t("components.block_card.target")}</span>
                        {mode === "correction" && (
                            <label className="toggle-check">
                                <input type="checkbox" checked={outputMode === "translated"} onChange={() => onOutputModeChange(index, "translated")} />
                                <span>{t("components.block_card.output")}</span>
                            </label>
                        )}
                    </div>
                    {mode === "correction" ? (
                        <div className="correction-stack">
                            <div className="correction-preview">{renderCorrectionPreview()}</div>
                        </div>
                    ) : (
                        <textarea
                            className="textarea"
                            value={block.translated_text || ""}
                            onChange={(e) => onBlockChange(index, e.target.value)}
                            placeholder={t("components.block_card.placeholder")}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
