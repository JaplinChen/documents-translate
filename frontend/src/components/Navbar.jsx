import React from "react";
import TokenStats from "./TokenStats";

export function Navbar({ currentStep, status, onOpenSettings, onOpenManage, steps }) {
    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <span className="brand-logo">💎</span>
                <span className="brand-name">PPTX 翻譯與校正控制台</span>
            </div>

            <div className="navbar-nav">
                <div className="dot-stepper">
                    {steps.map((step) => (
                        <div
                            key={step.id}
                            className={`dot-node ${step.id === currentStep ? "is-current" : ""} ${step.id < currentStep ? "is-done" : ""}`}
                            title={step.label}
                        >
                            <span className="dot"></span>
                            <span className="dot-label">{step.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="navbar-actions">
                <TokenStats />

                <div className="mini-status">
                    <span className="dot pulse-blue"></span>
                    <span className="status-text">{status}</span>
                </div>

                <div className="action-btns">
                    <button className="nav-btn" onClick={onOpenManage} title="資源庫管理">
                        📚 管理
                    </button>
                    <button className="nav-btn primary" onClick={onOpenSettings} title="系統設定">
                        ⚙ 設定
                    </button>
                </div>
            </div>
        </nav>
    );
}
