import { CJK_REGEX, VI_REGEX } from "../utils/regex";

export const LANGUAGE_OPTIONS = [
    { code: "auto", labelKey: "language.options.auto", label: "自動 (Auto)" },
    { code: "vi", labelKey: "language.options.vi", label: "Tiếng Việt" },
    { code: "zh-TW", labelKey: "language.options.zh_tw", label: "繁體中文" },
    { code: "zh-CN", labelKey: "language.options.zh_cn", label: "简体中文" },
    { code: "en", labelKey: "language.options.en", label: "English" },
    { code: "ja", labelKey: "language.options.ja", label: "日本語" },
    { code: "ko", labelKey: "language.options.ko", label: "한국어" }
];

export const getOptionLabel = (t, option) => {
    if (!option) return "";
    if (option.labelKey) return t(option.labelKey, option.label || option.name);
    return option.label || option.name || "";
};

export const extractLanguageLines = (text, lang) => {
    const lines = (text || "").split("\n").map(l => l.trim()).filter(Boolean);
    if (!lang || lang === "auto") return lines;
    if (lang.startsWith("zh")) return lines.filter(l => CJK_REGEX.test(l));
    if (lang === "vi") return lines.filter(l => VI_REGEX.test(l));
    return lines;
};
