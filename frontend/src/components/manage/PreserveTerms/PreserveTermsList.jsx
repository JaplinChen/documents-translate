import React from "react";
import { useTranslation } from "react-i18next";
import { Edit, Trash2, Check, X, Table } from "lucide-react";

export function PreserveTermsList({ filteredTerms, filterText, filterCategory, editingId, setEditingId, editForm, setEditForm, selectedIds, setSelectedIds, categories, getCategoryLabel, handleUpdate, handleDelete, onConvertToGlossary, highlightColor, t }) {
    const safeTerms = Array.isArray(filteredTerms) ? filteredTerms : [];
    const allSelected = safeTerms.length > 0 && selectedIds.length === safeTerms.length;
    const [sortKey, setSortKey] = React.useState(null);
    const [sortDir, setSortDir] = React.useState("asc");

    const handleSelectAll = (checked) => {
        if (checked) setSelectedIds(safeTerms.map(t => t.id));
        else setSelectedIds([]);
    };

    const handleSelectRow = (id, checked) => {
        if (checked) setSelectedIds(prev => [...prev, id]);
        else setSelectedIds(prev => prev.filter(i => i !== id));
    };
    const sortedTerms = React.useMemo(() => {
        if (!sortKey) return safeTerms;
        const withIndex = safeTerms.map((term, idx) => ({ term, idx }));
        const dir = sortDir === "asc" ? 1 : -1;
        return withIndex.sort((a, b) => {
            const av = a.term?.[sortKey];
            const bv = b.term?.[sortKey];
            if (sortKey === "case_sensitive") {
                const an = av ? 1 : 0;
                const bn = bv ? 1 : 0;
                if (an !== bn) return (an - bn) * dir;
            } else if (sortKey === "created_at") {
                const ad = new Date(av || 0).getTime();
                const bd = new Date(bv || 0).getTime();
                if (ad !== bd) return (ad - bd) * dir;
            } else {
                const as = String(av ?? "");
                const bs = String(bv ?? "");
                const cmp = as.localeCompare(bs, "zh-Hant", { numeric: true, sensitivity: "base" });
                if (cmp !== 0) return cmp * dir;
            }
            return (a.idx - b.idx) * dir;
        }).map(({ term }) => term);
    }, [safeTerms, sortKey, sortDir]);

    if (safeTerms.length === 0) {
        return (
            <div className="flex-grow flex flex-col items-center justify-center p-12 text-slate-300">
                <p className="text-lg font-bold">{filterText || filterCategory !== "all" ? t("manage.preserve.no_results") : t("manage.preserve.empty")}</p>
            </div>
        );
    }

    const toggleSort = (key) => {
        if (sortKey === key) {
            setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSortKey(key);
            setSortDir("asc");
        }
    };

    const sortIndicator = (key) => {
        if (sortKey !== key) return "↕";
        return sortDir === "asc" ? "▲" : "▼";
    };

    return (
        <div className="w-full">
            <table className="table-sticky w-full text-left">
                <thead className="table-header-sticky border-b border-slate-200">
                    <tr className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-4 px-4 w-10 text-center">
                            <input type="checkbox" checked={allSelected} onChange={(e) => handleSelectAll(e.target.checked)} />
                        </th>
                        <th className="py-4 px-4">
                            <button type="button" className="sort-btn" onClick={() => toggleSort("term")} aria-label={`${t("manage.preserve.table.term")} 排序`}>
                                {t("manage.preserve.table.term")}
                                <span className="sort-indicator">{sortIndicator("term")}</span>
                            </button>
                        </th>
                        <th className="py-4 px-2 w-32 text-center">
                            <button type="button" className="sort-btn justify-center" onClick={() => toggleSort("category")} aria-label={`${t("manage.preserve.table.category")} 排序`}>
                                {t("manage.preserve.table.category")}
                                <span className="sort-indicator">{sortIndicator("category")}</span>
                            </button>
                        </th>
                        <th className="py-4 px-2 w-24 text-center">
                            <button type="button" className="sort-btn justify-center" onClick={() => toggleSort("case_sensitive")} aria-label={`${t("manage.preserve.table.case")} 排序`}>
                                {t("manage.preserve.table.case")}
                                <span className="sort-indicator">{sortIndicator("case_sensitive")}</span>
                            </button>
                        </th>
                        <th className="py-4 px-2 w-36 text-center">
                            <button type="button" className="sort-btn justify-center" onClick={() => toggleSort("created_at")} aria-label={`${t("manage.preserve.table.date")} 排序`}>
                                {t("manage.preserve.table.date")}
                                <span className="sort-indicator">{sortIndicator("created_at")}</span>
                            </button>
                        </th>
                        <th className="py-4 px-4 w-32 text-right">{t("manage.preserve.table.actions")}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {sortedTerms.map((term) => {
                        const isSelected = selectedIds.includes(term.id);
                        const rowStyle = term.is_new ? { backgroundColor: highlightColor } : undefined;
                        return (
                            <tr key={term.id} className={`group hover:bg-blue-50/30 transition-colors ${isSelected ? "bg-blue-50/50" : ""}`} style={rowStyle}>
                                <td className="py-4 px-4 text-center">
                                    <input type="checkbox" checked={isSelected} onChange={(e) => handleSelectRow(term.id, e.target.checked)} />
                                </td>
                                <td className="py-4 px-4">
                                    {editingId === term.id ? (
                                        <input
                                            className="text-input w-full !text-sm !py-1 !px-2 font-bold !bg-white border-blue-200"
                                            value={editForm.term}
                                            onChange={(e) => setEditForm({ ...editForm, term: e.target.value })}
                                            autoFocus
                                        />
                                    ) : (
                                        <span className="text-sm font-bold text-slate-700">{term.term}</span>
                                    )}
                                </td>
                                <td className="py-4 px-2 text-center">
                                    {editingId === term.id ? (
                                        <select
                                            className="select-input !text-[11px] !py-1 !px-2 w-full !bg-white border-blue-200 font-bold"
                                            value={editForm.category}
                                            onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                        >
                                            {categories.map(cat => (
                                                <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${term.category === "產品名稱" ? "bg-blue-100 text-blue-700" :
                                                term.category === "技術縮寫" ? "bg-indigo-100 text-indigo-700" :
                                                    term.category === "專業術語" ? "bg-purple-100 text-purple-700" :
                                                        term.category === "翻譯術語" ? "bg-emerald-100 text-emerald-700" :
                                                            "bg-slate-100 text-slate-600"
                                            }`}>
                                            {getCategoryLabel(term.category)}
                                        </span>
                                    )}
                                </td>
                                <td className="py-4 px-2 text-center">
                                    {editingId === term.id ? (
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-slate-300 text-blue-600"
                                            checked={editForm.case_sensitive}
                                            onChange={(e) => setEditForm({ ...editForm, case_sensitive: e.target.checked })}
                                        />
                                    ) : (
                                        <span className={`text-[10px] font-bold ${term.case_sensitive ? "text-blue-500" : "text-slate-300"}`}>
                                            {term.case_sensitive ? t("manage.preserve.table.yes") : t("manage.preserve.table.no")}
                                        </span>
                                    )}
                                </td>
                                <td className="py-4 px-2 text-center text-[10px] font-medium text-slate-400">
                                    {new Date(term.created_at || Date.now()).toLocaleDateString()}
                                </td>
                                <td className="py-4 px-6 text-right">
                                    <div className="flex justify-end gap-1.5">
                                        {editingId === term.id ? (
                                            <>
                                                <button className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" onClick={handleUpdate} title={t("manage.actions.save")}>
                                                    <Check size={16} strokeWidth={2.5} />
                                                </button>
                                                <button className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-lg transition-colors" onClick={() => setEditingId(null)} title={t("manage.actions.cancel")}>
                                                    <X size={16} strokeWidth={2.5} />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" onClick={() => {
                                                    setEditingId(term.id);
                                                    setEditForm({ term: term.term, category: term.category, case_sensitive: term.case_sensitive });
                                                }} title={t("manage.actions.edit")}>
                                                    <Edit size={16} />
                                                </button>
                                                <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" onClick={() => onConvertToGlossary(term)} title={t("manage.actions.convert_glossary")}>
                                                    <Table size={18} />
                                                </button>
                                                <button className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" onClick={() => handleDelete(term.id)} title={t("common.delete")}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    );
}
