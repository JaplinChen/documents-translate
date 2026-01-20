import React from "react";
import { useTranslation } from "react-i18next";

function CorrectionTab({
    fillColor,
    setFillColor,
    textColor,
    setTextColor,
    lineColor,
    setLineColor,
    lineDash,
    setLineDash
}) {
    const { t } = useTranslation();

    // Mapping for style values to CSS
    const getBorderStyle = (dash) => {
        switch (dash) {
            case "dot": return "dotted";
            case "dash": return "dashed";
            case "dashdot": return "dashed"; // approximated for CSS
            case "solid": return "solid";
            default: return "solid";
        }
    };

    return (
        <div className="tab-pane">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Left Column: Preview */}
                <div className="flex flex-col gap-2">
                    <label className="field-label text-blue-600 font-bold">{t("settings.correction.preview")}</label>
                    <div className="w-full h-32 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center relative overflow-hidden">
                        {/* Background Grid Pattern for Transparency Check */}
                        <div className="absolute inset-0 opacity-10"
                            style={{
                                backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
                                backgroundSize: "10px 10px"
                            }}
                        ></div>

                        {/* The Actual Preview Box */}
                        <div
                            className="px-4 py-2 text-sm font-medium z-10 transition-all duration-300"
                            style={{
                                backgroundColor: fillColor,
                                color: textColor,
                                border: `2px ${getBorderStyle(lineDash)} ${lineColor}`,
                                borderRadius: "4px"
                            }}
                        >
                            {t("settings.correction.preview_content")}
                        </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                        * {t("settings.ai.tone_hint") /* Reusing a hint style or add new if needed, for now just empty or generic hint */}
                    </p>
                </div>

                {/* Right Column: Controls */}
                <div className="flex flex-col gap-4">

                    {/* Colors */}
                    <div className="settings-section pt-0 border-none">
                        <label className="field-label mb-3 block">{t("settings.correction.fill_color")}</label>
                        <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-200 shadow-sm cursor-pointer hover:scale-105 transition-transform">
                                <input
                                    type="color"
                                    className="absolute inset-0 w-[150%] h-[150%] -left-[25%] -top-[25%] p-0 m-0 cursor-pointer border-none outline-none"
                                    value={fillColor}
                                    onChange={(e) => setFillColor(e.target.value)}
                                />
                            </div>
                            <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">{fillColor}</span>
                        </div>
                    </div>

                    <div className="settings-section pt-0 border-none">
                        <label className="field-label mb-3 block">{t("settings.correction.text_color")}</label>
                        <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-200 shadow-sm cursor-pointer hover:scale-105 transition-transform">
                                <input
                                    type="color"
                                    className="absolute inset-0 w-[150%] h-[150%] -left-[25%] -top-[25%] p-0 m-0 cursor-pointer border-none outline-none"
                                    value={textColor}
                                    onChange={(e) => setTextColor(e.target.value)}
                                />
                            </div>
                            <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">{textColor}</span>
                        </div>
                    </div>

                    <div className="settings-section pt-0 border-none">
                        <label className="field-label mb-3 block">{t("settings.correction.border_color")}</label>
                        <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-200 shadow-sm cursor-pointer hover:scale-105 transition-transform">
                                <input
                                    type="color"
                                    className="absolute inset-0 w-[150%] h-[150%] -left-[25%] -top-[25%] p-0 m-0 cursor-pointer border-none outline-none"
                                    value={lineColor}
                                    onChange={(e) => setLineColor(e.target.value)}
                                />
                            </div>
                            <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">{lineColor}</span>
                        </div>
                    </div>

                    {/* Style */}
                    <div className="settings-section pt-0 border-none mt-2">
                        <label className="field-label mb-2 block">{t("settings.correction.border_style")}</label>
                        <div className="flex gap-2">
                            {['solid', 'dash', 'dot', 'dashdot'].map(style => (
                                <button
                                    key={style}
                                    type="button"
                                    onClick={() => setLineDash(style)}
                                    className={`flex-1 py-2 px-1 rounded-md border text-xs font-medium transition-all
                                        ${lineDash === style
                                            ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    {t(`settings.correction.${style}`)}
                                </button>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default CorrectionTab;
