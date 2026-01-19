import fs from "fs";
import path from "path";

/**
 * Apply no-prompts settings to Playwright page/context.
 * @param {import('playwright').BrowserContext} context
 * @param {import('playwright').Page} page
 * @param {{ origin?: string }} opts
 */
export async function applyNoPrompts(context, page, opts = {}) {
  const root = process.cwd();
  const cfgPath = path.join(root, ".antigravity", "no-prompts.json");
  const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));

  // 1) JS dialogs: auto accept/dismiss based on rules
  page.on("dialog", async (d) => {
    const msg = (d.message() || "").toString();
    const matched = (cfg.dialogs || []).find(rule => (rule.match || "") === "" || msg.includes(rule.match));
    if (!matched) {
      // default accept
      await d.accept();
      return;
    }
    const action = (matched.action || "accept").toLowerCase();
    if (action === "dismiss" || action === "cancel" || action === "no") {
      await d.dismiss();
    } else {
      await d.accept();
    }
  });

  // 2) Browser permissions: pre-grant (if origin provided)
  const origin = (opts.origin || process.env.ANTIGRAVITY_ORIGIN || "").trim();
  if (origin && Array.isArray(cfg.permissions) && cfg.permissions.length) {
    await context.grantPermissions(cfg.permissions, { origin });
  }
}
