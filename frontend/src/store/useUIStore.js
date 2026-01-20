import { create } from 'zustand';
import { APP_STATUS } from '../constants';

export const useUIStore = create((set) => ({
    // --- Global Status ---
    status: "",
    appStatus: APP_STATUS.IDLE,
    busy: false,
    setStatus: (status) => set({ status }),
    setAppStatus: (appStatus) => set({ appStatus }),
    setBusy: (busy) => set({ busy }),

    // --- Modals ---
    llmOpen: false,
    manageOpen: false,
    setLlmOpen: (open) => set({ llmOpen: open }),
    setManageOpen: (open) => set({ manageOpen: open }),

    // --- Tabs ---
    llmTab: "llm",
    manageTab: "glossary",
    slideDimensions: { width: 0, height: 0 },
    setLlmTab: (tab) => set({ llmTab: tab }),
    setManageTab: (tab) => set({ manageTab: tab }),
    setSlideDimensions: (dims) => set({ slideDimensions: dims }),


    // --- Processing Settings ---
    mode: "bilingual",
    bilingualLayout: "inline",
    sourceLang: "",
    secondaryLang: "",
    targetLang: "zh-TW",
    sourceLocked: false,
    secondaryLocked: false,
    targetLocked: false,

    setMode: (mode) => set({ mode }),
    setBilingualLayout: (layout) => set({ bilingualLayout: layout }),
    setSourceLang: (lang) => set({ sourceLang: lang }),
    setSecondaryLang: (lang) => set({ secondaryLang: lang }),
    setTargetLang: (lang) => set({ targetLang: lang }),
    setSourceLocked: (locked) => set({ sourceLocked: locked }),
    setSecondaryLocked: (locked) => set({ secondaryLocked: locked }),
    setTargetLocked: (locked) => set({ targetLocked: locked }),

    // --- Filters ---
    filterText: "",
    filterType: "all",
    filterSlide: "",
    setFilterText: (text) => set({ filterText: text }),
    setFilterType: (type) => set({ filterType: type }),
    setFilterSlide: (slide) => set({ filterSlide: slide }),
}));
