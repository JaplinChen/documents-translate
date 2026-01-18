import { useState, useEffect } from "react";
import { API_BASE } from "../../constants";

export default function PreserveTermsTab({ onClose }) {
    const [terms, setTerms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newTerm, setNewTerm] = useState({
        term: "",
        category: "產品名稱",
        case_sensitive: true
    });
    const [filterText, setFilterText] = useState("");
    const [filterCategory, setFilterCategory] = useState("all");

    const categories = ["產品名稱", "技術縮寫", "專業術語", "其他"];

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
                alert(err.detail || "新增失敗");
                return;
            }

            await fetchTerms();
            setNewTerm({ term: "", category: "產品名稱", case_sensitive: true });
        } catch (error) {
            alert("新增失敗: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("確定要刪除此術語？")) return;

        try {
            setLoading(true);
            await fetch(`${API_BASE}/api/preserve-terms/${id}`, { method: "DELETE" });
            await fetchTerms();
        } catch (error) {
            alert("刪除失敗: " + error.message);
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
                alert(err.detail || "更新失敗");
                return;
            }

            await fetchTerms();
            handleCancelEdit();
        } catch (error) {
            alert("更新失敗: " + error.message);
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
            alert("匯出失敗: " + error.message);
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
            alert(`匯入成功：${result.imported} 筆，略過：${result.skipped} 筆`);
            await fetchTerms();
        } catch (error) {
            alert("匯入失敗: " + error.message);
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
                    placeholder="搜尋術語..."
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                />
                <select className="select-input" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                    <option value="all">全部分類</option>
                    {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
                <button className="btn ghost" type="button" onClick={handleExport}>匯出 CSV</button>
                <label className="btn ghost">
                    匯入 CSV
                    <input type="file" accept=".csv" onChange={handleImport} style={{ display: "none" }} />
                </label>
            </div>

            <div className="create-row">
                <div className="create-fields">
                    <input
                        className="data-input"
                        type="text"
                        placeholder="術語名稱 (例: Notion)"
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
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                    <label className="toggle-check">
                        <input
                            type="checkbox"
                            checked={newTerm.case_sensitive}
                            onChange={(e) => setNewTerm({ ...newTerm, case_sensitive: e.target.checked })}
                        />
                        <span>區分大小寫</span>
                    </label>
                </div>
                <button className="btn primary" type="button" onClick={handleAdd} disabled={loading || !newTerm.term.trim()}>
                    + 新增
                </button>
            </div>

            {loading ? (
                <div className="data-empty">載入中...</div>
            ) : filteredTerms.length === 0 ? (
                <div className="data-empty">
                    {filterText || filterCategory !== "all" ? "無符合條件的術語" : "尚無保留術語，請新增"}
                </div>
            ) : (
                <div className="data-table">
                    <div className="data-header">
                        <div className="data-row" style={{ gridTemplateColumns: "2fr 1fr 100px 80px 100px" }}>
                            <div className="data-cell">術語</div>
                            <div className="data-cell">分類</div>
                            <div className="data-cell">大小寫</div>
                            <div className="data-cell">建立時間</div>
                            <div className="data-cell">操作</div>
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
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                            <option value="翻譯術語">翻譯術語</option>
                                        </select>
                                    ) : term.category}
                                </div>
                                <div className="data-cell">
                                    {isEditing ? (
                                        <input
                                            type="checkbox"
                                            checked={editDraft?.case_sensitive || false}
                                            onChange={(e) => setEditDraft({ ...editDraft, case_sensitive: e.target.checked })}
                                        />
                                    ) : (term.case_sensitive ? "是" : "否")}
                                </div>
                                <div className="data-cell">{new Date(term.created_at).toLocaleDateString()}</div>
                                <div className="data-cell data-actions">
                                    {isEditing ? (
                                        <>
                                            <button className="action-btn-sm success" type="button" onClick={handleUpdate} disabled={loading}>✅</button>
                                            <button className="action-btn-sm ghost" type="button" onClick={handleCancelEdit}>❌</button>
                                        </>
                                    ) : (
                                        <>
                                            <button className="action-btn-sm primary" type="button" onClick={() => handleEdit(term)}>✏️</button>
                                            <button className="action-btn-sm danger" type="button" onClick={() => handleDelete(term.id)}>🗑️</button>
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
