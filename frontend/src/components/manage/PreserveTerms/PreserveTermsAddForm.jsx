import React from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";

export function PreserveTermsAddForm({ newTerm, setNewTerm, categories, getCategoryLabel, handleAdd, loading }) {
    const { t } = useTranslation();
    return (
        <div className="manage-create-row">
                <input
                    className="text-input flex-1 min-w-[220px] max-w-[360px]"
                    type="text"
                    placeholder="e.g. Notion"
                    value={newTerm.term}
                    onChange={(e) => setNewTerm({ ...newTerm, term: e.target.value })}
                />
                <select
                    className="select-input manage-field-short"
                    value={newTerm.category}
                    onChange={(e) => setNewTerm({ ...newTerm, category: e.target.value })}
                >
                    {categories.map(cat => (
                        <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
                    ))}
                </select>
                <label className="toggle-row">
                    <input
                        type="checkbox"
                        checked={newTerm.case_sensitive}
                        onChange={(e) => setNewTerm({ ...newTerm, case_sensitive: e.target.checked })}
                    />
                    <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">{t("manage.preserve.case_sensitive")}</span>
                </label>
                <button
                    className="btn primary manage-btn-square"
                    type="button"
                    onClick={handleAdd}
                    disabled={loading || !newTerm.term.trim()}
                    title={t("manage.actions.add")}
                >
                    <Plus size={18} strokeWidth={3} />
                </button>
        </div>
    );
}
