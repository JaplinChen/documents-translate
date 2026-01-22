import { CJK_REGEX, VI_REGEX } from "../utils/regex";

export const LANGUAGE_OPTIONS = [
    { code: "auto", label: "自動 (Auto)" },
    { code: "vi", label: "Tiếng Việt" },
    { code: "zh-TW", label: "繁體中文" },
    { code: "zh-CN", label: "简体中文" },
    { code: "en", label: "English" },
    { code: "ja", label: "日本語" },
    { code: "ko", label: "한국어" }
];

export const extractLanguageLines = (text, lang) => {
    const lines = (text || "").split("\n").map(l => l.trim()).filter(Boolean);
    if (!lang || lang === "auto") return lines;
    if (lang.startsWith("zh")) return lines.filter(l => CJK_REGEX.test(l));
    if (lang === "vi") return lines.filter(l => VI_REGEX.test(l));
    return lines;
};
