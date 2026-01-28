import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { API_BASE } from "../constants";

/**
 * Term Suggestions Panel Component
 * Displays AI-suggested terms that can be added to glossary
 */
export function TermSuggestionsPanel({ blocks, onAddTerm, onClose }) {
    const { t } = useTranslation();
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [addedTerms, setAddedTerms] = useState(new Set());

    useEffect(() => {
        if (!blocks || blocks.length === 0) {
            setLoading(false);
            return;
        }
        fetchSuggestions();
    }, [blocks]);

    const fetchSuggestions = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE}/api/suggest-terms`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ blocks }),
            });
            if (!response.ok) throw new Error(t("term_suggestions.fetch_failed"));
            const data = await response.json();
            setSuggestions(data.suggestions || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTerm = (suggestion) => {
        if (onAddTerm) {
            onAddTerm({
                source_text: suggestion.term,
                target_text: "",
                source_lang: "auto",
                target_lang: "zh-TW",
                priority: 5,
            });
        }
        setAddedTerms(prev => new Set([...prev, suggestion.term.toLowerCase()]));
    };

    const getCategoryIcon = (category) => {
        switch (category) {
            case "product": return "🏷️";
            case "acronym": return "🔤";
            case "technical": return "⚙️";
            case "proper_noun": return "📌";
            default: return "📝";
        }
    };

    const getConfidenceStyle = (confidence) => {
        if (confidence >= 0.9) return { color: "#059669", fontWeight: "600" };
        if (confidence >= 0.7) return { color: "#d97706" };
        return { color: "#6b7280" };
    };

    return (
        <div className="term-suggestions-panel" style={{
            backgroundColor: "#fff",
            borderRadius: "12px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
            maxWidth: "400px",
            maxHeight: "500px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
        }}>
            {/* Header */}
            <div style={{
                padding: "14px 16px",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
            }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "600" }}>
                        {t("term_suggestions.title")}
                    </h3>
                    <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#6b7280" }}>
                        {t("term_suggestions.count", { count: suggestions.length })}
                    </p>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        style={{
                            background: "none",
                            border: "none",
                            fontSize: "18px",
                            cursor: "pointer",
                            padding: "4px",
                        }}
                    >
                        ×
                    </button>
                )}
            </div>

            {/* Content */}
            <div style={{
                flex: 1,
                overflow: "auto",
                padding: "12px",
            }}>
                {loading && (
                    <div style={{ textAlign: "center", padding: "20px", color: "#6b7280" }}>
                        {t("term_suggestions.loading")}
                    </div>
                )}

                {error && (
                    <div style={{
                        padding: "12px",
                        backgroundColor: "#fee2e2",
                        color: "#991b1b",
                        borderRadius: "8px",
                        fontSize: "13px",
                    }}>
                        {error}
                    </div>
                )}

                {!loading && !error && suggestions.length === 0 && (
                    <div style={{ textAlign: "center", padding: "20px", color: "#6b7280" }}>
                        {t("term_suggestions.empty")}
                    </div>
                )}

                {!loading && suggestions.map((suggestion, idx) => {
                    const isAdded = addedTerms.has(suggestion.term.toLowerCase());
                    return (
                        <div
                            key={idx}
                            style={{
                                padding: "10px 12px",
                                marginBottom: "8px",
                                backgroundColor: isAdded ? "#f0fdf4" : "#f9fafb",
                                borderRadius: "8px",
                                border: isAdded ? "1px solid #86efac" : "1px solid #e5e7eb",
                            }}
                        >
                            <div style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "4px",
                            }}>
                                <span style={{ fontWeight: "600", fontSize: "14px" }}>
                                    {getCategoryIcon(suggestion.category)} {suggestion.term}
                                </span>
                                <span style={{
                                    fontSize: "11px",
                                    ...getConfidenceStyle(suggestion.confidence),
                                }}>
                                    {Math.round(suggestion.confidence * 100)}%
                                </span>
                            </div>
                            <div style={{
                                fontSize: "11px",
                                color: "#6b7280",
                                marginBottom: "8px",
                                lineHeight: "1.4",
                            }}>
                                {suggestion.context}
                            </div>
                            <button
                                onClick={() => handleAddTerm(suggestion)}
                                disabled={isAdded}
                                style={{
                                    padding: "4px 10px",
                                    fontSize: "11px",
                                    borderRadius: "4px",
                                    border: "none",
                                    cursor: isAdded ? "default" : "pointer",
                                    backgroundColor: isAdded ? "#86efac" : "#3b82f6",
                                    color: isAdded ? "#166534" : "#fff",
                                }}
                            >
                                {isAdded ? t("term_suggestions.added") : t("term_suggestions.add")}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default TermSuggestionsPanel;
