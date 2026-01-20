import { useState } from "react";
import { useTranslation } from "react-i18next";
import { API_BASE, APP_STATUS } from "../constants";
import { useFileStore } from "../store/useFileStore";
import { useSettingsStore } from "../store/useSettingsStore";
import { useUIStore } from "../store/useUIStore";


export function usePptxProcessor() {
    const { t } = useTranslation();
    const [progress, setProgress] = useState(0);

    // Stores
    const { file, blocks, setBlocks } = useFileStore();
    const {
        llmProvider, llmApiKey, llmBaseUrl, llmModel, llmFastMode,
        fontMapping, correction
    } = useSettingsStore(); // Correction (fillColor etc)
    const {
        sourceLang, secondaryLang, targetLang, mode, bilingualLayout,
        setStatus, setAppStatus, setBusy, setSlideDimensions
    } = useUIStore();


    // Note: useTm boolean should be in store. Assuming passed or gathered.
    // For now, let's assume useTm is a prop or we add it to store.
    // Let's check useUIStore or useSettingsStore for 'useTm' boolean.
    // It's not there yet. I will treat it as false default or add to store.
    // I should add useTm to useSettingsStore.
    const useTm = useSettingsStore(s => s.useTm);

    const { fillColor, textColor, lineColor, lineDash } = correction;

    const readErrorDetail = async (response, fallback) => {
        const errorText = await response.text();
        if (!errorText) return fallback;

        if (errorText.includes("<html>")) {
            const titleMatch = errorText.match(/<title>(.*?)<\/title>/);
            if (titleMatch && titleMatch[1]) return `${t("status.server_error")}: ${titleMatch[1]}`;
            if (response.status === 502) return `${t("status.server_error")} (502 Bad Gateway)`;
            if (response.status === 504) return `${t("status.server_timeout")} (504 Gateway Timeout)`;
            return `${t("status.server_error")} (${response.status})`;
        }

        try {
            const errorData = JSON.parse(errorText);
            return errorData.detail || errorText;
        } catch {
            return errorText;
        }
    };

    const buildBlockUid = (block, fallbackIndex) =>
        block._uid ||
        block.client_id ||
        `${block.slide_index ?? "x"}-${block.shape_id ?? "x"}-${block.block_type ?? "x"}-${fallbackIndex}`;

    const resolveOutputMode = (block) => {
        if (block.output_mode) return block.output_mode;
        const translatedText = (block.translated_text || "").trim();
        return translatedText ? "translated" : "source";
    };

    const handleExtract = async () => {
        if (!file) {
            setStatus(t("status.no_file"));
            return;
        }
        const fileName = file.name.toLowerCase();
        if (!fileName.endsWith(".pptx")) {
            setStatus(t("status.format_error"));
            return;
        }
        setBusy(true);
        setStatus(t("status.extracting"));
        setAppStatus(APP_STATUS.EXTRACTING);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const response = await fetch(`${API_BASE}/api/pptx/extract`, {
                method: "POST",
                body: formData
            });
            if (!response.ok) throw new Error(await readErrorDetail(response, t("status.extract_failed")));
            const data = await response.json();
            const nextBlocks = (data.blocks || []).map((block, idx) => {
                const translatedText = (block.translated_text || "").trim();
                const uid = buildBlockUid(block, idx);
                return {
                    ...block,
                    _uid: uid,
                    client_id: block.client_id || uid,
                    selected: block.selected !== false,
                    output_mode: block.output_mode || (translatedText ? "translated" : "source"),
                    isTranslating: false
                };
            });
            setBlocks(nextBlocks);
            setSlideDimensions({ width: data.slide_width, height: data.slide_height });
            setStatus({ key: "sidebar.extract.summary", params: { count: data.blocks?.length || 0 } });
            setAppStatus(APP_STATUS.IDLE);
            return data.language_summary;

        } catch (error) {
            setStatus(`${t("status.extract_failed")}：${error.message}`);
            setAppStatus(APP_STATUS.ERROR);
        } finally {
            setBusy(false);
        }
    };

    const handleTranslate = async () => {
        if (blocks.length === 0) {
            setStatus(t("status.no_blocks"));
            return;
        }
        if (llmProvider !== "ollama" && !llmApiKey) {
            setStatus(t("status.api_key_missing"));
            return;
        }
        setBusy(true);
        setProgress(0);
        setStatus(t("sidebar.translate.preparing"));
        setAppStatus(APP_STATUS.TRANSLATING);

        setBlocks(prev => prev.map(b => ({ ...b, isTranslating: true })));

        try {
            const formData = new FormData();
            formData.append("blocks", JSON.stringify(blocks));
            formData.append("source_language", sourceLang || "auto");
            formData.append("secondary_language", secondaryLang || "auto");
            formData.append("target_language", targetLang);
            formData.append("mode", mode);
            formData.append("use_tm", useTm ? "true" : "false");
            formData.append("provider", llmProvider);
            if (llmModel) formData.append("model", llmModel);
            if (llmApiKey) formData.append("api_key", llmApiKey);
            if (llmBaseUrl) formData.append("base_url", llmBaseUrl);
            formData.append("ollama_fast_mode", llmFastMode ? "true" : "false");

            const response = await fetch(`${API_BASE}/api/pptx/translate-stream`, {
                method: "POST",
                body: formData
            });

            if (!response.ok) {
                const detail = await readErrorDetail(response, t("status.translate_failed"));
                throw new Error(detail);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            let completedCount = 0;
            // Capture current blocks snapshot reference isn't enough, we need to know existing state?
            // Actually, we should just update blocks via setBlocks functional update to be safe
            // But here we need indices.
            let currentBlocks = [...blocks];

            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    if (buffer.trim()) {
                        const lines = buffer.split("\n\n");
                        for (const line of lines) {
                            if (!line.trim()) continue;
                            const eventMatch = line.match(/^event: (.*)$/m);
                            const dataMatch = line.match(/^data: (.*)$/m);
                            if (eventMatch && dataMatch) {
                                const eventType = eventMatch[1];
                                const eventData = JSON.parse(dataMatch[1]);
                                if (eventType === "complete") {
                                    const finalResult = eventData.blocks || [];
                                    setBlocks(prev => prev.map((b, i) => ({
                                        ...b,
                                        translated_text: finalResult[i]?.translated_text || b.translated_text,
                                        isTranslating: false,
                                        updatedAt: finalResult[i]?.translated_text ? new Date().toLocaleTimeString("zh-TW", { hour12: false }) : b.updatedAt
                                    })));
                                    setProgress(100);
                                    setStatus(t("sidebar.translate.completed"));
                                    setAppStatus(APP_STATUS.TRANSLATION_COMPLETED);
                                    setBusy(false);
                                    return;
                                } else if (eventType === "error") {
                                    throw new Error(eventData.detail || t("status.translate_failed"));
                                }
                            }
                        }
                    }
                    setBusy((prevBusy) => {
                        if (prevBusy) {
                            setStatus(t("status.interrupted"));
                            setAppStatus(APP_STATUS.IDLE);
                        }
                        return false;
                    });
                    break;
                }

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n\n");
                buffer = lines.pop();

                for (const line of lines) {
                    if (!line.trim()) continue;
                    const eventMatch = line.match(/^event: (.*)$/m);
                    const dataMatch = line.match(/^data: (.*)$/m);
                    if (!eventMatch || !dataMatch) continue;

                    const eventType = eventMatch[1];
                    const eventData = JSON.parse(dataMatch[1]);

                    if (eventType === "progress") {
                        const { completed_indices } = eventData;
                        completedCount += completed_indices.length;

                        // We need to update local variable 'currentBlocks' ? No, UI driven.
                        // Ideally we should batch updates to store.
                        // For progress bar:
                        const pct = Math.round((completedCount / blocks.length) * 100);
                        setProgress(pct);
                        setStatus(t("sidebar.translate.translating", { current: completedCount, total: blocks.length }));
                    } else if (eventType === "complete") {
                        const finalResult = eventData.blocks || [];
                        setBlocks(prev => prev.map((b, i) => ({
                            ...b,
                            translated_text: finalResult[i]?.translated_text || b.translated_text,
                            isTranslating: false,
                            updatedAt: finalResult[i]?.translated_text ? new Date().toLocaleTimeString("zh-TW", { hour12: false }) : b.updatedAt
                        })));
                        setProgress(100);
                        setStatus(t("sidebar.translate.completed"));
                        setAppStatus(APP_STATUS.TRANSLATION_COMPLETED);
                        setBusy(false);
                        return;
                    } else if (eventType === "error") {
                        throw new Error(eventData.detail || t("status.translate_failed"));
                    }
                }
            }
        } catch (error) {
            setStatus(`${t("status.translate_failed")}：${error.message}`);
            setAppStatus(APP_STATUS.ERROR);
            setBusy(false);
        }
    };

    const handleApply = async () => {
        if (!file || blocks.length === 0) return;
        setBusy(true);
        setStatus(t("sidebar.apply.applying"));
        setAppStatus(APP_STATUS.EXPORTING);
        try {
            const isPdf = file.name.toLowerCase().endsWith(".pdf");
            const endpoint = isPdf ? "/api/pdf/apply" : "/api/pptx/apply";
            const formData = new FormData();
            formData.append("file", file);

            const applyBlocks = mode === "correction"
                ? blocks.map(b => resolveOutputMode(b) === "source" ? { ...b, apply: false } : b)
                : blocks;

            formData.append("blocks", JSON.stringify(applyBlocks));
            formData.append("target_language", targetLang);
            formData.append("mode", mode);
            if (mode === "correction") {
                formData.append("fill_color", fillColor);
                formData.append("text_color", textColor);
                formData.append("line_color", lineColor);
                formData.append("line_dash", lineDash);
            }
            if (mode === "bilingual") formData.append("bilingual_layout", bilingualLayout);
            if (fontMapping) formData.append("font_mapping", JSON.stringify(fontMapping));

            const response = await fetch(`${API_BASE}${endpoint}`, {
                method: "POST",
                body: formData
            });
            if (!response.ok) throw new Error(t("status.apply_failed"));

            const result = await response.json();
            if (result.status !== "success" || !result.download_url) {
                throw new Error("後端生成失敗");
            }

            // --- V12 語義化重構：[原名]-[模式]-[版面]-日期-流水號.pptx ---
            console.log("Core Processor Version: 20260120-V12-SEMANTIC-NAMING");

            // 直接由瀏覽器處理下載，配合 Nginx 標頭透傳與 URL 路徑備援確保名稱。
            window.location.href = `${API_BASE}${result.download_url}`;

            setStatus(t("sidebar.apply.completed"));
            setAppStatus(APP_STATUS.EXPORT_COMPLETED);
        } catch (error) {
            setStatus(`${t("status.apply_failed")}：${error.message}`);
            setAppStatus(APP_STATUS.ERROR);
        } finally {
            setBusy(false);
        }
    };

    return { handleExtract, handleTranslate, handleApply, progress };
}
