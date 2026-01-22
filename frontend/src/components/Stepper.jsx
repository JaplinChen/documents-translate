import React from "react";
import { useTranslation } from "react-i18next";

import { APP_STATUS } from "../constants";

export function Stepper({ file, blockCount, selectedCount, status, appStatus }) {
    const { t } = useTranslation();
    const isFileSelected = !!file;
    const isExtracted = blockCount > 0;

    // Determine current step (1-4) based on explicit appStatus
    let currentStep = 1;

    if (appStatus === APP_STATUS.EXPORT_COMPLETED) {
        currentStep = 4;
    } else if (
        appStatus === APP_STATUS.TRANSLATING ||
        appStatus === APP_STATUS.TRANSLATION_COMPLETED ||
        appStatus === APP_STATUS.EXPORTING
    ) {
        currentStep = 3;
    } else if (isExtracted) {
        currentStep = 2;
    } else if (isFileSelected) {
        currentStep = 1;
    }

    const isFinished = currentStep === 4;

    const steps = [
        { id: 1, label: t("nav.step1"), active: isFileSelected },
        { id: 2, label: t("nav.step2"), active: isExtracted },
        { id: 3, label: t("nav.step3"), active: currentStep >= 3 },
        { id: 4, label: t("nav.step4"), active: isFinished }
    ];

    return (
        <div className="global-stepper-container is-compact sidebar-stepper">
            <div className="premium-stepper">
                {steps.map((step, index) => (
                    <React.Fragment key={step.id}>
                        <div className={`stepper-node ${step.active ? "is-done" : ""} ${currentStep === step.id ? "is-current" : ""}`}>
                            <div className="node-wrapper">
                                <div className="node-dot">
                                    {step.id}
                                    {currentStep === step.id && <div className="node-pulse"></div>}
                                </div>
                                {/* Label removed based on "Indicator text to numbers" + compact layout assumption for sidebar? 
                                    Actually user said "Indicator text changed to numbers". 
                                    If I keep labels it might be too wide for sidebar. 
                                    But sidebar usually has width. 
                                    Let's keep labels but make them small if needed.
                                    Or maybe the user implies the NUMBER is the only text.
                                    Let's check the current Sidebar "1 Upload".
                                    If I put this stepper in sidebar, it duplicates the list below.
                                    But requested. I will keep labels for clarity but maybe hide description.
                                */}
                            </div>
                        </div>
                        {index < steps.length - 1 && (
                            <div className={`stepper-connector ${steps[index + 1].active ? "is-active" : ""}`}>
                                <div className="connector-bar"></div>
                            </div>
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
}
