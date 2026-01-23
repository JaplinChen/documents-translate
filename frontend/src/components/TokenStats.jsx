import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { API_BASE } from "../constants";
import { Activity, Database, X, ChevronDown, Cpu } from "lucide-react";

/**
 * Token Usage Statistics Display Component
 * Shows real-time token usage and cost estimation
 */
export default function TokenStats({ className = "" }) {
    const { t } = useTranslation();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(false);

    const fetchStats = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/token-stats`);
            if (!res.ok) throw new Error("API offset");
            const data = await res.json();
            setStats(data);
        } catch (error) {
            // Silently fail to not disrupt UX
            setStats(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 60000);
        return () => clearInterval(interval);
    }, []);

    if (loading || !stats) return null;

    const { session, all_time } = stats;
    const hasUsage = session.total_tokens > 0;

    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
        if (num >= 1000) return (num / 1000).toFixed(1) + "K";
        return num.toString();
    };

    const formatCost = (cost) => {
        if (cost < 0.01 && cost > 0) return "< $0.01";
        return `$${cost.toFixed(2)}`;
    };

    return (
        <div className={`token-stats relative ${className}`}>
            <button
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all ${expanded ? "bg-slate-100 ring-1 ring-slate-200" : "hover:bg-slate-50"}`}
                onClick={() => setExpanded(!expanded)}
                title={t("components.token_stats.title")}
            >
                <Database size={16} className="text-slate-500" />
                <span className="text-xs font-bold text-slate-700">{formatNumber(session.total_tokens)}</span>
                {hasUsage && <span className="text-[10px] px-1 bg-green-100 text-green-700 rounded font-medium">{formatCost(session.estimated_cost_usd)}</span>}
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`} />
            </button>

            {expanded && (
                <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-100 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-50">
                        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <Activity size={16} className="text-blue-500" />
                            {t("components.token_stats.title")}
                        </h4>
                        <button className="text-slate-400 hover:text-slate-600 p-1" onClick={() => setExpanded(false)}><X size={16} /></button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{t("components.token_stats.session_title")}</div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-2 bg-slate-50 rounded-lg">
                                    <div className="text-[10px] text-slate-500 mb-0.5">{t("components.token_stats.input_tokens")}</div>
                                    <div className="text-sm font-bold text-slate-700">{formatNumber(session.prompt_tokens)}</div>
                                </div>
                                <div className="p-2 bg-slate-50 rounded-lg">
                                    <div className="text-[10px] text-slate-500 mb-0.5">{t("components.token_stats.output_tokens")}</div>
                                    <div className="text-sm font-bold text-slate-700">{formatNumber(session.completion_tokens)}</div>
                                </div>
                                <div className="p-2 bg-blue-50 rounded-lg col-span-2 flex justify-between items-center">
                                    <div>
                                        <div className="text-[10px] text-blue-600 font-medium">{t("components.token_stats.total_tokens")}</div>
                                        <div className="text-base font-black text-blue-700">{formatNumber(session.total_tokens)}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] text-blue-600 font-medium">{t("components.token_stats.estimated_cost")}</div>
                                        <div className="text-base font-black text-blue-700">{formatCost(session.estimated_cost_usd)}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {session.models_used && session.models_used.length > 0 && (
                            <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                    <Cpu size={12} /> {t("components.token_stats.models_used")}
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {session.models_used.map((model, i) => (
                                        <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-medium border border-slate-200">{model}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
