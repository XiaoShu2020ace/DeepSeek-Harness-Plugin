window.__ModuleLoader__.load({
  id: 'dsh-quota-guard',
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;

    const dshQuotaGuardCss = "/* src/client/styles.module.css */\n.qg_anchor_6a9206 {\n  position: relative;\n  z-index: 0;\n  display: inline-flex;\n  align-items: center;\n}\n.qg_anchor_6a9206:has(.qg_popoverLayer_c5a1b1) {\n  z-index: 10000;\n}\n.qg_trigger_87e286 {\n  width: 34px;\n  height: 34px;\n  padding: 5px;\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  color: #444;\n  background: transparent;\n  border: 0;\n  border-radius: 8px;\n  cursor: pointer;\n}\n.qg_trigger_87e286:hover,\n.qg_trigger_87e286:focus-visible {\n  background: #f2f2f2;\n  outline: none;\n}\n.qg_ring_71b2af {\n  display: block;\n  overflow: visible;\n}\n.qg_tooltip_a377e3 {\n  position: absolute;\n  top: calc(100% + 7px);\n  right: 0;\n  z-index: 3;\n  width: 258px;\n  padding: 10px 12px;\n  color: #f9fafb;\n  background: #202124;\n  border: 1px solid rgb(255 255 255 / 8%);\n  border-radius: 9px;\n  box-shadow: 0 8px 28px rgb(0 0 0 / 22%);\n  font-size: 12px;\n  line-height: 1.5;\n  pointer-events: none;\n}\n.qg_tooltipTitle_4d7056 {\n  margin-bottom: 6px;\n  color: #fff;\n  font-weight: 650;\n}\n.qg_tooltipRow_cea20d {\n  display: flex;\n  justify-content: space-between;\n  gap: 8px;\n  color: #fff;\n}\n.qg_tooltipRow_cea20d > :last-child {\n  text-align: right;\n}\n.qg_tooltipMeta_0e875a {\n  margin: 2px 0 7px;\n  color: #b7bcc5;\n}\n.qg_popoverLayer_c5a1b1 {\n  position: absolute;\n  inset: 0;\n  z-index: 2;\n}\n.qg_backdrop_54d5ca {\n  position: fixed;\n  inset: 0;\n  z-index: 0;\n  width: 100vw;\n  height: 100vh;\n  padding: 0;\n  background: transparent;\n  border: 0;\n  cursor: default;\n}\n.qg_panel_11d950 {\n  position: absolute;\n  top: calc(100% + 8px);\n  right: 0;\n  z-index: 1;\n  box-sizing: border-box;\n  width: min(344px, calc(100vw - 24px));\n  padding: 16px;\n  color: #171717;\n  background: #fff;\n  border: 1px solid #e8e8e8;\n  border-radius: 14px;\n  box-shadow: 0 14px 40px rgb(0 0 0 / 16%);\n  font-family: inherit;\n  font-size: 13px;\n  line-height: 1.45;\n}\n.qg_balanceRow_6849df {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  margin-bottom: 16px;\n  padding-bottom: 12px;\n  border-bottom: 1px solid #efefef;\n  color: #555;\n}\n.qg_balanceRow_6849df strong {\n  color: #111;\n  font-size: 15px;\n  font-variant-numeric: tabular-nums;\n}\n.qg_sectionLabel_9ed19a,\n.qg_field_4a53f8 > span:first-child {\n  color: #333;\n  font-weight: 600;\n}\n.qg_segmented_f49aa4 {\n  display: grid;\n  grid-template-columns: 1fr 1fr;\n  gap: 3px;\n  margin: 7px 0 15px;\n  padding: 3px;\n  background: #f3f3f3;\n  border-radius: 9px;\n}\n.qg_segment_79e573,\n.qg_segmentActive_918760 {\n  min-height: 32px;\n  color: #666;\n  background: transparent;\n  border: 0;\n  border-radius: 7px;\n  cursor: pointer;\n  font: inherit;\n}\n.qg_segmentActive_918760 {\n  color: #111;\n  background: #fff;\n  box-shadow: 0 1px 3px rgb(0 0 0 / 10%);\n  font-weight: 650;\n}\n.qg_field_4a53f8 {\n  display: flex;\n  flex-direction: column;\n  gap: 7px;\n  margin: 0 0 14px;\n}\n.qg_inputWrap_f19f70 {\n  box-sizing: border-box;\n  display: flex;\n  align-items: center;\n  gap: 5px;\n  height: 36px;\n  padding: 0 10px;\n  color: #777;\n  border: 1px solid #ddd;\n  border-radius: 8px;\n}\n.qg_inputWrap_f19f70:focus-within {\n  border-color: #777;\n}\n.qg_inputWrap_f19f70 input {\n  width: 100%;\n  color: #111;\n  background: transparent;\n  border: 0;\n  outline: none;\n  font: inherit;\n  font-variant-numeric: tabular-nums;\n}\n.qg_range_de2fa8 {\n  width: 100%;\n  margin: 4px 0 0;\n  accent-color: #171717;\n}\n.qg_rangeLabels_79a92a {\n  display: flex;\n  justify-content: space-between;\n  color: #888;\n  font-size: 11px;\n}\n.qg_warning_e3d9a3 {\n  margin: 0 0 12px;\n  padding: 9px 10px;\n  color: #9f1d1d;\n  background: #fee2e2;\n  border-radius: 8px;\n  font-size: 12px;\n}\n.qg_preview_f22404 {\n  display: flex;\n  flex-direction: column;\n  gap: 4px;\n  margin: 2px 0 14px;\n  padding: 10px;\n  color: #666;\n  background: #f7f7f7;\n  border-radius: 8px;\n  font-size: 11px;\n}\n.qg_preview_f22404 strong {\n  color: #222;\n  font-size: 12px;\n  font-weight: 600;\n  line-height: 1.55;\n}\n.qg_preview_f22404 small {\n  color: #888;\n  font-size: 10px;\n}\n.qg_error_24e2fc {\n  margin-bottom: 12px;\n  padding: 8px 10px;\n  color: #a21d1d;\n  background: #fff1f1;\n  border-radius: 7px;\n  font-size: 12px;\n}\n.qg_actions_fbb352,\n.qg_actionGroup_a619d4 {\n  display: flex;\n  align-items: center;\n}\n.qg_actions_fbb352 {\n  justify-content: space-between;\n  gap: 8px;\n  padding-top: 11px;\n  border-top: 1px solid #efefef;\n}\n.qg_actionGroup_a619d4 {\n  gap: 7px;\n}\n.qg_reset_658461,\n.qg_cancel_67e277,\n.qg_save_53aa33 {\n  min-height: 32px;\n  padding: 0 10px;\n  border: 0;\n  border-radius: 7px;\n  cursor: pointer;\n  font: inherit;\n  font-size: 12px;\n}\n.qg_reset_658461 {\n  padding-left: 0;\n  color: #d12f2f;\n  background: transparent;\n}\n.qg_cancel_67e277 {\n  color: #555;\n  background: transparent;\n}\n.qg_save_53aa33 {\n  color: #fff;\n  background: #111;\n}\n.qg_reset_658461:disabled,\n.qg_cancel_67e277:disabled,\n.qg_save_53aa33:disabled {\n  opacity: 0.5;\n  cursor: wait;\n}\n";
    const dshQuotaGuardCssId = "dsh-quota-guard/styles.module.css";
    if (typeof document !== 'undefined' && document.querySelector('style[data-plugin-css=' + JSON.stringify(dshQuotaGuardCssId) + ']') === null) {
      const tag = document.createElement('style');
      tag.dataset.plugin = 'dsh-quota-guard';
      tag.dataset.pluginCss = dshQuotaGuardCssId;
      tag.textContent = dshQuotaGuardCss;
      document.head.appendChild(tag);
    }

"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.tsx
var client_exports = {};
__export(client_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(client_exports);

// src/client/TopBarIcon.tsx
var import_react2 = require("react");

// src/shared.ts
var QUOTA_API = {
  state: "/api/dsh-quota-guard/state",
  config: "/api/dsh-quota-guard/config",
  reset: "/api/dsh-quota-guard/reset"
};
var WEEK_MS = 7 * 24 * 60 * 60 * 1e3;
var MONTH_MS = 30 * 24 * 60 * 60 * 1e3;
var WEEK_SMALL_REFERENCE_HOURS = 70;
function smallLimitFor(config) {
  return config.mode === "week" ? config.bigLimitCny * config.smallWindowHours / WEEK_SMALL_REFERENCE_HOURS : config.smallLimitCny;
}

// src/client/SettingsPopover.tsx
var import_react = require("react");

// src/client/styles.module.css
var styles_default = {"anchor":"qg_anchor_6a9206","popoverLayer":"qg_popoverLayer_c5a1b1","trigger":"qg_trigger_87e286","ring":"qg_ring_71b2af","tooltip":"qg_tooltip_a377e3","tooltipTitle":"qg_tooltipTitle_4d7056","tooltipRow":"qg_tooltipRow_cea20d","tooltipMeta":"qg_tooltipMeta_0e875a","backdrop":"qg_backdrop_54d5ca","panel":"qg_panel_11d950","balanceRow":"qg_balanceRow_6849df","sectionLabel":"qg_sectionLabel_9ed19a","field":"qg_field_4a53f8","segmented":"qg_segmented_f49aa4","segment":"qg_segment_79e573","segmentActive":"qg_segmentActive_918760","inputWrap":"qg_inputWrap_f19f70","range":"qg_range_de2fa8","rangeLabels":"qg_rangeLabels_79a92a","warning":"qg_warning_e3d9a3","preview":"qg_preview_f22404","error":"qg_error_24e2fc","actions":"qg_actions_fbb352","actionGroup":"qg_actionGroup_a619d4","reset":"qg_reset_658461","cancel":"qg_cancel_67e277","save":"qg_save_53aa33"};

// src/client/SettingsPopover.tsx
var import_jsx_runtime = require("react/jsx-runtime");
function money(value) {
  return `\xA5${value.toFixed(2)}`;
}
function SettingsPopover({ snapshot, onSnapshot, onClose }) {
  const [draft, setDraft] = (0, import_react.useState)({ ...snapshot.config });
  const [saving, setSaving] = (0, import_react.useState)(false);
  const [resetting, setResetting] = (0, import_react.useState)(false);
  const [error, setError] = (0, import_react.useState)(null);
  const isWeek = draft.mode === "week";
  const smallAmount = (0, import_react.useMemo)(() => smallLimitFor(draft), [draft]);
  const setNumber = (key, value) => {
    const number = Number(value);
    if (!Number.isFinite(number)) return;
    setDraft((current) => ({ ...current, [key]: number }));
  };
  const save = async () => {
    if (draft.bigLimitCny <= 0 || isWeek && (draft.smallWindowHours < 1 || draft.smallWindowHours > 24) || !isWeek && draft.smallLimitCny <= 0) {
      setError("\u8BF7\u68C0\u67E5\u989D\u5EA6\u91D1\u989D\u548C\u5C0F\u65F6\u8303\u56F4\u3002");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(QUOTA_API.config, {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(draft)
      });
      const body = await response.json();
      if (!response.ok) throw new Error("error" in body ? body.error ?? "\u4FDD\u5B58\u5931\u8D25" : "\u4FDD\u5B58\u5931\u8D25");
      onSnapshot(body);
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "\u4FDD\u5B58\u5931\u8D25");
    } finally {
      setSaving(false);
    }
  };
  const reset = async () => {
    if (!window.confirm("\u786E\u5B9A\u6E05\u7A7A\u5F53\u524D\u5DF2\u8BB0\u5F55\u7684\u4F7F\u7528\u989D\u5EA6\u5417\uFF1F")) return;
    setResetting(true);
    setError(null);
    try {
      const response = await fetch(QUOTA_API.reset, {
        method: "POST",
        credentials: "same-origin"
      });
      const body = await response.json();
      if (!response.ok) throw new Error("error" in body ? body.error ?? "\u91CD\u7F6E\u5931\u8D25" : "\u91CD\u7F6E\u5931\u8D25");
      onSnapshot(body);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "\u91CD\u7F6E\u5931\u8D25");
    } finally {
      setResetting(false);
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: styles_default.popoverLayer, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: styles_default.backdrop, type: "button", "aria-label": "\u5173\u95ED\u989D\u5EA6\u8BBE\u7F6E", onClick: onClose }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { className: styles_default.panel, "aria-label": "\u989D\u5EA6\u5B88\u536B\u8BBE\u7F6E", onClick: (event) => event.stopPropagation(), children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: styles_default.balanceRow, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u5F53\u524D\u8D26\u6237\u4F59\u989D" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: money(snapshot.accountBalance) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: styles_default.sectionLabel, children: "\u989D\u5EA6\u6A21\u5F0F" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: styles_default.segmented, role: "group", "aria-label": "\u989D\u5EA6\u6A21\u5F0F", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { type: "button", className: isWeek ? styles_default.segmentActive : styles_default.segment, onClick: () => setDraft((value) => ({ ...value, mode: "week" })), children: [
          isWeek ? "\u25CF" : "\u25CB",
          " \u5468\u989D\u5EA6"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { type: "button", className: !isWeek ? styles_default.segmentActive : styles_default.segment, onClick: () => setDraft((value) => ({ ...value, mode: "month" })), children: [
          !isWeek ? "\u25CF" : "\u25CB",
          " \u6708\u989D\u5EA6"
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: styles_default.field, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u5927\u9650\u5236\u91D1\u989D" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: styles_default.inputWrap, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\xA5" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "number", min: "0.01", step: "0.01", value: draft.bigLimitCny, onChange: (event) => setNumber("bigLimitCny", event.target.value) })
        ] })
      ] }),
      isWeek ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: styles_default.field, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
          "\u5C0F\u9650\u5236\u7A97\u53E3\uFF1A",
          draft.smallWindowHours,
          " \u5C0F\u65F6"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            className: styles_default.range,
            type: "range",
            min: "1",
            max: "24",
            step: "1",
            value: draft.smallWindowHours,
            onChange: (event) => setNumber("smallWindowHours", event.target.value)
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: styles_default.rangeLabels, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "1 \u5C0F\u65F6" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "24 \u5C0F\u65F6" })
        ] })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: styles_default.field, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u5C0F\u9650\u5236\u91D1\u989D\uFF087\u5929\uFF09" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: styles_default.inputWrap, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\xA5" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "number", min: "0.01", step: "0.01", value: draft.smallLimitCny, onChange: (event) => setNumber("smallLimitCny", event.target.value) })
        ] })
      ] }),
      draft.bigLimitCny > snapshot.accountBalance && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: styles_default.warning, role: "alert", children: "\u26A0\uFE0F \u8BBE\u5B9A\u5927\u9650\u5236\u8D85\u8FC7\u8D26\u6237\u4F59\u989D\uFF0C\u8BF7\u5145\u503C\u6216\u964D\u4F4E\u989D\u5EA6" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: styles_default.preview, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: "\u751F\u6548\u9884\u89C8" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: [
          "\u5927\u9650\u5236\uFF1A",
          isWeek ? "7\u5929" : "30\u5929",
          " (",
          money(draft.bigLimitCny),
          ") / \u5C0F\u9650\u5236\uFF1A",
          isWeek ? `${draft.smallWindowHours}\u5C0F\u65F6` : "7\u5929",
          " (",
          money(smallAmount),
          ")"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("small", { children: [
          "\u91D1\u989D\u6309 Token \u5355\u4EF7\u4F30\u7B97\uFF1A\u8F93\u5165 ",
          money(draft.inputCnyPerMillion),
          " / \u7F13\u5B58 ",
          money(draft.cachedInputCnyPerMillion),
          " / \u8F93\u51FA ",
          money(draft.outputCnyPerMillion),
          "\uFF08\u6BCF\u767E\u4E07 Token\uFF09"
        ] })
      ] }),
      error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: styles_default.error, role: "alert", children: error }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: styles_default.actions, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: styles_default.reset, disabled: resetting || saving, onClick: () => void reset(), children: resetting ? "\u91CD\u7F6E\u4E2D\u2026" : "\u91CD\u7F6E\u5DF2\u7528\u989D\u5EA6" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: styles_default.actionGroup, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: styles_default.cancel, disabled: saving, onClick: onClose, children: "\u53D6\u6D88" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: styles_default.save, disabled: saving || resetting, onClick: () => void save(), children: saving ? "\u4FDD\u5B58\u4E2D\u2026" : "\u4FDD\u5B58" })
        ] })
      ] })
    ] })
  ] });
}

