import { useLayoutEffect, useEffect } from "react";

export function usePanelResize(leftPanelRef, dependency) {
    const updatePanelHeight = () => {
        const panel = leftPanelRef.current;
        if (!panel) return;
        const height = Math.ceil(panel.getBoundingClientRect().height);
        document.documentElement.style.setProperty("--panel-height", `${height}px`);
    };

    useLayoutEffect(() => {
        updatePanelHeight();
    }, [dependency]);

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
}
