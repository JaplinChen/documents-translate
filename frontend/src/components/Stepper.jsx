import React from "react";

export function Stepper({ file, blockCount, selectedCount, status }) {
    const isFileSelected = !!file;
    const isExtracted = blockCount > 0;
    const isSelected = selectedCount > 0;
    const isFinished = status.includes("輸出") || status.includes("完成");

    // Determine current step (1-4)
    let currentStep = 1;
    if (isFinished) currentStep = 4;
    else if (status.includes("設定") || isSelected) currentStep = 3; // Selected means ready to configure or already configured
    else if (isExtracted) currentStep = 2;
    else if (isFileSelected) currentStep = 1;

    const steps = [
        { id: 1, label: "上傳", desc: "Upload PPTX", active: isFileSelected },
        { id: 2, label: "解析", desc: "Extract & Glossary", active: isExtracted },
        { id: 3, label: "設定", desc: "Configure AI", active: isExtracted }, // Step 3 is available once extracted
        { id: 4, label: "執行", desc: "Translate & Export", active: isFinished }
    ];

    return (
        <div className="global-stepper-container is-compact">
            <div className="premium-stepper">
                {steps.map((step, index) => (
                    <React.Fragment key={step.id}>
                        <div className={`stepper-node ${step.active ? "is-done" : ""} ${currentStep === step.id ? "is-current" : ""}`}>
                            <div className="node-wrapper">
                                <div className="node-dot">
                                    {step.active && step.id < currentStep ? "✓" : step.id}
                                    <div className="node-pulse"></div>
                                </div>
                                <div className="node-content">
                                    <span className="node-label">{step.label}</span>
                                    <span className="node-desc">{step.desc}</span>
                                </div>
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
