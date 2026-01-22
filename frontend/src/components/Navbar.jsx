import React from "react";
import { useTranslation } from "react-i18next";
import { APP_STATUS } from "../constants";
import TokenStats from "./TokenStats";
import LanguageSelector from "./LanguageSelector";

export function Navbar({ currentStep, status, appStatus, onOpenSettings, onOpenManage, onOpenHistory, steps, progress }) {
    const { t } = useTranslation();

    return (
        <nav className="navbar">
            {progress > 0 && progress < 100 && (
                <div className="navbar-progress-bar">
                    <div className="navbar-progress-inner" style={{ width: `${progress}%` }}></div>
                </div>
            )}
            <div className="navbar-brand">
                <span className="brand-logo">💎</span>
                <span className="brand-name">{t("app.title")}</span>
            </div>

            <div className="navbar-nav">
                {/* Stepper moved to Sidebar */}
            </div>

            <div className="navbar-actions">
                <div className={`mini-status ${appStatus === APP_STATUS.ERROR ? "is-error" : ""}`}>
                    <span className="dot pulse-blue"></span>
                    <span className="status-text" title={status && typeof status === 'string' ? status : (status?.key ? t(status.key, status.params) : t(`settings.global_status.${appStatus?.toLowerCase() || 'idle'}`))}>
                        {(() => {
                            if (typeof status === 'string' && status) return status;
                            if (status && typeof status === 'object' && status.key) {
                                return t(status.key, status.params);
                            }
                            if (appStatus === APP_STATUS.IDLE) {
                                return t("settings.global_status.idle");
                            }
                            return t(`settings.global_status.${appStatus?.toLowerCase() || 'idle'}`);
                        })()}
                    </span>
                </div>
            </div>

            <div className="action-btns">
                <LanguageSelector />
                <TokenStats />

                <button className="nav-icon-btn" onClick={onOpenManage} title={t("nav.manage")}>
                    📚
                </button>
                <button className="nav-icon-btn" onClick={onOpenSettings} title={t("nav.settings")}>
                    ⚙
                </button>
            </div>
        </nav >
    );
}
