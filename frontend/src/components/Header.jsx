import React from "react";

export function Header({ status, onOpenSettings, onOpenManage }) {
    return (
        <header className="hero">
            <div className="hero-content">
                <p className="kicker">PPTX Translate Console</p>
                <h1>PPTX 翻譯與校正控制台</h1>
                <p className="subtitle">
                    上傳簡報、抽取文字、調整翻譯，再輸出具有校正樣式的 PPTX。
                </p>
            </div>

            <div className="header-actions-group">
                <div className="status">
                    <span className="status-label">狀態</span>
                    <span className="status-value">{status}</span>
                </div>

                <div className="btn-group">
                    <button
                        className="btn-icon-action text-primary border-primary"
                        type="button"
                        onClick={onOpenSettings}
                        title="設定"
                    >
                        ⚙
                    </button>
                    <button
                        className="btn-icon-action"
                        type="button"
                        onClick={onOpenManage}
                        title="術語與翻譯記憶"
                    >
                        📚
                    </button>
                </div>
            </div>
        </header>
    );
}
