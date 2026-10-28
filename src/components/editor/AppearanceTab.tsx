import React from "react";
import { Check, Plus, Trash2 } from "../icons";
import { focusRing } from "../../pages/dashboard/ui";
import { LiveOrb } from "../LiveOrb";
import { orbPropsFor } from "../../utils/orbColors";
import chatIcon from "../../assets/chat1.svg";
import { ColorField, Panel, PanelBody, Row, Segmented, Switch, inputClass } from "./controls";
import { ChatbotConfig, ConfigChange } from "./types";
import type { PageGreeting } from "../../utils/pageGreetings";
import { isLang, makeT, useT } from "../../i18n";
import { widgetMessages } from "../../i18n/widget";
import { editorMessages } from "../../i18n/messages/editor";

const PRESETS = [
  "#101723",
  "#566273",
  "#3B82F6",
  "#0891B2",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#EC4899",
  "#8B5CF6",
  "#818CF8",
];

const GRADIENT = /^linear-gradient\(\s*(-?\d+(?:\.\d+)?)deg\s*,\s*(#[0-9a-f]{3,8})\s*,\s*(#[0-9a-f]{3,8})\s*\)$/i;

function parseGradient(value: string) {
  const m = GRADIENT.exec(value.trim());
  return m ? { angle: Math.round(Number(m[1])), start: m[2], end: m[3] } : null;
}

const gradientOf = (angle: number, start: string, end: string) => `linear-gradient(${angle}deg, ${start}, ${end})`;

/** The colour a third of the way to white, for a second gradient stop. */
function lighten(hex: string) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return "#818CF8";
  const n = parseInt(m[1], 16);
  const mix = (c: number) => Math.round(c + (255 - c) * 0.35);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(mix);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

interface Props {
  config: ChatbotConfig;
  onChange: ConfigChange;
}

const AppearanceTab: React.FC<Props> = ({ config, onChange }) => {
  const t = useT(editorMessages);
  // The greeting is shown in the widget's language.
  const greeting = makeT(widgetMessages, isLang(config.language) ? config.language : "en")("greeting");
  const gradient = parseGradient(config.primaryColor);
  const mode = gradient ? "gradient" : "solid";
  const launcher = config.launcherStyle ?? "classic";

  const setColors = (primary: string, secondary: string) => {
    onChange("primaryColor", primary);
    onChange("secondaryColor", secondary);
  };

  const setGradient = (next: Partial<{ angle: number; start: string; end: string }>) => {
    const g = { angle: 135, start: "#101723", end: "#566273", ...gradient, ...next };
    const value = gradientOf(g.angle, g.start, g.end);
    setColors(value, value);
  };

  const switchMode = (next: "solid" | "gradient") => {
    if (next === mode) return;
    if (next === "gradient") {
      const start = config.primaryColor;
      const end = config.secondaryColor && config.secondaryColor !== start ? config.secondaryColor : lighten(start);
      const value = gradientOf(135, start, end);
      setColors(value, value);
    } else if (gradient) {
      setColors(gradient.start, gradient.end);
    }
  };

  return (
    <div className="space-y-5">
      <Panel title={t("launcher")} description={t("launcherDesc")}>
        <PanelBody>
          <div role="radiogroup" aria-label={t("launcherAria")} className="grid grid-cols-2 gap-3 sm:max-w-md">
            {([
              { value: "classic", label: t("classic"), hint: t("classicHint") },
              { value: "orb", label: "Kio", hint: t("kioHint") },
            ] as const).map((option) => {
              const selected = launcher === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onChange("launcherStyle", option.value)}
                  className={`flex flex-col items-center rounded-xl border px-3 pb-3 pt-4 text-center transition-colors ${focusRing} ${
                    selected
                      ? "border-ink-900 bg-ink-30 dark:border-ink-130 dark:bg-ink-875"
                      : "border-ink-120 hover:border-ink-325 dark:border-ink-780 dark:hover:border-ink-605"
                  }`}
                >
                  <span className="flex h-14 items-center justify-center">
                    {option.value === "orb" ? (
                      <LiveOrb size={48} {...orbPropsFor(config.primaryColor)} />
                    ) : (
                      <span
                        className="flex h-12 w-12 items-center justify-center rounded-full shadow-md"
                        style={{
                          background: gradient
                            ? config.primaryColor
                            : `linear-gradient(145deg, ${config.primaryColor}, ${config.primaryColor}cc)`,
                        }}
                      >
                        <img src={chatIcon} alt="" className="h-6 w-6" />
                      </span>
                    )}
                  </span>
                  <span className="mt-3 text-body-sm font-medium text-fg">{option.label}</span>
                  <span className="mt-0.5 text-caption text-fg-subtle">{option.hint}</span>
                </button>
              );
            })}
          </div>
        </PanelBody>
        <Row
          label={t("greetingBubble")}
          hint={t("greetingBubbleHint", { greeting })}
        >
          <Switch
            checked={config.greetingBubble === true}
            onChange={(v) => onChange("greetingBubble", v)}
            label={t("greetingBubble")}
          />
        </Row>
      </Panel>

      <Panel title={t("pageGreetings")} description={t("pageGreetingsDesc")}>
        <PanelBody className="space-y-3">
          {(config.pageGreetings || []).map((rule, i) => {
            const update = (patch: Partial<PageGreeting>) =>
              onChange(
                "pageGreetings",
                (config.pageGreetings || []).map((r, j) => (j === i ? { ...r, ...patch } : r))
              );
            return (
              <div key={i} className="flex items-end gap-2">
                <label className="block w-[38%] shrink-0">
                  <span className="text-caption font-medium text-fg-muted">{t("pageMatch")}</span>
                  <input
                    className={`${inputClass} mt-1 h-10`}
                    placeholder={t("pageMatchPlaceholder")}
                    maxLength={100}
                    spellCheck={false}
                    value={rule.match}
                    onChange={(e) => update({ match: e.target.value })}
                  />
                </label>
                <label className="block min-w-0 flex-1">
                  <span className="text-caption font-medium text-fg-muted">{t("pageMessage")}</span>
                  <input
                    className={`${inputClass} mt-1 h-10`}
                    placeholder={t("pageMessagePlaceholder")}
                    maxLength={50}
                    value={rule.message}
                    onChange={(e) => update({ message: e.target.value })}
                  />
                </label>
                <button
                  type="button"
                  aria-label={t("removePageGreeting")}
                  title={t("removePageGreeting")}
                  onClick={() => onChange("pageGreetings", (config.pageGreetings || []).filter((_, j) => j !== i))}
                  className={`mb-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-425 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 ${focusRing}`}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })}
          {(config.pageGreetings || []).length < 10 && (
            <button
              type="button"
              onClick={() => onChange("pageGreetings", [...(config.pageGreetings || []), { match: "", message: "" }])}
              className={`inline-flex items-center gap-1.5 rounded-md text-body-sm font-medium text-ink-900 hover:underline dark:text-ink-130 ${focusRing}`}
            >
              <Plus size={14} />
              {t("addPageGreeting")}
            </button>
          )}
        </PanelBody>
      </Panel>

      <Panel
        title={t("colors")}
        description={t("colorsDesc")}
        action={
          <Segmented
            label={t("colorStyle")}
            value={mode}
            onChange={switchMode}
            options={[
              { value: "solid", label: t("solid") },
              { value: "gradient", label: t("gradient") },
            ]}
          />
        }
      >
        <PanelBody className="space-y-5">
          {gradient ? (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <ColorField label={t("start")} color={gradient.start} onChange={(c) => setGradient({ start: c })} />
                <ColorField label={t("end")} color={gradient.end} onChange={(c) => setGradient({ end: c })} />
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="gradient-angle" className="text-label text-fg">
                    {t("angle")}
                  </label>
                  <span className="font-mono text-caption tabular-nums text-fg-muted">
                    {gradient.angle}°
                  </span>
                </div>
                <input
                  id="gradient-angle"
                  type="range"
                  min={0}
                  max={360}
                  step={5}
                  value={gradient.angle}
                  onChange={(e) => setGradient({ angle: Number(e.target.value) })}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-ink-120 accent-ink-900 dark:bg-ink-710 dark:accent-ink-130"
                />
              </div>
              <div
                className="h-12 rounded-lg ring-1 ring-inset ring-black/10 dark:ring-white/10"
                style={{ background: config.primaryColor }}
              />
              <p className="text-caption text-fg-subtle">
                {t("gradientHint")}
              </p>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <ColorField
                  label={t("primary")}
                  hint={t("primaryHint")}
                  color={config.primaryColor}
                  onChange={(c) => onChange("primaryColor", c)}
                />
                <ColorField
                  label={t("secondary")}
                  hint={t("secondaryHint")}
                  color={config.secondaryColor}
                  onChange={(c) => onChange("secondaryColor", c)}
                />
              </div>
              <div>
                <p className="mb-2 text-label text-fg">{t("presets")}</p>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((color) => {
                    const active =
                      config.primaryColor.toLowerCase() === color.toLowerCase() &&
                      config.secondaryColor.toLowerCase() === color.toLowerCase();
                    return (
                      <button
                        key={color}
                        type="button"
                        aria-label={t("usePreset", { color })}
                        aria-pressed={active}
                        onClick={() => setColors(color, color)}
                        className={`flex h-8 w-8 items-center justify-center rounded-full ring-1 ring-inset ring-black/10 transition-transform hover:scale-110 dark:ring-white/10 ${focusRing} ${
                          active ? "ring-2 ring-offset-2 ring-offset-ink-25 !ring-ink-900 dark:ring-offset-ink-850 dark:!ring-ink-130" : ""
                        }`}
                        style={{ backgroundColor: color }}
                      >
                        {active && <Check size={14} strokeWidth={3} className="text-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </PanelBody>
      </Panel>
    </div>
  );
};

export default AppearanceTab;