// src/client/TopBarIcon.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
function money2(value) {
  return `\xA5${value.toFixed(2)}`;
}
function resetDistance(timestamp) {
  if (timestamp === null) return "\u6682\u65E0\u5F85\u91CD\u7F6E\u8BB0\u5F55";
  const left = Math.max(0, timestamp - Date.now());
  const hours = Math.floor(left / 36e5);
  const minutes = Math.floor(left % 36e5 / 6e4);
  return hours > 0 ? `${hours}\u5C0F\u65F6${minutes}\u5206\u540E\u91CD\u7F6E` : `${Math.max(1, minutes)}\u5206\u949F\u540E\u91CD\u7F6E`;
}
function ringColor(remainingPercent) {
  if (remainingPercent <= 0) return "#EF4444";
  if (remainingPercent < 20) return "#F59E0B";
  return "#666666";
}
function HalfRing({
  radius,
  remainingPercent,
  half,
  circumference
}) {
  const halfLength = circumference / 2;
  const remainingLength = halfLength * Math.max(0, Math.min(100, remainingPercent)) / 100;
  const rotation = half === "upper" ? 180 : 0;
  const transform = `rotate(${rotation} 20 20)`;
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      "circle",
      {
        cx: "20",
        cy: "20",
        r: radius,
        fill: "none",
        stroke: "#E8E8E8",
        strokeWidth: "2.5",
        strokeDasharray: `${halfLength} ${halfLength}`,
        transform
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      "circle",
      {
        cx: "20",
        cy: "20",
        r: radius,
        fill: "none",
        stroke: ringColor(remainingPercent),
        strokeWidth: "2.5",
        strokeLinecap: "round",
        strokeDasharray: `${remainingLength} ${circumference - remainingLength}`,
        transform
      }
    )
  ] });
}
function TopBarIcon() {
  const [snapshot, setSnapshot] = (0, import_react2.useState)(null);
  const [open, setOpen] = (0, import_react2.useState)(false);
  const [hovered, setHovered] = (0, import_react2.useState)(false);
  const [loadError, setLoadError] = (0, import_react2.useState)(null);
  const refresh = (0, import_react2.useCallback)(async () => {
    try {
      const response = await fetch(QUOTA_API.state, { credentials: "same-origin", cache: "no-store" });
      if (!response.ok) throw new Error(`\u989D\u5EA6\u6570\u636E\u8BFB\u53D6\u5931\u8D25 (${response.status})`);
      setSnapshot(await response.json());
      setLoadError(null);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "\u989D\u5EA6\u6570\u636E\u8BFB\u53D6\u5931\u8D25");
    }
  }, []);
  (0, import_react2.useEffect)(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 2e4);
    return () => window.clearInterval(timer);
  }, [refresh]);
  const label = snapshot ? `\u989D\u5EA6\u5269\u4F59\uFF1A\u5C0F\u9650\u5236 ${snapshot.smallPercentRemaining.toFixed(0)}%\uFF0C\u5927\u9650\u5236 ${snapshot.bigPercentRemaining.toFixed(0)}%` : "\u989D\u5EA6\u5B88\u536B";
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: styles_default.anchor, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      "button",
      {
        type: "button",
        className: styles_default.trigger,
        "aria-label": label,
        "aria-expanded": open,
        onClick: () => setOpen((value) => !value),
        onMouseEnter: () => setHovered(true),
        onMouseLeave: () => setHovered(false),
        children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("svg", { className: styles_default.ring, width: "24", height: "24", viewBox: "0 0 40 40", "aria-hidden": "true", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(HalfRing, { radius: 16, remainingPercent: snapshot?.smallPercentRemaining ?? 100, half: "upper", circumference: 2 * Math.PI * 16 }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(HalfRing, { radius: 10, remainingPercent: snapshot?.bigPercentRemaining ?? 100, half: "lower", circumference: 2 * Math.PI * 10 })
        ] })
      }
    ),
    hovered && !open && snapshot && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: styles_default.tooltip, role: "tooltip", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: styles_default.tooltipTitle, children: "\u989D\u5EA6\u5B88\u536B" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: styles_default.tooltipRow, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "\u5C0F\u9650\u5236" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: snapshot.config.mode === "week" ? `${snapshot.config.smallWindowHours}\u5C0F\u65F6` : "7\u5929" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: styles_default.tooltipMeta, children: [
        "\u5DF2\u7528 ",
        money2(snapshot.smallUsedCny),
        " (",
        (100 - snapshot.smallPercentRemaining).toFixed(0),
        "%) \xB7 \u5269\u4F59 ",
        money2(snapshot.smallRemainingCny),
        " (",
        snapshot.smallPercentRemaining.toFixed(0),
        "%)",
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("br", {}),
        resetDistance(snapshot.smallResetAt)
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: styles_default.tooltipRow, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "\u5927\u9650\u5236" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: snapshot.config.mode === "week" ? "7\u5929" : "30\u5929" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: styles_default.tooltipMeta, children: [
        "\u5DF2\u7528 ",
        money2(snapshot.bigUsedCny),
        " (",
        (100 - snapshot.bigPercentRemaining).toFixed(0),
        "%) \xB7 \u5269\u4F59 ",
        money2(snapshot.bigRemainingCny),
        " (",
        snapshot.bigPercentRemaining.toFixed(0),
        "%)",
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("br", {}),
        resetDistance(snapshot.bigResetAt)
      ] })
    ] }),
    hovered && !open && loadError && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: styles_default.tooltip, role: "tooltip", children: loadError }),
    open && snapshot && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      SettingsPopover,
      {
        snapshot,
        onSnapshot: (next) => setSnapshot(next),
        onClose: () => setOpen(false)
      }
    )
  ] });
}

// src/client/index.tsx
var inject = ["slots"];
function apply(ctx) {
  ctx.slots.inject("conversation.session.header.corner", () => ctx.slots.register(
    { name: "conversation.session.header.corner" },
    TopBarIcon
  ));
}

    return module.exports;
  }
});
