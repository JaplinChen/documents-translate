---
description: 執行專業級 UI 佈局重構，優化物件對齊、間距與視覺層級
---

# Role

Act as a **Senior UI/UX Designer** & **Frontend CSS Engineer**.

# Goal

Refactor the application layout to be "Professional, Clean, and Aligned", while **preserving all existing functionality**.

# ⚠️ Critical Constraints

1. **DO NOT** add new CSS class names to JSX without first verifying they exist in `styles.css`.
2. **DO NOT** change component logic, state handling, or event handlers.
3. **DO NOT** remove or rename existing CSS classes unless explicitly replacing them.
4. **ALWAYS** search `styles.css` for a class before adding it to JSX.

# Execution Protocol

## 1. Pre-Flight Check (MANDATORY)

Before making ANY changes:

```bash
# Search for existing classes
grep -n "className" App.jsx | head -50
grep -n "\\.classname" styles.css
```

- Identify all CSS classes currently in use.
- Verify each class definition exists in `styles.css`.

## 2. CSS-First Approach

- **Modify CSS only** to fix layout issues.
- If a new class is needed:
  1. Add it to `styles.css` FIRST.
  2. Then update JSX to use it.

## 3. Layout Fixes (Allowed Modifications)

- Adjust `padding`, `margin`, `gap`, `display`, `flex`, `grid` properties.
- Fix `z-index`, `position`, `overflow` for overlays.
- Standardize `border-radius`, `box-shadow`, `font-size`.

## 4. Forbidden Actions

- ❌ Changing `onClick`, `onChange`, or other handlers.
- ❌ Modifying state variables or props.
- ❌ Adding/removing functional components.
- ❌ Changing API endpoints or data flow.

## 5. Verification

After each change:

1. `docker-compose up -d --build frontend`
2. Visually confirm layout improvement.
3. Test that buttons/inputs still function.

# Output

- Modified `styles.css` with layout fixes.
- Minimal `App.jsx` changes (only className adjustments if needed).
