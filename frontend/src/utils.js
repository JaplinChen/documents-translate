/**
 * Utility functions for PPT Translate
 */

// Regex patterns for language detection
export const cjkRegex = /[\u4e00-\u9fff\u3400-\u4dbf]/;
export const viRegex = /[\u00C0-\u00C3\u00C8-\u00CA\u00CC-\u00CD\u00D2-\u00D5\u00D9-\u00DA\u00DD\u00E0-\u00E3\u00E8-\u00EA\u00EC-\u00ED\u00F2-\u00F5\u00F9-\u00FA\u00FD\u0102\u0103\u0110\u0111\u0128\u0129\u0168\u0169\u01A0\u01A1\u01AF\u01B0\u1EA0-\u1EF9]/i;

/**
 * Extract lines from text based on language
 */
export function extractLanguageLines(text, lang) {
    const lines = (text || "").split("\n").map((line) => line.trim()).filter(Boolean);
    if (!lang || lang === "auto") return lines;
    if (lang.startsWith("zh")) return lines.filter((line) => cjkRegex.test(line));
    if (lang === "vi") return lines.filter((line) => viRegex.test(line));
    return lines;
}

/**
 * Normalize text by removing whitespace
 */
export function normalizeText(text) {
    return (text || "").replace(/\s+/g, "").trim();
}

/**
 * Check if error message indicates connection refused
 */
export function isConnectionRefused(message) {
    return /WinError 10061|ECONNREFUSED|Connection refused|Errno 111/i.test(message || "");
}

/**
 * Format hint message for model detection errors
 */
export function formatModelDetectHint(message) {
    if (isConnectionRefused(message) || (message || "").includes("Ollama")) {
        return "請檢查：\n1. Ollama 服務是否啟動\n2. Base URL 是否正確\n3. 模型是否已下載";
    }
    return "請檢查：\n1. API Key 是否正確\n2. 模型名稱是否存在\n3. 網路連線是否正常";
}

/**
 * Read error detail from API response
 */
export async function readErrorDetail(response, fallback) {
    const errorText = await response.text();
    if (!errorText) return fallback;
    try {
        const errorData = JSON.parse(errorText);
        return errorData.detail || errorText;
    } catch {
        return errorText;
    }
}

/**
 * Build unique key for block
 */
export function buildBlockKey(block) {
    return [block.slide_index ?? "", block.shape_id ?? "", block.block_type ?? ""].join("|");
}

/**
 * Build unique ID for block
 */
export function buildBlockUid(block, fallbackIndex) {
    return block._uid || block.client_id ||
        `${block.slide_index ?? "x"}-${block.shape_id ?? "x"}-${block.block_type ?? "x"}-${fallbackIndex}`;
}

/**
 * Resolve output mode from block
 */
export function resolveOutputMode(block) {
    if (block.output_mode) return block.output_mode;
    const translatedText = (block.translated_text || "").trim();
    return translatedText ? "translated" : "source";
}

/**
 * Infer fallback language based on primary language
 */
export function inferFallbackLanguage(primaryLang, targetLang) {
    if (primaryLang === targetLang) return "";
    if (primaryLang === "en") return "zh-TW";
    if (primaryLang === "vi") return "zh-TW";
    if (primaryLang.startsWith("zh")) return "";
    return "";
}
