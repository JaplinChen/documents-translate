import { useLayoutEffect, useRef, useState } from "react";

/**
 * Custom hook for draggable modal positioning
 */
export function useDraggableModal(open) {
    const modalRef = useRef(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const dragState = useRef(null);

    useLayoutEffect(() => {
        if (!open) return;
        const modal = modalRef.current;
        if (!modal) return;
        const rect = modal.getBoundingClientRect();
        const top = Math.max(24, (window.innerHeight - rect.height) / 2);
        const left = Math.max(24, (window.innerWidth - rect.width) / 2);
        setPosition({ top, left });
    }, [open]);

    const onMouseDown = (event) => {
        if (event.button !== 0) return;
        if (event.target.closest("button")) return;
        const modal = modalRef.current;
        if (!modal) return;
        const rect = modal.getBoundingClientRect();
        dragState.current = {
            offsetX: event.clientX - rect.left,
            offsetY: event.clientY - rect.top
        };

        const handleMove = (moveEvent) => {
            if (!dragState.current) return;
            const bounds = modal.getBoundingClientRect();
            const maxLeft = window.innerWidth - bounds.width - 12;
            const maxTop = window.innerHeight - bounds.height - 12;
            let nextLeft = moveEvent.clientX - dragState.current.offsetX;
            let nextTop = moveEvent.clientY - dragState.current.offsetY;
            nextLeft = Math.min(Math.max(12, nextLeft), Math.max(12, maxLeft));
            nextTop = Math.min(Math.max(12, nextTop), Math.max(12, maxTop));
            setPosition({ top: nextTop, left: nextLeft });
        };

        const handleUp = () => {
            dragState.current = null;
            document.removeEventListener("mousemove", handleMove);
            document.removeEventListener("mouseup", handleUp);
        };

        document.addEventListener("mousemove", handleMove);
        document.addEventListener("mouseup", handleUp);
    };

    return { modalRef, position, onMouseDown };
}
