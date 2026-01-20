import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { API_BASE } from "../../constants";

export default function PreserveTermsTab({ onClose }) {
    const { t } = useTranslation();
    const [terms, setTerms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newTerm, setNewTerm] = useState({
        term: "",
        category: "產品名稱",
        case_sensitive: true
    });
    const [filterText, setFilterText] = useState("");
    const [filterCategory, setFilterCategory] = useState("all");

    // Map internal values to translation keys
    const categoryKeyMap = {
        "產品名稱": "product",
        "技術縮寫": "abbr",
        "專業術語": "special",
        "其他": "other",
        "翻譯術語": "trans"
    };

    // Reverse map for display if needed, or just use keys directly
    // Ideally backend should store keys, but for now we map legacy values
    const categories = ["產品名稱", "技術縮寫", "專業術語", "其他"];

    const getCategoryLabel = (cat) => {
        const key = categoryKeyMap[cat] || "other";
        return t(`manage.preserve.categories.${key}`);
    };

    const fetchTerms = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_BASE}/api/preserve-terms`);
            const data = await res.json();
            setTerms(data.terms || []);
        } catch (error) {
            console.error("Failed to fetch preserve terms:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTerms();
    }, []);

    const handleAdd = async () => {
        if (!newTerm.term.trim()) return;

        try {
            setLoading(true);
            const res = await fetch(`${API_BASE}/api/preserve-terms`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newTerm)
            });

            if (!res.ok) {
                const err = await res.json();
                alert(err.detail || t("manage.preserve.alerts.add_fail"));
                return;
            }

            await fetchTerms();
            setNewTerm({ term: "", category: "產品名稱", case_sensitive: true });
        } catch (error) {
            alert(`${t("manage.preserve.alerts.add_fail")}: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm(t("manage.preserve.alerts.delete_confirm"))) return;

        try {
            setLoading(true);
            await fetch(`${API_BASE}/api/preserve-terms/${id}`, { method: "DELETE" });
            await fetchTerms();
        } catch (error) {
            alert(`${t("manage.preserve.alerts.delete_fail")}: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // 編輯狀態
    const [editingId, setEditingId] = useState(null);
    const [editDraft, setEditDraft] = useState(null);

    const handleEdit = (term) => {
        setEditingId(term.id);
        setEditDraft({
            term: term.term,
            category: term.category,
            case_sensitive: term.case_sensitive
        });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditDraft(null);
    };

    const handleUpdate = async () => {
        if (!editDraft || !editingId) return;

        try {
            setLoading(true);
            const res = await fetch(`${API_BASE}/api/preserve-terms/${editingId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editDraft)
            });

            if (!res.ok) {
                const err = await res.json();
                alert(err.detail || t("manage.preserve.alerts.update_fail"));
                return;
            }

            await fetchTerms();
            handleCancelEdit();
        } catch (error) {
            alert(`${t("manage.preserve.alerts.update_fail")}: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/preserve-terms/export`);
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "preserve_terms.csv";
            a.click();
        } catch (error) {
            alert(`${t("manage.preserve.alerts.export_fail")}: ${error.message}`);
        }
    };

    const handleImport = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setLoading(true);
            const text = await file.text();
            const res = await fetch(`${API_BASE}/api/preserve-terms/import`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ csv_data: text })
            });

            const result = await res.json();
            alert(t("manage.preserve.alerts.import_success", { imported: result.imported, skipped: result.skipped }));
            await fetchTerms();
        } catch (error) {
            alert(`${t("manage.preserve.alerts.import_fail")}: ${error.message}`);
        } finally {
            setLoading(false);
            e.target.value = "";
        }
    };

    const filteredTerms = terms.filter(term => {
        if (filterCategory !== "all" && term.category !== filterCategory) return false;
        if (filterText && !term.term.toLowerCase().includes(filterText.toLowerCase())) return false;
        return true;
    });

    return (
        <div className="modal-body">
            <div className="action-row">
                <input
                    className="select-input"
                    type="text"
                    placeholder={t("manage.preserve.search_placeholder")}
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                />
                <select className="select-input" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                    <option value="all">{t("manage.preserve.category_all")}</option>
                    {categories.map(cat => (
                        <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
                    ))}
                </select>
                <button className="btn ghost" type="button" onClick={handleExport}>{t("manage.preserve.export_csv")}</button>
                <label className="btn ghost">
                    {t("manage.preserve.import_csv")}
                    <input type="file" accept=".csv" onChange={handleImport} style={{ display: "none" }} />
                </label>
            </div>

            <div className="create-row">
                <div className="create-fields">
                    <input
                        className="data-input"
                        type="text"
                        placeholder={t("manage.preserve.term_placeholder")}
                        value={newTerm.term}
                        onChange={(e) => setNewTerm({ ...newTerm, term: e.target.value })}
                        style={{ flex: 2 }}
                    />
                    <select
                        className="select-input"
                        value={newTerm.category}
                        onChange={(e) => setNewTerm({ ...newTerm, category: e.target.value })}
                    >
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
                        ))}
                    </select>
                    <label className="toggle-check">
                        <input
                            type="checkbox"
                            checked={newTerm.case_sensitive}
                            onChange={(e) => setNewTerm({ ...newTerm, case_sensitive: e.target.checked })}
                        />
                        <span>{t("manage.preserve.case_sensitive")}</span>
                    </label>
                </div>
                <button className="btn primary" type="button" onClick={handleAdd} disabled={loading || !newTerm.term.trim()}>
                    {t("manage.preserve.add")}
                </button>
            </div>

            {loading ? (
                <div className="data-empty">{t("manage.preserve.loading")}</div>
            ) : filteredTerms.length === 0 ? (
                <div className="data-empty">
                    {filterText || filterCategory !== "all" ? t("manage.preserve.no_results") : t("manage.preserve.empty")}
                </div>
            ) : (
                <div className="data-table">
                    <div className="data-header">
                        <div className="data-row" style={{ gridTemplateColumns: "2fr 1fr 100px 80px 100px" }}>
                            <div className="data-cell">{t("manage.preserve.table.term")}</div>
                            <div className="data-cell">{t("manage.preserve.table.category")}</div>
                            <div className="data-cell">{t("manage.preserve.table.case")}</div>
                            <div className="data-cell">{t("manage.preserve.table.date")}</div>
                            <div className="data-cell">{t("manage.preserve.table.actions")}</div>
                        </div>
                    </div>
                    {filteredTerms.map((term) => {
                        const isEditing = editingId === term.id;
                        return (
                            <div key={term.id} className="data-row" style={{ gridTemplateColumns: "2fr 1fr 100px 80px 100px" }}>
                                <div className="data-cell">
                                    {isEditing ? (
                                        <input
                                            className="data-input"
                                            value={editDraft?.term || ""}
                                            onChange={(e) => setEditDraft({ ...editDraft, term: e.target.value })}
                                        />
                                    ) : term.term}
                                </div>
                                <div className="data-cell">
                                    {isEditing ? (
                                        <select
                                            className="select-input"
                                            value={editDraft?.category || ""}
                                            onChange={(e) => setEditDraft({ ...editDraft, category: e.target.value })}
                                        >
                                            {categories.map(cat => (
                                                <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
                                            ))}
                                            <option value="翻譯術語">{getCategoryLabel("翻譯術語")}</option>
                                        </select>
                                    ) : getCategoryLabel(term.category)}
                                </div>
                                <div className="data-cell">
                                    {isEditing ? (
                                        <input
                                            type="checkbox"
                                            checked={editDraft?.case_sensitive || false}
                                            onChange={(e) => setEditDraft({ ...editDraft, case_sensitive: e.target.checked })}
                                        />
                                    ) : (term.case_sensitive ? t("manage.preserve.table.yes") : t("manage.preserve.table.no"))}
                                </div>
                                <div className="data-cell">{new Date(term.created_at).toLocaleDateString()}</div>
                                <div className="data-cell data-actions">
                                    {isEditing ? (
                                        <>
                                            <button className="action-btn-sm success" type="button" onClick={handleUpdate} disabled={loading} title={t("manage.actions.save")}>✅</button>
                                            <button className="action-btn-sm ghost" type="button" onClick={handleCancelEdit} title={t("manage.actions.cancel")}>❌</button>
                                        </>
                                    ) : (
                                        <>
                                            <button className="action-btn-sm primary" type="button" onClick={() => handleEdit(term)} title={t("manage.actions.edit")}>✏️</button>
                                            <button className="action-btn-sm danger" type="button" onClick={() => handleDelete(term.id)} title={t("manage.actions.delete")}>🗑️</button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

            )}
        </div>
    );
}
