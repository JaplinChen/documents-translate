import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDraggableModal } from "../hooks/useDraggableModal";
import { API_BASE } from "../constants";
import PreserveTermsTab from "./manage/PreserveTermsTab";
import HistoryTab from "./manage/HistoryTab";

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
    onConvertToPreserveTerm,
    onLoadFile
}) {
    const { t } = useTranslation();
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
        if (!window.confirm(t("manage.confirm.delete"))) return;
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
                    <h3>{t("manage.title")}</h3>
                    <button className="icon-btn ghost !rounded-md" type="button" onClick={onClose}>×</button>
                </div>
                <div className="modal-tabs">
                    <button className={`tab-btn ${tab === "glossary" ? "is-active" : ""}`} type="button" onClick={() => setTab("glossary")}>{t("manage.tabs.glossary")}</button>
                    <button className={`tab-btn ${tab === "preserve" ? "is-active" : ""}`} type="button" onClick={() => setTab("preserve")}>{t("manage.tabs.preserve")}</button>
                    <button className={`tab-btn ${tab === "tm" ? "is-active" : ""}`} type="button" onClick={() => setTab("tm")}>{t("manage.tabs.tm")}</button>
                    <button className={`tab-btn ${tab === "history" ? "is-active" : ""}`} type="button" onClick={() => setTab("history")}>{t("nav.history", "History")}</button>
                </div>
                <div className="modal-body">
                    {tab === "history" ? (
                        <HistoryTab onLoadFile={onLoadFile} />
                    ) : tab === "preserve" ? (
                        <PreserveTermsTab onClose={onClose} />
                    ) : (
                        <>
                            <div className="action-row">
                                <button className="btn ghost" type="button" onClick={onSeed}>{t("manage.actions.seed")}</button>
                                {tab === "glossary" ? (
                                    <>
                                        <button className="btn ghost" type="button" onClick={() => handleExport(`${API_BASE}/api/tm/glossary/export`)}>{t("manage.actions.export_csv")}</button>
                                        <label className="btn ghost">
                                            {t("manage.actions.import_csv")}
                                            <input type="file" accept=".csv" className="hidden-input" onChange={(event) => handleImport(event, `${API_BASE}/api/tm/glossary/import`, onSeed)} />
                                        </label>
                                        <button className="btn danger" type="button" onClick={onClearGlossary}>{t("manage.actions.clear_all")}</button>
                                    </>
                                ) : (
                                    <>
                                        <button className="btn ghost" type="button" onClick={() => handleExport(`${API_BASE}/api/tm/memory/export`)}>{t("manage.actions.export_csv")}</button>
                                        <label className="btn ghost">
                                            {t("manage.actions.import_csv")}
                                            <input type="file" accept=".csv" className="hidden-input" onChange={(event) => handleImport(event, `${API_BASE}/api/tm/memory/import`, onSeed)} />
                                        </label>
                                        <button className="btn danger" type="button" onClick={onClearMemory}>{t("manage.actions.clear_all")}</button>
                                    </>
                                )}
                            </div>
                            <div className="create-row">
                                <div className="create-fields grid grid-cols-12 gap-2 w-full items-center">
                                    <select className="select-input col-span-2" value={newEntry.source_lang} onChange={(e) => setNewEntry((prev) => ({ ...prev, source_lang: e.target.value }))}>
                                        {(languageOptions || []).filter((o) => o.code !== "auto").map((o) => <option key={`src-${o.code}`} value={o.code}>{o.label}</option>)}
                                    </select>
                                    <select className="select-input col-span-2" value={newEntry.target_lang} onChange={(e) => setNewEntry((prev) => ({ ...prev, target_lang: e.target.value }))}>
                                        {(languageOptions || []).filter((o) => o.code !== "auto").map((o) => <option key={`tgt-${o.code}`} value={o.code}>{o.label}</option>)}
                                    </select>
                                    <input className="text-input col-span-3" value={newEntry.source_text} placeholder={t("manage.fields.source_text")} onChange={(e) => setNewEntry((prev) => ({ ...prev, source_text: e.target.value }))} />
                                    <input className="text-input col-span-3" value={newEntry.target_text} placeholder={t("manage.fields.target_text")} onChange={(e) => setNewEntry((prev) => ({ ...prev, target_text: e.target.value }))} />
                                    {isGlossary ? (
                                        <>
                                            <input className="text-input col-span-1 text-center px-1" type="number" value={newEntry.priority} placeholder={t("manage.fields.priority")} onChange={(e) => setNewEntry((prev) => ({ ...prev, priority: e.target.value }))} />
                                            <button className="btn primary col-span-1 h-9 min-h-[2.25rem] px-0 w-full flex items-center justify-center" type="button" onClick={handleCreate} title={t("manage.actions.add")}>＋</button>
                                        </>
                                    ) : (
                                        <button className="btn primary col-span-2 h-9 min-h-[2.25rem] w-full" type="button" onClick={handleCreate}>{t("manage.actions.add")}</button>
                                    )}
                                </div>
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
                                t={t}
                            />

                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function DataTable({ items, isGlossary, editingKey, draft, saving, makeKey, setDraft, onEdit, onSave, onCancel, onDelete, onConvertToGlossary, onConvertToPreserveTerm, t }) {

    if (items.length === 0) return <div className="data-empty">{t("manage.empty")}</div>;

    return (
        <div className={`data-table ${isGlossary ? "is-glossary" : "is-tm"}`}>
            <div className="data-row data-header">
                <div className="data-cell">{t("manage.table.source_lang")}</div>
                <div className="data-cell">{t("manage.table.target_lang")}</div>
                <div className="data-cell">{t("manage.table.source")}</div>
                <div className="data-cell">{t("manage.table.target")}</div>
                {isGlossary && <div className="data-cell">{t("manage.table.priority")}</div>}
                <div className="data-cell data-actions">{t("manage.table.actions")}</div>
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
                                    <button className="action-btn-sm success" type="button" onClick={onSave} disabled={saving} title={t("manage.actions.save")}>✅</button>
                                    <button className="action-btn-sm ghost" type="button" onClick={onCancel} disabled={saving} title={t("manage.actions.cancel")}>❌</button>
                                </>
                            ) : (
                                <>
                                    <button className="action-btn-sm primary" type="button" onClick={() => onEdit(item)} title={t("manage.actions.edit")}>✏️</button>
                                    {isGlossary && (
                                        <button className="action-btn-sm primary" type="button" onClick={() => onConvertToPreserveTerm(item)} title={t("manage.actions.convert_preserve")}>🔒</button>
                                    )}
                                    {!isGlossary && (
                                        <button className="action-btn-sm primary" type="button" onClick={() => onConvertToGlossary(item)} title={t("manage.actions.convert_glossary")}>📑</button>
                                    )}
                                    <button className="action-btn-sm danger" type="button" onClick={() => onDelete(item)} title={t("manage.actions.delete")}>🗑️</button>
                                </>
                            )}

                        </div>
                    </div>
                );
            })}
        </div>
    );
}
