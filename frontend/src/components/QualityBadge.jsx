import React from "react";

/**
 * Quality Badge Component
 * Displays a visual indicator of translation quality score
 */
export function QualityBadge({ score, issues = [], compact = false }) {
    if (!score && score !== 0) return null;

    const getColor = (s) => {
        if (s >= 8) return { bg: "#dcfce7", text: "#166534", border: "#86efac" }; // Green
        if (s >= 5) return { bg: "#fef9c3", text: "#854d0e", border: "#fde047" }; // Yellow
        return { bg: "#fee2e2", text: "#991b1b", border: "#fca5a5" }; // Red
    };

    const getLabel = (s) => {
        if (s >= 9) return "優秀";
        if (s >= 8) return "良好";
        if (s >= 6) return "尚可";
        if (s >= 4) return "待改進";
        return "需審核";
    };

    const colors = getColor(score);

    if (compact) {
        return (
            <span
                className="quality-badge-compact"
                title={`品質分數: ${score}/10\n${issues.join("\n")}`}
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    fontSize: "11px",
                    fontWeight: "600",
                    backgroundColor: colors.bg,
                    color: colors.text,
                    border: `1px solid ${colors.border}`,
                    cursor: issues.length > 0 ? "help" : "default",
                }}
            >
                {score}
            </span>
        );
    }

    return (
        <div
            className="quality-badge"
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 10px",
                borderRadius: "16px",
                fontSize: "12px",
                fontWeight: "500",
                backgroundColor: colors.bg,
                color: colors.text,
                border: `1px solid ${colors.border}`,
            }}
        >
            <span style={{ fontWeight: "700" }}>{score}</span>
            <span>{getLabel(score)}</span>
            {issues.length > 0 && (
                <span
                    title={issues.join("\n")}
                    style={{ cursor: "help", opacity: 0.7 }}
                >
                    ⚠️
                </span>
            )}
        </div>
    );
}

export default QualityBadge;
