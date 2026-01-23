import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { API_BASE } from '../constants';
import { DEFAULT_FONT_MAPPING } from '../components/settings/FontSettings';

const DEFAULT_PROVIDERS = {
    chatgpt: { apiKey: "", baseUrl: "https://api.openai.com/v1", model: "", fastMode: false },
    gemini: { apiKey: "", baseUrl: "https://generativelanguage.googleapis.com/v1beta", model: "", fastMode: false },
    ollama: { apiKey: "", baseUrl: "http://host.docker.internal:11434", model: "", fastMode: false }
};

export const useSettingsStore = create(
    persist(
        (set, get) => ({
            // --- LLM Settings ---
            llmProvider: 'ollama',
            providers: DEFAULT_PROVIDERS,

            // Transient (Non-persisted usually, but simplified here)
            llmModels: [],
            llmStatus: '',
            useTm: false,

            // Actions
            setLlmProvider: (provider) => set({ llmProvider: provider }),
            setUseTm: (value) => set({ useTm: value }),

            updateProviderSettings: (provider, settings) => set(state => ({
                providers: {
                    ...state.providers,
                    [provider]: { ...state.providers[provider], ...settings }
                }
            })),

            setLlmModels: (models) => set({ llmModels: models }),
            setLlmStatus: (status) => set({ llmStatus: status }),

            detectModels: async () => {
                const { llmProvider, providers } = get();
                const settings = providers[llmProvider];

                // Validation
                if (llmProvider !== 'ollama' && !settings.apiKey) {
                    set({ llmStatus: "請先輸入 API Key" });
                    return;
                }

                set({ llmStatus: "模型偵測中..." });

                try {
                    const formData = new FormData();
                    formData.append("provider", llmProvider);
                    if (settings.apiKey) formData.append("api_key", settings.apiKey);

                    // Use default URL logic if empty
                    let baseUrl = settings.baseUrl;
                    if (!baseUrl) {
                        if (llmProvider === 'gemini') baseUrl = DEFAULT_PROVIDERS.gemini.baseUrl;
                        else if (llmProvider === 'ollama') baseUrl = DEFAULT_PROVIDERS.ollama.baseUrl;
                        else baseUrl = DEFAULT_PROVIDERS.chatgpt.baseUrl;
                    }
                    formData.append("base_url", baseUrl);

                    const response = await fetch(`${API_BASE}/api/llm/models`, {
                        method: "POST",
                        body: formData
                    });

                    if (!response.ok) throw new Error(await response.text() || "未知錯誤");

                    const data = await response.json();
                    const models = data.models || [];

                    set({ llmModels: models });

                    // Auto-select model if valid
                    const currentModel = settings.model;
                    if (models.length) {
                        const validModel = models.includes(currentModel) ? currentModel : models[0];
                        get().updateProviderSettings(llmProvider, { model: validModel });
                    }

                    set({ llmStatus: models.length ? `已偵測 ${models.length} 個模型` : "未偵測到模型" });
                } catch (error) {
                    set({ llmStatus: "模型偵測失敗" });
                    console.error("Detect Models Error:", error);
                }
            },

            // --- Font Settings ---
            fontMapping: DEFAULT_FONT_MAPPING,
            setFontMapping: (mapping) => {
                // Support functional update or value
                set(state => ({
                    fontMapping: typeof mapping === 'function' ? mapping(state.fontMapping) : mapping
                }));
            },

            // --- Correction Settings ---
            correction: {
                fillColor: "#FFF16A",
                textColor: "#D90000",
                lineColor: "#7B2CB9",
                lineDash: "dash",
                similarityThreshold: 0.75
            },
            setCorrection: (key, value) => set(state => ({
                correction: { ...state.correction, [key]: value }
            })),

            // --- AI Settings ---
            ai: {
                tone: "professional",
                useVision: true,
                useSmartLayout: true
            },
            setAiOption: (key, value) => set(state => ({
                ai: { ...state.ai, [key]: value }
            }))
        }),
        {
            name: 'app-settings-storage', // Key in localStorage
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                llmProvider: state.llmProvider,
                providers: state.providers,
                fontMapping: state.fontMapping,
                correction: state.correction,
                ai: state.ai,
                useTm: state.useTm
            }), // Only persist these fields, skip models/status

        }
    )
);
