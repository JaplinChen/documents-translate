import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

export function useSettingsPrompts(open, tab, apiBase) {
    const { t } = useTranslation();
    const [promptList, setPromptList] = useState([]);
    const [selectedPrompt, setSelectedPrompt] = useState("");
    const [promptContent, setPromptContent] = useState("");
    const [promptStatus, setPromptStatus] = useState("");
    const [promptLoading, setPromptLoading] = useState(false);

    const PROMPT_LABELS = {
        translate_json: t("settings.prompt_labels.translate_json"),
        system_message: t("settings.prompt_labels.system_message"),
        ollama_batch: t("settings.prompt_labels.ollama_batch")
    };

    useEffect(() => {
        if (!open || tab !== "prompt") return;
        let active = true;
        fetch(`${apiBase}/api/prompts`)
            .then(res => res.json())
            .then(data => {
                if (!active) return;
                setPromptList(data || []);
                if (data?.length) setSelectedPrompt(prev => prev || data[0]);
            })
            .catch(() => active && setPromptList([]));
        return () => { active = false; };
    }, [open, tab, apiBase]);

    useEffect(() => {
        if (!open || tab !== "prompt" || !selectedPrompt) return;
        let active = true;
        setPromptLoading(true);
        fetch(`${apiBase}/api/prompts/${selectedPrompt}`)
            .then(res => res.json())
            .then(data => active && setPromptContent(data.content || ""))
            .catch(() => active && setPromptContent(""))
            .finally(() => active && setPromptLoading(false));
        return () => { active = false; };
    }, [open, tab, selectedPrompt, apiBase]);

    const handleSavePrompt = async (onClose) => {
        if (!selectedPrompt) return;
        setPromptStatus(t("settings.status.saving"));
        try {
            await fetch(`${apiBase}/api/prompts/${selectedPrompt}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: promptContent })
            });
            setPromptStatus(t("settings.status.saved"));
            setTimeout(() => setPromptStatus(""), 2000);
            onClose();
        } catch (error) {
            setPromptStatus(t("settings.status.failed"));
        }
    };

    const handleResetPrompt = async () => {
        if (!selectedPrompt) return;
        setPromptLoading(true);
        try {
            const response = await fetch(`${apiBase}/api/prompts/${selectedPrompt}`);
            const data = await response.json();
            setPromptContent(data.content || "");
        } finally {
            setPromptLoading(false);
        }
    };

    return {
        promptList, selectedPrompt, setSelectedPrompt,
        promptContent, setPromptContent, promptStatus, promptLoading,
        handleSavePrompt, handleResetPrompt, PROMPT_LABELS
    };
}
