import React from "react";

function AiTab({
    llmTone, setLlmTone,
    useVisionContext, setUseVisionContext,
    useSmartLayout, setUseSmartLayout,
    onExtractGlossary,
    busy,
    status
}) {
    return (
        <div className="tab-pane">
            <div className="settings-section">
                <h4 className="section-title">翻譯風格與語氣 (Tone)</h4>
                <div className="form-group">
                    <label className="field-label">目標語氣調性</label>
                    <select
                        className="select-input"
                        value={llmTone}
                        onChange={(e) => setLlmTone(e.target.value)}
                    >
                        <option value="professional">專業商務 (預設)</option>
                        <option value="concise">極簡明瞭</option>
                        <option value="pm">產品經理 (PM) 視角</option>
                        <option value="humorous">風趣幽默</option>
                        <option value="creative">富有創意</option>
                        <option value="academic">學術嚴謹</option>
                    </select>
                    <p className="field-hint">這會顯著改變 AI 翻譯時的用詞偏好與句子長度。</p>
                </div>
            </div>

            <div className="settings-section">
                <h4 className="section-title">AI 多多維增強功能</h4>
                <div className="toggle-list">
                    <label className="toggle-check">
                        <input
                            type="checkbox"
                            checked={useVisionContext}
                            onChange={(e) => setUseVisionContext(e.target.checked)}
                        />
                        <span>視覺情境輔助 (Vision Context)</span>
                    </label>
                    <p className="field-hint pl-6 mb-4">當模型支援時，自動分析簡報圖片與版面資訊以提供更精準的翻譯。</p>

                    <label className="toggle-check">
                        <input
                            type="checkbox"
                            checked={useSmartLayout}
                            onChange={(e) => setUseSmartLayout(e.target.checked)}
                        />
                        <span>智慧排版調整 (Layout Adjust)</span>
                    </label>
                    <p className="field-hint pl-6">偵測字數溢出時，自動產出字體縮小或換行建議。</p>
                </div>
            </div>

            <div className="settings-section">
                <h4 className="section-title">數據預處理</h4>
                <div className="flex items-center gap-4">
                    <button
                        className={`btn ${status.includes("術語") ? "success" : "primary"}`}
                        type="button"
                        onClick={onExtractGlossary}
                        disabled={busy}
                    >
                        {status.includes("術語") ? "✓ 已提取關鍵術語" : "智慧提取核心術語庫"}
                    </button>
                    <span className="text-xs text-slate-400">
                        預先分析簡報內容，鎖定專業名詞以確保翻譯前後一致。
                    </span>
                </div>
            </div>
        </div>
    );
}

export default AiTab;
