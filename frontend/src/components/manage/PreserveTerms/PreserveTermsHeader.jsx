import React from "react";
import { useTranslation } from "react-i18next";

export function PreserveTermsHeader({
    filterText,
    setFilterText,
    filterCategory,
    setFilterCategory,
    categories,
    getCategoryLabel,
    handleExport,
    handleImport,
    shownCount,
    totalCount,
    canLoadMore,
    onLoadMore
}) {
    const { t } = useTranslation();
    return (
        <div className="action-row flex items-center gap-2 w-full justify-between flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
                <input
                    className="text-input w-48"
                    type="text"
                    placeholder={t("manage.preserve.search_placeholder")}
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                />
                <select
                    className="select-input w-36"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                >
                    <option value="all">{t("manage.preserve.category_all")}</option>
                    {categories.map(cat => (
                        <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
                    ))}
                </select>
            </div>
            <div className="flex items-center gap-2">
                <button className="btn ghost" type="button" onClick={handleExport}>
                    {t("manage.actions.export_csv")}
                </button>
                <label className="btn ghost">
                    {t("manage.actions.import_csv")}
                    <input type="file" accept=".csv" className="hidden-input" onChange={handleImport} />
                </label>
                <span className="text-xs font-bold text-slate-400">
                    {t("manage.list_summary", { shown: shownCount, total: totalCount })}
                </span>
                {canLoadMore && (
                    <button className="btn ghost compact" type="button" onClick={onLoadMore}>
                        {t("manage.actions.load_more")}
                    </button>
                )}
            </div>
        </div>
    );
}
