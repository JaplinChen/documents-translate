import { useState } from "react";
import { useTranslation } from "react-i18next";
import { API_BASE, APP_STATUS } from "../constants";

export function usePptxProcessor({
    file,
    blocks,
    setBlocks,
    sourceLang,
    secondaryLang,
    targetLang,
    mode,
    useTm,
    llmProvider,
    llmApiKey,
    llmBaseUrl,
    llmModel,
    llmFastMode,
    bilingualLayout,
    fillColor,
    textColor,
    lineColor,
    lineDash,
    setStatus,
    setAppStatus,
    setBusy
}) {
    const { t } = useTranslation();
    const [progress, setProgress] = useState(0);

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
            // Store status as object for dynamic localization
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

        // Mark all blocks as translating
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
            let currentBlocks = [...blocks];

            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    if (buffer.trim()) {
                        // Process remaining buffer
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
                                    const nextBlocks = currentBlocks.map((b, i) => ({
                                        ...b,
                                        translated_text: finalResult[i]?.translated_text || b.translated_text,
                                        isTranslating: false,
                                        updatedAt: finalResult[i]?.translated_text ? new Date().toLocaleTimeString("zh-TW", { hour12: false }) : b.updatedAt
                                    }));
                                    setBlocks(nextBlocks);
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

                    // If done and still busy (no complete event), treat as interruption
                    setBusy((prevBusy) => {
                        if (prevBusy) {
                            setStatus(t("status.interrupted"));
                            setAppStatus(APP_STATUS.IDLE);
                            // Optional: Retry?
                        }
                        return false;
                    });
                    break;
                }

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n\n");
                buffer = lines.pop(); // Keep last incomplete chunk

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

                        // Update blocks that were in this particular chunk
                        completed_indices.forEach(idx => {
                            if (currentBlocks[idx]) {
                                currentBlocks[idx] = { ...currentBlocks[idx], isTranslating: false };
                            }
                        });

                        const pct = Math.round((completedCount / blocks.length) * 100);
                        setProgress(pct);
                        setStatus(t("sidebar.translate.translating", { current: completedCount, total: blocks.length }));
                    } else if (eventType === "complete") {
                        const finalResult = eventData.blocks || [];
                        const nextBlocks = currentBlocks.map((b, i) => ({
                            ...b,
                            translated_text: finalResult[i]?.translated_text || b.translated_text,
                            isTranslating: false,
                            updatedAt: finalResult[i]?.translated_text ? new Date().toLocaleTimeString("zh-TW", { hour12: false }) : b.updatedAt
                        }));
                        setBlocks(nextBlocks);
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

            const response = await fetch(`${API_BASE}${endpoint}`, {
                method: "POST",
                body: formData
            });
            if (!response.ok) throw new Error(t("status.apply_failed"));
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = mode === "correction" ? "pptx_corrected.pptx" : "pptx_translated.pptx";
            a.click();
            URL.revokeObjectURL(url);
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
