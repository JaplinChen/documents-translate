# Implementation Plan - Font Settings Fixes

## 1. Goal Description
Fix reported issues in the Font Settings UI:
1.  **Language Inconsistency**: Ensure all sidebar items and headers are localized correctly (likely fixing mixed English/Chinese).
2.  **Edit Capability**: Allow users to modify existing font mapping rules directly, rather than deleting and re-adding.

## 2. User Review Required
> [!IMPORTANT]
> I will assume the user wants **Traditional Chinese (zh-TW)** for all UI elements, as the interface is predominantly Chinese.

## 3. Proposed Changes

### Frontend Components

#### [MODIFY] [FontSettings.jsx](file:///d:/Works/PPTX-translate/frontend/src/components/settings/FontSettings.jsx)
- Add state `editingLang` to track which rule is being edited.
- When an item is selected for editing:
    - Populate the input fields with its values.
    - Change "Add" button to "Update" (or "Save").
    - Disable the language input (key) or allow changing (effectively delete + add).
- Add an "Edit" (✎) button to the table rows.

#### [MODIFY] [zh-TW.json](file:///d:/Works/PPTX-translate/frontend/src/locales/zh-TW.json)
- Check and ensure `settings.tabs` keys match what is displayed.
- The user sees "AI Control" but json has "AI 智控". This suggests the app might be falling back to English or there's an `en.json` that is active?
- I will inspect `i18n` setup, but primarily I will make sure `zh-TW` is consistent.

#### [MODIFY] [SettingsModal.jsx](file:///d:/Works/PPTX-translate/frontend/src/components/SettingsModal.jsx)
- Verify `t()` calls are correct.

## 4. Verification Plan

### Manual Verification
1.  **Language Check**: Open Settings > Fonts. Verify Sidebar says "AI 智控", "LLM", "字體".
2.  **Edit Flow**:
    - Add a rule `fr` -> `Arial`.
    - Click "Edit" on `fr`.
    - Change font to `Helvetica`.
    - Click "Update".
    - Verify list shows `fr` -> `Helvetica`.
