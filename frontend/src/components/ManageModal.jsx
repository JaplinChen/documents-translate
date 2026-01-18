import { useEffect, useMemo, useState } from "react";
import { useDraggableModal } from "../hooks/useDraggableModal";
import { API_BASE } from "../constants";
import PreserveTermsTab from "./manage/PreserveTermsTab";

export default function ManageModal({
    open,
    onClose,
    tab,
    setTab,
    llmModels,
    llmModel,
    languageOptions,
    defaultSourceLang,
    defaultTargetLang,
    glossaryItems,
    tmItems,
    onSeed,
    onUpsertGlossary,
    onDeleteGlossary,
    onClearGlossary,
    onUpsertMemory,
    onDeleteMemory,
    onClearMemory,
    onConvertToGlossary,
    onConvertToPreserveTerm
}) {
    const [editingKey, setEditingKey] = useState(null);
    const [editingOriginal, setEditingOriginal] = useState(null);
    const [draft, setDraft] = useState(null);
    const [saving, setSaving] = useState(false);
    const [newEntry, setNewEntry] = useState({
        source_lang: "",
        target_lang: "",
        source_text: "",
        target_text: "",
        priority: 0
    });

    useEffect(() => {
        if (!open) return;
        setEditingKey(null);
        setEditingOriginal(null);
        setDraft(null);
        setSaving(false);
        setNewEntry((prev) => ({
            ...prev,
            source_lang: defaultSourceLang || "vi",
            target_lang: defaultTargetLang || "zh-TW"
        }));
    }, [open, tab, defaultSourceLang, defaultTargetLang]);

    const isGlossary = tab === "glossary";
    const items = isGlossary ? glossaryItems : tmItems;
    const makeKey = (item) => `${item.source_lang || ""}|${item.target_lang || ""}|${item.source_text || ""}`;

    const { modalRef, position, onMouseDown } = useDraggableModal(open);
    const [customModel, setCustomModel] = useState("");
    const modelOptions = useMemo(() => {
        const options = [...(llmModels || [])];
        if (llmModel && !options.includes(llmModel)) options.unshift(llmModel);
        return options;
    }, [llmModels, llmModel]);

    useEffect(() => {
        if (!open) return;
        setCustomModel(llmModel || "");
    }, [open, llmModel]);

    if (!open) return null;

    const handleExport = (path) => window.open(path, "_blank");

    const handleImport = (event, path, reload) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const formData = new FormData();
        formData.append("file", file);
        fetch(path, { method: "POST", body: formData }).then(() => reload());
        event.target.value = "";
    };

    const handleEdit = (item) => {
        setEditingKey(makeKey(item));
        setEditingOriginal(item);
        setDraft({ ...item, priority: item.priority ?? 0 });
    };

    const handleCancel = () => {
        setEditingKey(null);
        setEditingOriginal(null);
        setDraft(null);
    };

    const handleDelete = async (item) => {
        if (!window.confirm("確定要刪除這筆資料嗎？")) return;
        if (!item.id) return;
        const payload = { id: item.id };
        if (isGlossary) await onDeleteGlossary(payload);
        else await onDeleteMemory(payload);
        if (editingKey === makeKey(item)) handleCancel();
    };

    const handleSave = async () => {
        if (!draft) return;
        setSaving(true);
        const payload = isGlossary
            ? { ...draft, priority: Number.isNaN(Number(draft.priority)) ? 0 : Number(draft.priority) }
            : { ...draft };
        const originalKey = editingOriginal ? makeKey(editingOriginal) : editingKey;
        const nextKey = makeKey(payload);
        if (editingOriginal && originalKey !== nextKey && editingOriginal.id) {
            const deletePayload = { id: editingOriginal.id };
            if (isGlossary) await onDeleteGlossary(deletePayload);
            else await onDeleteMemory(deletePayload);
        }
        if (isGlossary) await onUpsertGlossary(payload);
        else await onUpsertMemory(payload);
        setSaving(false);
        handleCancel();
    };

    const handleCreate = async () => {
        if (!newEntry.source_text || !newEntry.target_text) return;
        if (isGlossary) {
            await onUpsertGlossary({
                ...newEntry,
                priority: Number.isNaN(Number(newEntry.priority)) ? 0 : Number(newEntry.priority)
            });
        } else {
            await onUpsertMemory({
                source_lang: newEntry.source_lang,
                target_lang: newEntry.target_lang,
                source_text: newEntry.source_text,
                target_text: newEntry.target_text
            });
        }
        setNewEntry((prev) => ({ ...prev, source_text: "", target_text: "", priority: 0 }));
    };

    return (
        <div className="modal-backdrop">
            <div className="modal is-draggable" ref={modalRef} style={{ top: position.top, left: position.left }}>
                <div className="modal-header draggable-handle" onMouseDown={onMouseDown}>
                    <h3>資料管理</h3>
                    <button className="icon-btn ghost" type="button" onClick={onClose}>×</button>
                </div>
                <div className="modal-tabs">
                    <button className={`tab-btn ${tab === "glossary" ? "is-active" : ""}`} type="button" onClick={() => setTab("glossary")}>翻譯對照表</button>
                    <button className={`tab-btn ${tab === "preserve" ? "is-active" : ""}`} type="button" onClick={() => setTab("preserve")}>保留術語</button>
                    <button className={`tab-btn ${tab === "tm" ? "is-active" : ""}`} type="button" onClick={() => setTab("tm")}>翻譯記憶</button>
                </div>
                <div className="modal-body">
                    {tab === "preserve" ? (
                        <PreserveTermsTab onClose={onClose} />
                    ) : (
                        <>
                            <div className="action-row">
                                <button className="btn ghost" type="button" onClick={onSeed}>匯入示範資料</button>
                                {tab === "glossary" ? (
                                    <>
                                        <button className="btn ghost" type="button" onClick={() => handleExport(`${API_BASE}/api/tm/glossary/export`)}>匯出 CSV</button>
                                        <label className="btn ghost">
                                            匯入 CSV
                                            <input type="file" accept=".csv" className="hidden-input" onChange={(event) => handleImport(event, `${API_BASE}/api/tm/glossary/import`, onSeed)} />
                                        </label>
                                        <button className="btn danger" type="button" onClick={onClearGlossary}>全部清除</button>
                                    </>
                                ) : (
                                    <>
                                        <button className="btn ghost" type="button" onClick={() => handleExport(`${API_BASE}/api/tm/memory/export`)}>匯出 CSV</button>
                                        <label className="btn ghost">
                                            匯入 CSV
                                            <input type="file" accept=".csv" className="hidden-input" onChange={(event) => handleImport(event, `${API_BASE}/api/tm/memory/import`, onSeed)} />
                                        </label>
                                        <button className="btn danger" type="button" onClick={onClearMemory}>全部清除</button>
                                    </>
                                )}
                            </div>
                            <div className="create-row">
                                <div className="create-fields">
                                    <select className="select-input" value={newEntry.source_lang} onChange={(e) => setNewEntry((prev) => ({ ...prev, source_lang: e.target.value }))}>
                                        {(languageOptions || []).filter((o) => o.code !== "auto").map((o) => <option key={`src-${o.code}`} value={o.code}>{o.label}</option>)}
                                    </select>
                                    <select className="select-input" value={newEntry.target_lang} onChange={(e) => setNewEntry((prev) => ({ ...prev, target_lang: e.target.value }))}>
                                        {(languageOptions || []).filter((o) => o.code !== "auto").map((o) => <option key={`tgt-${o.code}`} value={o.code}>{o.label}</option>)}
                                    </select>
                                    <input className="select-input" value={newEntry.source_text} placeholder="來源文字" onChange={(e) => setNewEntry((prev) => ({ ...prev, source_text: e.target.value }))} />
                                    <input className="select-input" value={newEntry.target_text} placeholder="目標文字" onChange={(e) => setNewEntry((prev) => ({ ...prev, target_text: e.target.value }))} />
                                    {isGlossary && <input className="select-input" type="number" value={newEntry.priority} placeholder="權重" onChange={(e) => setNewEntry((prev) => ({ ...prev, priority: e.target.value }))} />}
                                </div>
                                <button className="btn primary" type="button" onClick={handleCreate}>手動新增</button>
                            </div>
                            <DataTable
                                items={items}
                                isGlossary={isGlossary}
                                editingKey={editingKey}
                                draft={draft}
                                saving={saving}
                                makeKey={makeKey}
                                setDraft={setDraft}
                                onEdit={handleEdit}
                                onSave={handleSave}
                                onCancel={handleCancel}
                                onDelete={handleDelete}
                                onConvertToGlossary={onConvertToGlossary}
                                onConvertToPreserveTerm={onConvertToPreserveTerm}
                            />

                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function DataTable({ items, isGlossary, editingKey, draft, saving, makeKey, setDraft, onEdit, onSave, onCancel, onDelete, onConvertToGlossary, onConvertToPreserveTerm }) {

    if (items.length === 0) return <div className="data-empty">尚無資料</div>;

    return (
        <div className={`data-table ${isGlossary ? "is-glossary" : "is-tm"}`}>
            <div className="data-row data-header">
                <div className="data-cell">來源語言</div>
                <div className="data-cell">目標語言</div>
                <div className="data-cell">來源</div>
                <div className="data-cell">對應</div>
                {isGlossary && <div className="data-cell">權重</div>}
                <div className="data-cell data-actions">操作</div>
            </div>
            {(items || []).map((item, idx) => {
                const rowKey = makeKey(item);
                const isEditing = editingKey === rowKey;
                const row = isEditing ? draft || item : item;
                return (
                    <div className="data-row" key={`tm-${idx}`}>
                        <div className="data-cell">
                            {isEditing ? <input className="data-input" value={row.source_lang || ""} onChange={(e) => setDraft((prev) => ({ ...prev, source_lang: e.target.value }))} /> : row.source_lang}
                        </div>
                        <div className="data-cell">
                            {isEditing ? <input className="data-input" value={row.target_lang || ""} onChange={(e) => setDraft((prev) => ({ ...prev, target_lang: e.target.value }))} /> : row.target_lang}
                        </div>
                        <div className="data-cell">
                            {isEditing ? <input className="data-input" value={row.source_text || ""} onChange={(e) => setDraft((prev) => ({ ...prev, source_text: e.target.value }))} /> : row.source_text}
                        </div>
                        <div className="data-cell">
                            {isEditing ? <input className="data-input" value={row.target_text || ""} onChange={(e) => setDraft((prev) => ({ ...prev, target_text: e.target.value }))} /> : row.target_text}
                        </div>
                        {isGlossary && (
                            <div className="data-cell">
                                {isEditing ? <input className="data-input" type="number" value={row.priority ?? 0} onChange={(e) => setDraft((prev) => ({ ...prev, priority: e.target.value }))} /> : row.priority ?? 0}
                            </div>
                        )}
                        <div className="data-cell data-actions">
                            {isEditing ? (
                                <>
                                    <button className="action-btn-sm success" type="button" onClick={onSave} disabled={saving} title="保存">✅</button>
                                    <button className="action-btn-sm ghost" type="button" onClick={onCancel} disabled={saving} title="取消">❌</button>
                                </>
                            ) : (
                                <>
                                    <button className="action-btn-sm primary" type="button" onClick={() => onEdit(item)} title="編輯">✏️</button>
                                    {isGlossary && (
                                        <button className="action-btn-sm primary" type="button" onClick={() => onConvertToPreserveTerm(item)} title="轉為保留術語">🔒</button>
                                    )}
                                    {!isGlossary && (
                                        <button className="action-btn-sm primary" type="button" onClick={() => onConvertToGlossary(item)} title="轉為術語">📑</button>
                                    )}
                                    <button className="action-btn-sm danger" type="button" onClick={() => onDelete(item)} title="刪除">🗑️</button>
                                </>
                            )}

                        </div>
                    </div>
                );
            })}
        </div>
    );
}
