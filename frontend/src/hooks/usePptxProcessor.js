import { useState, useMemo } from "react";
import { API_BASE } from "../constants";

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
    setBusy
}) {
    const readErrorDetail = async (response, fallback) => {
        const errorText = await response.text();
        if (!errorText) return fallback;
        try {
            const errorData = JSON.parse(errorText);
            return errorData.detail || errorText;
        } catch {
            return errorText;
        }
    };

    const buildBlockKey = (block) =>
        [block.slide_index ?? "", block.shape_id ?? "", block.block_type ?? ""].join("|");

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
            setStatus("請先選擇檔案");
            return;
        }
        const fileName = file.name.toLowerCase();
        if (!fileName.endsWith(".pptx")) {
            setStatus("只支援 .pptx 檔案，請重新選擇");
            return;
        }
        setBusy(true);
        setStatus("抽取中...");
        try {
            const formData = new FormData();
            formData.append("file", file);
            const response = await fetch(`${API_BASE}/api/pptx/extract`, {
                method: "POST",
                body: formData
            });
            if (!response.ok) throw new Error(await readErrorDetail(response, "抽取失敗"));
            const data = await response.json();
            const nextBlocks = (data.blocks || []).map((block, idx) => {
                const translatedText = (block.translated_text || "").trim();
                const uid = buildBlockUid(block, idx);
                return {
                    ...block,
                    _uid: uid,
                    client_id: block.client_id || uid,
                    selected: block.selected !== false,
                    output_mode: block.output_mode || (translatedText ? "translated" : "source")
                };
            });
            setBlocks(nextBlocks);
            setStatus(`完成抽取，共 ${data.blocks?.length || 0} 筆`);
            return data.language_summary;
        } catch (error) {
            setStatus(`抽取失敗：${error.message}`);
        } finally {
            setBusy(false);
        }
    };

    const handleTranslate = async () => {
        if (blocks.length === 0) {
            setStatus("請先抽取區塊");
            return;
        }
        if (llmProvider !== "ollama" && !llmApiKey) {
            setStatus("請先在 LLM 設定中填入 API Key");
            return;
        }
        setBusy(true);
        const totalCount = blocks.length;
        const chunkSize = llmProvider === "ollama" ? (llmFastMode ? 3 : 6) : 20;
        setStatus(`翻譯中...（0/${totalCount}）`);
        try {
            let translatedCount = 0;
            let updatedBlocks = blocks.map(b => ({ ...b, isTranslating: false }));

            for (let start = 0; start < blocks.length; start += chunkSize) {
                const chunkIndices = Array.from(
                    { length: Math.min(chunkSize, blocks.length - start) },
                    (_, idx) => start + idx
                );
                chunkIndices.forEach(idx => { updatedBlocks[idx].isTranslating = true; });
                setBlocks([...updatedBlocks]);

                const chunkBlocks = chunkIndices.map(idx => updatedBlocks[idx]);
                const formData = new FormData();
                formData.append("blocks", JSON.stringify(chunkBlocks));
                formData.append("source_language", sourceLang || "auto");
                formData.append("secondary_language", secondaryLang || "auto");
                formData.append("target_language", targetLang);
                formData.append("mode", mode);
                formData.append("use_tm", useTm ? "true" : "false");
                formData.append("provider", llmProvider);
                if (llmModel) formData.append("model", llmModel);
                if (llmApiKey) formData.append("api_key", llmApiKey);
                if (llmBaseUrl) formData.append("base_url", llmBaseUrl);

                const response = await fetch(`${API_BASE}/api/pptx/translate`, {
                    method: "POST",
                    body: formData
                });

                if (!response.ok) throw new Error(await readErrorDetail(response, "翻譯失敗"));
                const data = await response.json();
                const translated = data.blocks || [];

                translated.forEach((matched, localIdx) => {
                    const blockIdx = chunkIndices[localIdx];
                    const block = updatedBlocks[blockIdx];
                    const translatedText = matched.translated_text || block.translated_text || "";
                    updatedBlocks[blockIdx] = {
                        ...block,
                        translated_text: translatedText,
                        isTranslating: false,
                        updatedAt: new Date().toLocaleTimeString("zh-TW", { hour12: false })
                    };
                });

                translatedCount += chunkBlocks.length;
                setBlocks([...updatedBlocks]);
                setStatus(`翻譯中...（${translatedCount}/${totalCount}）`);
            }
            setStatus("翻譯完成");
        } catch (error) {
            setStatus(`翻譯失敗：${error.message}`);
        } finally {
            setBusy(false);
        }
    };

    const handleApply = async () => {
        if (!file || blocks.length === 0) return;
        setBusy(true);
        setStatus("套用中...");
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
            if (!response.ok) throw new Error("套用失敗");
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = mode === "correction" ? "pptx_corrected.pptx" : "pptx_translated.pptx";
            a.click();
            URL.revokeObjectURL(url);
            setStatus("已輸出檔案");
        } catch (error) {
            setStatus(`套用失敗：${error.message}`);
        } finally {
            setBusy(false);
        }
    };

    return { handleExtract, handleTranslate, handleApply };
}
