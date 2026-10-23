import React from "react";
import { Check } from "lucide-react";
import { focusRing } from "../../pages/dashboard/ui";
import { LiveOrb } from "../LiveOrb";
import { orbPropsFor } from "../../utils/orbColors";
import chatIcon from "../../assets/chat1.svg";
import { ColorField, Panel, PanelBody, Row, Segmented, Switch } from "./controls";
import { ChatbotConfig, ConfigChange } from "./types";

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
      <Panel title="Launcher" description="The button visitors click to open the chat.">
        <PanelBody>
          <div role="radiogroup" aria-label="Launcher style" className="grid grid-cols-2 gap-3 sm:max-w-md">
            {([
              { value: "classic", label: "Classic", hint: "A chat bubble icon" },
              { value: "orb", label: "Kio", hint: "An orb whose eyes follow the pointer" },
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
                      ? "border-[#101723] bg-[#F3F7FC] dark:border-[#D7DFE5] dark:bg-[#141D2B]"
                      : "border-[#D8DFE9] hover:border-[#9BAABD] dark:border-[#2B3646] dark:hover:border-[#566273]"
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
                  <span className="mt-3 text-body-sm font-medium text-[#101723] dark:text-[#D7DFE5]">{option.label}</span>
                  <span className="mt-0.5 text-caption text-[#647184] dark:text-[#87909D]">{option.hint}</span>
                </button>
              );
            })}
          </div>
        </PanelBody>
        <Row
          label="Greeting bubble"
          hint="A short “Hi! 👋 Need a hand?” beside the launcher a few seconds after someone arrives. Shown once per visitor."
        >
          <Switch
            checked={config.greetingBubble === true}
            onChange={(v) => onChange("greetingBubble", v)}
            label="Greeting bubble"
          />
        </Row>
      </Panel>

      <Panel
        title="Colors"
        description="Match the chat to your brand."
        action={
          <Segmented
            label="Color style"
            value={mode}
            onChange={switchMode}
            options={[
              { value: "solid", label: "Solid" },
              { value: "gradient", label: "Gradient" },
            ]}
          />
        }
      >
        <PanelBody className="space-y-5">
          {gradient ? (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <ColorField label="Start" color={gradient.start} onChange={(c) => setGradient({ start: c })} />
                <ColorField label="End" color={gradient.end} onChange={(c) => setGradient({ end: c })} />
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="gradient-angle" className="text-label text-[#101723] dark:text-[#D7DFE5]">
                    Angle
                  </label>
                  <span className="font-mono text-caption tabular-nums text-[#566273] dark:text-[#9BAABD]">
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
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[#D8DFE9] accent-[#101723] dark:bg-[#39485B] dark:accent-[#D7DFE5]"
                />
              </div>
              <div
                className="h-12 rounded-lg ring-1 ring-inset ring-black/10 dark:ring-white/10"
                style={{ background: config.primaryColor }}
              />
              <p className="text-caption text-[#647184] dark:text-[#87909D]">
                Used for the header, the launcher and your visitors’ messages.
              </p>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <ColorField
                  label="Primary"
                  hint="The header and the launcher."
                  color={config.primaryColor}
                  onChange={(c) => onChange("primaryColor", c)}
                />
                <ColorField
                  label="Secondary"
                  hint="Your visitors’ messages and the send button."
                  color={config.secondaryColor}
                  onChange={(c) => onChange("secondaryColor", c)}
                />
              </div>
              <div>
                <p className="mb-2 text-label text-[#101723] dark:text-[#D7DFE5]">Presets</p>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((color) => {
                    const active =
                      config.primaryColor.toLowerCase() === color.toLowerCase() &&
                      config.secondaryColor.toLowerCase() === color.toLowerCase();
                    return (
                      <button
                        key={color}
                        type="button"
                        aria-label={`Use ${color} for both colors`}
                        aria-pressed={active}
                        onClick={() => setColors(color, color)}
                        className={`flex h-8 w-8 items-center justify-center rounded-full ring-1 ring-inset ring-black/10 transition-transform hover:scale-110 dark:ring-white/10 ${focusRing} ${
                          active ? "ring-2 ring-offset-2 ring-offset-[#F9FCFF] !ring-[#101723] dark:ring-offset-[#1A2533] dark:!ring-[#D7DFE5]" : ""
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
