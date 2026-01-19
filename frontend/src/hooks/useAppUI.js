import { useState, useMemo, useEffect, useLayoutEffect } from "react";
import { APP_STATUS } from "../constants";

export function useAppUI(blocks, leftPanelRef) {
    const [status, setStatus] = useState("");
    const [appStatus, setAppStatus] = useState(APP_STATUS.IDLE);
    const [busy, setBusy] = useState(false);
    const [filterText, setFilterText] = useState("");
    const [filterType, setFilterType] = useState("all");
    const [filterSlide, setFilterSlide] = useState("");

    const updatePanelHeight = () => {
        const panel = leftPanelRef.current;
        if (!panel) return;
        const height = Math.ceil(panel.getBoundingClientRect().height);
        document.documentElement.style.setProperty("--panel-height", `${height}px`);
    };

    useLayoutEffect(() => {
        updatePanelHeight();
    }, [blocks.length]);

    useEffect(() => {
        const panel = leftPanelRef.current;
        if (!panel || typeof ResizeObserver === "undefined") return undefined;
        const observer = new ResizeObserver(() => updatePanelHeight());
        observer.observe(panel);
        window.addEventListener("resize", updatePanelHeight);
        return () => {
            observer.disconnect();
            window.removeEventListener("resize", updatePanelHeight);
        };
    }, [leftPanelRef]);

    const filteredBlocks = useMemo(() => {
        return blocks.filter((block) => {
            if (filterType !== "all" && block.block_type !== filterType) return false;
            if (filterSlide.trim() !== "") {
                const slideValue = Number(filterSlide);
                if (!Number.isNaN(slideValue) && block.slide_index !== slideValue) return false;
            }
            if (filterText.trim() !== "") {
                const needle = filterText.toLowerCase();
                const source = (block.source_text || "").toLowerCase();
                const translated = (block.translated_text || "").toLowerCase();
                if (!source.includes(needle) && !translated.includes(needle)) return false;
            }
            return true;
        });
    }, [blocks, filterText, filterSlide, filterType]);

    return {
        status, setStatus,
        appStatus, setAppStatus,
        busy, setBusy,
        filterText, setFilterText,
        filterType, setFilterType,
        filterSlide, setFilterSlide,
        filteredBlocks,
        updatePanelHeight
    };
}
