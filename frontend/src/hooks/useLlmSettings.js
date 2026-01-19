import { useState, useEffect, useMemo } from "react";
import { API_BASE } from "../constants";

export function useLlmSettings() {
    const [llmProvider, setLlmProvider] = useState("ollama");
    const [llmApiKey, setLlmApiKey] = useState("");
    const [llmBaseUrl, setLlmBaseUrl] = useState("");
    const [llmModel, setLlmModel] = useState("");
    const [llmFastMode, setLlmFastMode] = useState(false);
    const [llmModels, setLlmModels] = useState([]);
    const [llmStatus, setLlmStatus] = useState("");
    const [llmOpen, setLlmOpen] = useState(false);
    const [llmTab, setLlmTab] = useState("llm");

    const defaultBaseUrl = useMemo(() => {
        if (llmProvider === "gemini") {
            return "https://generativelanguage.googleapis.com/v1beta";
        }
        if (llmProvider === "ollama") {
            return "http://host.docker.internal:11434";
        }
        return "https://api.openai.com/v1";
    }, [llmProvider]);

    const readLlmSettings = () => {
        const empty = {
            provider: "ollama",
            providers: {
                chatgpt: { apiKey: "", baseUrl: "https://api.openai.com/v1", model: "", fastMode: false },
                gemini: { apiKey: "", baseUrl: "https://generativelanguage.googleapis.com/v1beta", model: "", fastMode: false },
                ollama: { apiKey: "", baseUrl: "http://host.docker.internal:11434", model: "", fastMode: false }
            }
        };
        const saved = window.localStorage.getItem("llmSettings");
        if (!saved) return empty;
        try {
            let savedSettings = JSON.parse(saved);
            if (!savedSettings || typeof savedSettings !== "object") return empty;

            // Auto-migrate localhost/127.0.0.1 to host.docker.internal for Ollama
            if (
                savedSettings.providers?.ollama?.baseUrl?.includes("localhost") ||
                savedSettings.providers?.ollama?.baseUrl?.includes("127.0.0.1")
            ) {
                savedSettings.providers.ollama.baseUrl = "http://host.docker.internal:11434";
            }

            const provider = savedSettings.provider || "ollama";
            return {
                provider,
                providers: {
                    ...empty.providers,
                    ...(savedSettings.providers || {}),
                    [provider]: {
                        apiKey: (savedSettings.providers?.[provider]?.apiKey) || "",
                        baseUrl: (savedSettings.providers?.[provider]?.baseUrl) || empty.providers[provider].baseUrl,
                        model: (savedSettings.providers?.[provider]?.model) || "",
                        fastMode: (savedSettings.providers?.[provider]?.fastMode) || false
                    }
                }
            };
        } catch {
            return empty;
        }
    };

    useEffect(() => {
        const settings = readLlmSettings();
        const provider = settings.provider || "ollama";
        const providerSettings = settings.providers?.[provider] || {};
        setLlmProvider(provider);
        setLlmApiKey(providerSettings.apiKey || "");
        setLlmBaseUrl(providerSettings.baseUrl || "");
        setLlmModel(providerSettings.model || "");
        setLlmFastMode(Boolean(providerSettings.fastMode));
    }, []);

    const handleProviderChange = (newProvider) => {
        setLlmProvider(newProvider);
        const settings = readLlmSettings();
        const providerSettings = settings.providers?.[newProvider] || {};
        setLlmApiKey(providerSettings.apiKey || "");
        setLlmBaseUrl(providerSettings.baseUrl || defaultBaseUrl); // Use defaultBaseUrl if empty
        setLlmModel(providerSettings.model || "");
        setLlmFastMode(Boolean(providerSettings.fastMode));
        setLlmModels([]);
        setLlmStatus("");
    };

    const handleDetectModels = async () => {
        if (llmProvider !== "ollama" && !llmApiKey) {
            setLlmStatus("請先輸入 API Key");
            return;
        }
        setLlmStatus("模型偵測中...");
        try {
            const formData = new FormData();
            formData.append("provider", llmProvider);
            if (llmApiKey) formData.append("api_key", llmApiKey);
            formData.append("base_url", llmBaseUrl || defaultBaseUrl);

            const response = await fetch(`${API_BASE}/api/llm/models`, {
                method: "POST",
                body: formData
            });
            if (!response.ok) throw new Error(await response.text() || "未知錯誤");

            const data = await response.json();
            const models = data.models || [];
            setLlmModels(models);

            if (models.length) {
                const validModel = models.includes(llmModel) ? llmModel : models[0];
                setLlmModel(validModel);
            }
            setLlmStatus(models.length ? `已偵測 ${models.length} 個模型` : "未偵測到模型");
        } catch (error) {
            setLlmStatus("模型偵測失敗");
            console.error("Detect Models Error:", error.message);
        }
    };

    const handleSaveLlm = () => {
        const stored = readLlmSettings();
        const next = {
            ...stored,
            provider: llmProvider,
            providers: {
                ...stored.providers,
                [llmProvider]: {
                    apiKey: llmApiKey,
                    baseUrl: llmBaseUrl,
                    model: llmModel,
                    fastMode: llmFastMode
                }
            }
        };
        window.localStorage.setItem("llmSettings", JSON.stringify(next));
        setLlmStatus("已儲存設定");
        setLlmOpen(false);
    };

    return {
        llmProvider, setLlmProvider: handleProviderChange,
        llmApiKey, setLlmApiKey,
        llmBaseUrl, setLlmBaseUrl,
        llmModel, setLlmModel,
        llmFastMode, setLlmFastMode,
        llmModels, llmStatus,
        llmOpen, setLlmOpen,
        llmTab, setLlmTab,
        defaultBaseUrl,
        handleDetectModels,
        handleSaveLlm
    };
}
