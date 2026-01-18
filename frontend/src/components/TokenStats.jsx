import { useState, useEffect } from "react";
import { API_BASE } from "../constants";

/**
 * Token Usage Statistics Display Component
 * Shows real-time token usage and cost estimation
 */
export default function TokenStats({ className = "" }) {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(false);

    const fetchStats = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/token-stats`);
            const data = await res.json();
            setStats(data);
        } catch (error) {
            console.error("Failed to fetch token stats:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        // Refresh every 30 seconds
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading || !stats) {
        return null;
    }

    const { session, all_time } = stats;
    const hasUsage = session.total_tokens > 0;

    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
        if (num >= 1000) return (num / 1000).toFixed(1) + "K";
        return num.toString();
    };

    const formatCost = (cost) => {
        if (cost < 0.01) return "< $0.01";
        return `$${cost.toFixed(2)}`;
    };

    return (
        <div className={`token-stats ${className}`}>
            <button
                className="token-stats-toggle"
                onClick={() => setExpanded(!expanded)}
                title="Token 用量統計"
            >
                <span className="token-icon">🔢</span>
                <span className="token-count">{formatNumber(session.total_tokens)}</span>
                {hasUsage && <span className="token-cost">{formatCost(session.estimated_cost_usd)}</span>}
            </button>

            {expanded && (
                <div className="token-stats-dropdown">
                    <div className="token-stats-header">
                        <h4>Token 用量統計</h4>
                        <button className="close-btn" onClick={() => setExpanded(false)}>×</button>
                    </div>

                    <div className="token-stats-section">
                        <h5>📊 本次工作階段 (24h)</h5>
                        <div className="stats-grid">
                            <div className="stat-item">
                                <span className="stat-label">輸入 Token</span>
                                <span className="stat-value">{formatNumber(session.prompt_tokens)}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">輸出 Token</span>
                                <span className="stat-value">{formatNumber(session.completion_tokens)}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">總計 Token</span>
                                <span className="stat-value highlight">{formatNumber(session.total_tokens)}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">預估成本</span>
                                <span className="stat-value cost">{formatCost(session.estimated_cost_usd)}</span>
                            </div>
                        </div>
                        <p className="stat-hint">請求次數：{session.request_count}</p>
                    </div>

                    <div className="token-stats-section">
                        <h5>📈 累計統計</h5>
                        <div className="stats-row">
                            <span>{formatNumber(all_time.total_tokens)} Tokens</span>
                            <span>{formatCost(all_time.estimated_cost_usd)}</span>
                            <span>{all_time.request_count} 次請求</span>
                        </div>
                    </div>

                    {session.models_used && session.models_used.length > 0 && (
                        <div className="token-stats-section">
                            <h5>🤖 使用模型</h5>
                            <div className="model-tags">
                                {session.models_used.map((model, i) => (
                                    <span key={i} className="model-tag">{model}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
