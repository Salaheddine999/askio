/*
 * Live Orb, adapted from https://23rd.dev/r/live-orb.json by Jay Sharma (23rd.dev).
 * MIT License. Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation files, to deal
 * in the Software without restriction, subject to including this notice. THE
 * SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 *
 * Local changes: `clsx` instead of `cn`, the default GPU instead of
 * "high-performance", the orb is decorative (aria-hidden) because it always
 * sits inside a labelled control here, pixel-width antialiased edges with
 * supersampling, lighting for depth (`depth`), and a gaze that eases with
 * distance so it tracks the pointer across the page, plus `mood` so a host
 * can make the orb look like it is thinking or listening, and `lookAt` to aim
 * the gaze at something on purpose (with a blink as it turns). `happy` and
 * `unsure` are short reactions: arched, smiling eyes, or a glance down and
 * away. On touch screens the eyes turn toward taps and the scroll direction.
 */

import { useEffect, useRef, useState } from "react"
import clsx from "clsx"

export type LiveOrbVariant = "white" | "black" | "webgl" | "custom"

export type LiveOrbTheme = "light" | "dark" | "auto"

export type LiveOrbMood = "idle" | "thinking" | "listening" | "happy" | "unsure"

export type LiveOrbOptions = {
  /**
   * Material preset. Omit it and the orb follows the theme: a white orb
   * on dark pages, a black one on light pages.
   */
  variant?: LiveOrbVariant
  /**
   * Which theme the default variant follows. `auto` (the default) reads
   * `html.dark` / `html.light`, then `data-theme`, then
   * `prefers-color-scheme`, and keeps up with changes.
   */
  theme?: LiveOrbTheme
  /** Body hex, used when `variant="custom"`. */
  color?: string
  /** Eye hex, used when `variant="custom"`. */
  eyeColor?: string
  /** Gradient stops, start to end, used when `variant="webgl"`. */
  colors?: string[]
  /**
   * Direction of the `webgl` gradient, in CSS `linear-gradient` degrees
   * (0 runs bottom to top, 90 left to right). Default 135.
   */
  angle?: number
  /**
   * Eyes follow the pointer. Default `true`. Without it, or once the pointer
   * rests for a few seconds, they glance around on their own.
   */
  interactive?: boolean
  /** Occasional blink. Default `true`. */
  blink?: boolean
  /** Light the sphere so it reads as 3D. Default `true`. */
  depth?: boolean
  /**
   * `thinking` glances up and from side to side, `listening` looks down
   * (toward an input below), `happy` arches the eyes into a smile and
   * `unsure` glances down and away, squinting one eye. All take over from
   * the pointer. Default `idle`.
   */
  mood?: LiveOrbMood
  /**
   * Holds the gaze on a point, in the same -1..1 space the pointer uses
   * (positive y is up). Overrides the pointer and `mood`; the orb blinks
   * as it turns. Pass `null` to let go.
   */
  lookAt?: { x: number; y: number } | null
  /** Fires when WebGL is ready (`true`) or torn down (`false`). */
  onHasGl?: (ok: boolean) => void
}

export type LiveOrbInstance = {
  setOptions: (options: Partial<LiveOrbOptions>) => void
  destroy: () => void
}

export const WHITE = { color: "#F4F4F5", eyeColor: "#09090B" } as const
export const BLACK = { color: "#18181B", eyeColor: "#F4F4F5" } as const
export const CUSTOM_DEFAULT = { color: "#7C5CFF", eyeColor: "#FAFAFA" } as const
/** Violet / foam / dust-rose: stock unlit wash. */
export const WEBGL_COLORS = ["#7C6AF7", "#7DD3C7", "#E8B4D4"]

export function isDarkTheme(): boolean {
  if (typeof document === "undefined") return false
  const root = document.documentElement
  if (root.classList.contains("dark")) return true
  if (root.classList.contains("light")) return false
  const dataTheme = root.getAttribute("data-theme")
  if (dataTheme === "dark") return true
  if (dataTheme === "light") return false
  return window.matchMedia("(prefers-color-scheme: dark)").matches
}

export function resolveDark(theme: LiveOrbTheme = "auto"): boolean {
  if (theme === "dark") return true
  if (theme === "light") return false
  return isDarkTheme()
}

/**
 * Calls `onChange` whenever the page theme may have changed (the `html`
 * class, `data-theme` or `style`, or the system preference). Returns the
 * unsubscribe.
 */
export function watchTheme(onChange: () => void): () => void {
  if (typeof document === "undefined") return () => {}
  const mo = new MutationObserver(onChange)
  mo.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "data-theme", "style"],
  })
  const mq = window.matchMedia("(prefers-color-scheme: dark)")
  mq.addEventListener("change", onChange)
  return () => {
    mo.disconnect()
    mq.removeEventListener("change", onChange)
  }
}

/** The material an omitted `variant` resolves to. */
export function defaultVariant(dark: boolean): LiveOrbVariant {
  return dark ? "white" : "black"
}

const VERT = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`

const FRAG = `
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_speed;
uniform vec2 u_look;
uniform float u_blink;
uniform float u_happy;
uniform float u_unsure;
uniform float u_mode;
uniform float u_depth;
uniform vec3 u_body;
uniform vec3 u_eye;
uniform vec3 u_c1;
uniform vec3 u_c2;
uniform vec3 u_c3;
uniform vec2 u_dir;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = m * p;
    a *= 0.5;
  }
  return v;
}

vec3 orient(vec3 p, vec2 look) {
  float yaw = look.x * 0.92;
  float pitch = -look.y * 0.78;
  float cy = cos(yaw);
  float sy = sin(yaw);
  float cp = cos(pitch);
  float sp = sin(pitch);
  vec3 q = vec3(p.x, p.y * cp - p.z * sp, p.y * sp + p.z * cp);
  return vec3(q.x * cy + q.z * sy, q.y, -q.x * sy + q.z * cy);
}

float eyeMask(vec3 n, vec3 e, vec3 right, vec3 up, float halfH, float rad, float aa, float happy) {
  float facing = dot(n, e);
  float x = dot(n, right) - dot(e, right);
  float y0 = dot(n, up) - dot(e, up);
  float y = y0 - clamp(y0, -halfH, halfH);
  float capsule = length(vec2(x, y)) - rad;
  // Happy eyes: the upper half of a ring, like ^ ^. The two shapes blend,
  // so the eyes morph into the smile and back.
  vec2 q = vec2(x, y0 + 0.06);
  float arch = max(abs(length(q) - 0.13) - 0.048, -q.y);
  float d = mix(capsule, arch, happy);
  float fill = 1.0 - smoothstep(-aa, aa, d);
  return fill * smoothstep(0.12, 0.32, facing);
}

// The owner's gradient laid across the face, start to end along u_dir like
// the CSS gradient it comes from, with a slow, soft sway so it stays alive
// without breaking into blotches.
vec3 wash(vec2 p, float t) {
  float s = dot(p, u_dir) * 0.5 + 0.5;
  s += (fbm(p * 1.1 + vec2(t * 0.08, -t * 0.06)) - 0.5) * 0.22;
  s = clamp(s, 0.0, 1.0);
  vec3 a = mix(u_c1, u_c2, smoothstep(0.0, 0.5, s));
  return mix(a, u_c3, smoothstep(0.5, 1.0, s));
}

void main() {
  vec2 uv = (gl_FragCoord.xy / u_resolution.xy) * 2.0 - 1.0;
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  uv.x *= aspect;

  float radius = 0.94;
  vec2 p = uv / radius;
  float r = length(p);
  // About 1.2 device pixels of falloff, whatever the canvas size.
  float aa = 2.4 / (u_resolution.y * radius);
  float edge = 1.0 - smoothstep(1.0 - aa, 1.0, r);
  if (edge <= 0.0) {
    gl_FragColor = vec4(0.0);
    return;
  }

  float z = sqrt(max(1.0 - min(r * r, 1.0), 0.0));
  vec3 n = normalize(vec3(p, z));

  vec2 look = u_look;
  float lm = length(look);
  if (lm > 1.0) look /= lm;

  vec3 right = orient(vec3(1.0, 0.0, 0.0), look);
  vec3 up = orient(vec3(0.0, 1.0, 0.0), look);
  vec3 eL = orient(normalize(vec3(-0.32, 0.08, 1.0)), look);
  vec3 eR = orient(normalize(vec3(0.32, 0.08, 1.0)), look);

  float halfH = mix(0.128, 0.012, u_blink);
  float rad = mix(0.054, 0.062, u_blink);
  // Unsure squints one eye, like a raised eyebrow on the other.
  float halfL = halfH * (1.0 - 0.6 * u_unsure);
  float eyes = max(
    eyeMask(n, eL, right, up, halfL, rad, aa, u_happy),
    eyeMask(n, eR, right, up, halfH, rad, aa, u_happy)
  );

  vec3 body = u_mode > 0.5 ? wash(p, u_time * u_speed) : u_body;

  // A key light from the upper left, fixed in view space so the highlight
  // stays put while the gaze turns.
  vec3 light = normalize(vec3(-0.45, 0.55, 0.75));
  float diffuse = max(dot(n, light), 0.0);
  float spec = pow(max(dot(n, normalize(light + vec3(0.0, 0.0, 1.0))), 0.0), 22.0);
  float rim = pow(1.0 - z, 2.5);
  // Gradients get softer shading, so their end colour stays the one picked.
  vec3 lit = body * (u_mode > 0.5 ? mix(0.82, 1.08, diffuse) : mix(0.62, 1.1, diffuse));
  lit += (vec3(1.0) - lit) * spec * 0.2;
  lit += vec3(0.16) * rim * 0.4;
  vec3 eye = u_eye * mix(0.82, 1.04, diffuse) + spec * 0.06;

  vec3 col = mix(
    mix(body, lit, u_depth),
    mix(u_eye, eye, u_depth),
    clamp(eyes, 0.0, 1.0)
  );

  // Premultiplied so the antialiased edge composites without a fringe.
  gl_FragColor = vec4(clamp(col, 0.0, 1.0) * edge, edge);
}
`

function isDev() {
  return (
    typeof process !== "undefined" && process.env?.NODE_ENV !== "production"
  )
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "").trim()
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h.padEnd(6, "0").slice(0, 6)
  const n = Number.parseInt(full, 16)
  if (Number.isNaN(n)) return [0.96, 0.96, 0.96]
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    if (isDev()) {
      console.warn(
        "LiveOrb: shader failed to compile\n",
        gl.getShaderInfoLog(shader)
      )
    }
    gl.deleteShader(shader)
    return null
  }
  return shader
}

export function resolveVariant(
  variant: LiveOrbVariant | undefined,
  color?: string,
  eyeColor?: string,
  colors?: string[],
  dark = false
) {
  let body: string = WHITE.color
  let eye: string = WHITE.eyeColor
  let mode = 0
  let palette: string[] = WEBGL_COLORS
  const preset = variant ?? defaultVariant(dark)

  if (preset === "black") {
    body = BLACK.color
    eye = BLACK.eyeColor
  } else if (preset === "webgl") {
    palette = colors && colors.length > 0 ? colors : WEBGL_COLORS
    body = palette[1] ?? WEBGL_COLORS[1]!
    eye = eyeColor ?? "#0C0C10"
    mode = 1
  } else if (preset === "custom") {
    body = color ?? CUSTOM_DEFAULT.color
    eye = eyeColor ?? CUSTOM_DEFAULT.eyeColor
  }

  return { body, eye, mode, palette }
}

export function fallbackFaceStyle(
  resolved: ReturnType<typeof resolveVariant>,
  angle = 135
): {
  backgroundColor?: string
  backgroundImage?: string
} {
  if (resolved.mode === 1) {
    const a = resolved.palette[0] ?? WEBGL_COLORS[0]
    const b = resolved.palette[1] ?? WEBGL_COLORS[1]
    const c = resolved.palette[2] ?? WEBGL_COLORS[2]
    return {
      backgroundImage: `linear-gradient(${angle}deg, ${a}, ${b}, ${c})`,
    }
  }
  return {
    backgroundColor: resolved.body,
    backgroundImage:
      "radial-gradient(circle at 30% 26%, rgba(255,255,255,0.16), rgba(255,255,255,0) 46%), radial-gradient(circle at 70% 82%, rgba(0,0,0,0.28), rgba(0,0,0,0) 62%)",
  }
}

/** How long the pointer rests before the eyes start looking around. */
const IDLE_MS = 3000
const REST_LOOK = { x: 0, y: 0.08 }
/** Pointer distance, in CSS pixels, at which the gaze is about two-thirds turned. */
const LOOK_REACH_PX = 260
/** How far the gaze turns at most, so the eyes never roll out of view. */
const MAX_LOOK = 0.72
const LISTEN_LOOK = { x: 0, y: -0.5 }
/** Where a thinking gaze holds under reduced motion. */
const THINK_REST_LOOK = { x: 0.3, y: 0.45 }
/** A smile looks straight at you, a touch up. */
const HAPPY_LOOK = { x: 0, y: 0.14 }
/** Unsure looks down and away, like someone who doesn't know. */
const UNSURE_LOOK = { x: -0.36, y: -0.34 }
/** How far, in CSS pixels, a scroll "points" the gaze on touch screens. */
const SCROLL_LOOK_PX = 320

/**
 * Evenly lit sphere with two capsule eyes that follow the pointer and look
 * around when it rests.
 * The orb stays put; only the gaze moves. Frames are drawn only while the
 * canvas is on screen and the tab is visible. Under reduced motion it holds a
 * still, settled frame and redraws it when its inputs change. It recovers
 * from a lost WebGL context.
 */
export function createLiveOrb(
  canvas: HTMLCanvasElement,
  initial: LiveOrbOptions = {}
): LiveOrbInstance | null {
  let options: Required<Pick<LiveOrbOptions, "interactive" | "blink">> &
    LiveOrbOptions = {
    interactive: true,
    blink: true,
    ...initial,
  }
  let dark = resolveDark(options.theme)

  const look = { x: 0, y: 0.08 }
  const targetLook = { x: 0, y: 0.08 }
  // Where the eyes drift while nobody is steering them.
  const glance = { x: 0, y: 0.08 }

  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: true,
    powerPreference: "default",
  })
  if (!gl) return null

  let vs: WebGLShader | null = null
  let fs: WebGLShader | null = null
  let program: WebGLProgram | null = null
  let buf: WebGLBuffer | null = null
  let uResolution: WebGLUniformLocation | null = null
  let uTime: WebGLUniformLocation | null = null
  let uSpeed: WebGLUniformLocation | null = null
  let uLook: WebGLUniformLocation | null = null
  let uBlink: WebGLUniformLocation | null = null
  let uHappy: WebGLUniformLocation | null = null
  let uUnsure: WebGLUniformLocation | null = null
  let uMode: WebGLUniformLocation | null = null
  let uDepth: WebGLUniformLocation | null = null
  let uBody: WebGLUniformLocation | null = null
  let uEye: WebGLUniformLocation | null = null
  let uC1: WebGLUniformLocation | null = null
  let uC2: WebGLUniformLocation | null = null
  let uC3: WebGLUniformLocation | null = null
  let uDir: WebGLUniformLocation | null = null

  // Builds every GL resource. Runs at startup and again after a context restore.
  const initGl = () => {
    vs = compile(gl, gl.VERTEX_SHADER, VERT)
    fs = compile(gl, gl.FRAGMENT_SHADER, FRAG)
    if (!vs || !fs) return false

    const prog = gl.createProgram()
    if (!prog) return false
    program = prog
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      if (isDev()) {
        console.warn(
          "LiveOrb: program failed to link\n",
          gl.getProgramInfoLog(prog)
        )
      }
      return false
    }
    gl.useProgram(prog)

    buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    )
    const loc = gl.getAttribLocation(prog, "a_position")
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    uResolution = gl.getUniformLocation(prog, "u_resolution")
    uTime = gl.getUniformLocation(prog, "u_time")
    uSpeed = gl.getUniformLocation(prog, "u_speed")
    uLook = gl.getUniformLocation(prog, "u_look")
    uBlink = gl.getUniformLocation(prog, "u_blink")
    uHappy = gl.getUniformLocation(prog, "u_happy")
    uUnsure = gl.getUniformLocation(prog, "u_unsure")
    uMode = gl.getUniformLocation(prog, "u_mode")
    uDepth = gl.getUniformLocation(prog, "u_depth")
    uBody = gl.getUniformLocation(prog, "u_body")
    uEye = gl.getUniformLocation(prog, "u_eye")
    uC1 = gl.getUniformLocation(prog, "u_c1")
    uC2 = gl.getUniformLocation(prog, "u_c2")
    uC3 = gl.getUniformLocation(prog, "u_c3")
    uDir = gl.getUniformLocation(prog, "u_dir")

    gl.viewport(0, 0, canvas.width, canvas.height)
    return true
  }

  if (!initGl()) return null
  options.onHasGl?.(true)

  let raf = 0
  let destroyed = false
  // Set while the GPU context is gone; nothing touches gl until it returns.
  let lost = false
  let onScreen = true
  let last = 0
  // Milliseconds of motion so far; only advances while the orb is moving.
  let clock = 0
  let nextBlink = 1800 + Math.random() * 2400
  let blinkAt = -10_000
  let nextGlance = 600 + Math.random() * 900
  // When the pointer last moved, from performance.now().
  let pointerAt = -Infinity
  // Set when `lookAt` starts, so the next frame schedules a blink.
  let blinkSoon = false
  // How far the face is into each reaction, eased from 0 to 1 and back.
  let happy = 0
  let unsure = 0

  /** Returns whether the backing size changed (which clears the canvas). */
  const resize = () => {
    const parent = canvas.parentElement
    if (!parent) return false
    // Small orbs render at 2-3x so the edge and eyes stay smooth.
    const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 2), 3)
    const w = parent.clientWidth
    const h = parent.clientHeight
    if (w <= 0 || h <= 0) return false
    const width = Math.max(1, Math.floor(w * dpr))
    const height = Math.max(1, Math.floor(h * dpr))
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    if (width === canvas.width && height === canvas.height) return false
    canvas.width = width
    canvas.height = height
    gl.viewport(0, 0, canvas.width, canvas.height)
    return true
  }

  const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)")

  const moving = () =>
    onScreen && !mqReduce.matches && document.visibilityState !== "hidden"

  function wake() {
    if (raf || destroyed || lost) return
    last = performance.now()
    raf = requestAnimationFrame(tick)
  }

  /**
   * Draws now: resizing cleared the canvas, and waiting for the next frame
   * would show it blank for one. Zero dt, so time doesn't jump; the tick
   * reschedules itself if it should keep running.
   */
  function redraw() {
    if (destroyed || lost) return
    cancelAnimationFrame(raf)
    raf = 0
    last = performance.now()
    tick(last)
  }

  /** Aims the gaze at a point on the page, in viewport pixels. */
  const lookToward = (clientX: number, clientY: number) => {
    if (!options.interactive) return
    const parent = canvas.parentElement
    if (!parent) return
    const rect = parent.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return
    const dx = clientX - (rect.left + rect.width / 2)
    const dy = rect.top + rect.height / 2 - clientY
    const dist = Math.hypot(dx, dy)
    // The gaze strengthens with distance instead of maxing out just outside
    // the orb, so the eyes keep tracking the pointer across the page.
    const reach = Math.max(LOOK_REACH_PX, rect.width * 3)
    const strength = MAX_LOOK * (1 - Math.exp(-dist / reach))
    targetLook.x = dist > 0 ? (dx / dist) * strength : 0
    targetLook.y = dist > 0 ? (dy / dist) * strength : 0
    pointerAt = performance.now()
    // While moving the loop is already queued; a still frame follows the gaze.
    if (onScreen) wake()
  }
  const onMove = (e: PointerEvent) => lookToward(e.clientX, e.clientY)
  window.addEventListener("pointermove", onMove, { passive: true })

  // Touch screens have no hovering pointer, so the eyes turn toward taps and
  // follow the scroll: down while the page moves on, up when it comes back.
  const touchOnly = window.matchMedia("(hover: none)")
  const onTap = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") lookToward(e.clientX, e.clientY)
  }
  window.addEventListener("pointerdown", onTap, { passive: true })
  let lastScrollY = window.scrollY
  let scrollFrame = 0
  const onScroll = () => {
    if (scrollFrame) return
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = 0
      const delta = window.scrollY - lastScrollY
      lastScrollY = window.scrollY
      if (!touchOnly.matches || Math.abs(delta) < 2) return
      const rect = canvas.getBoundingClientRect()
      lookToward(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2 + Math.sign(delta) * SCROLL_LOOK_PX
      )
    })
  }
  window.addEventListener("scroll", onScroll, { passive: true })

  const tick = (now: number) => {
    raf = 0
    if (lost) return
    const dt = Math.min(50, Math.max(0, now - last))
    last = now
    const live = moving()
    if (live) clock += dt
    const reduce = mqReduce.matches

    const resolved = resolveVariant(
      options.variant,
      options.color,
      options.eyeColor,
      options.colors,
      dark
    )
    const time = clock / 1000

    // The pointer steers until it rests; then the eyes look around, now
    // and then back at you. Reduced motion holds a still, centred gaze.
    const steering = options.interactive && now - pointerAt < IDLE_MS
    if (!steering && live && clock >= nextGlance) {
      const back = Math.random() < 0.3
      glance.x = back ? 0 : (Math.random() * 2 - 1) * 0.8
      glance.y = back ? 0.08 : (Math.random() * 2 - 1) * 0.5
      nextGlance = clock + 900 + Math.random() * 2100
    }
    const mood = options.mood ?? "idle"
    let goal = steering ? targetLook : reduce ? REST_LOOK : glance
    if (options.lookAt) {
      goal = options.lookAt
    } else if (mood === "listening") {
      goal = LISTEN_LOOK
    } else if (mood === "thinking") {
      // A slow look up and across, like someone working out an answer.
      goal = reduce
        ? THINK_REST_LOOK
        : { x: Math.sin(clock / 650) * 0.42, y: 0.45 + Math.sin(clock / 1100) * 0.06 }
    } else if (mood === "happy") {
      goal = HAPPY_LOOK
    } else if (mood === "unsure") {
      goal = UNSURE_LOOK
    }
    const react = live ? 0.18 : 1
    happy += ((mood === "happy" ? 1 : 0) - happy) * react
    unsure += ((mood === "unsure" ? 1 : 0) - unsure) * react
    // A still frame skips the easing and shows where the gaze settles.
    const ease = live ? (steering ? 0.16 : 0.1) : 1
    look.x += (goal.x - look.x) * ease
    look.y += (goal.y - look.y) * ease

    if (blinkSoon) {
      blinkSoon = false
      nextBlink = Math.min(nextBlink, clock + 280)
    }
    if (!reduce && options.blink && clock >= nextBlink) {
      blinkAt = clock
      nextBlink = clock + 2200 + Math.random() * 3800
    }
    const bt = (clock - blinkAt) / 1000
    let b = 0
    if (!reduce && options.blink) {
      if (bt < 0.055) b = bt / 0.055
      else if (bt < 0.1) b = 1
      else if (bt < 0.18) b = 1 - (bt - 0.1) / 0.08
    }
    // No blinking mid-smile.
    b *= 1 - happy
    const body = hexToRgb(resolved.body)
    const eye = hexToRgb(resolved.eye)
    const palette = [0, 1, 2].map((i) =>
      hexToRgb(
        resolved.palette[i % resolved.palette.length] ?? WEBGL_COLORS[i]!
      )
    )

    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.uniform2f(uResolution, canvas.width, canvas.height)
    gl.uniform1f(uTime, reduce ? 0 : time)
    gl.uniform1f(uSpeed, reduce ? 0 : 0.55)
    gl.uniform2f(uLook, look.x, look.y)
    gl.uniform1f(uBlink, b)
    gl.uniform1f(uHappy, happy)
    gl.uniform1f(uUnsure, unsure)
    gl.uniform1f(uMode, resolved.mode)
    gl.uniform1f(uDepth, options.depth === false ? 0 : 1)
    gl.uniform3f(uBody, body[0], body[1], body[2])
    gl.uniform3f(uEye, eye[0], eye[1], eye[2])
    gl.uniform3f(uC1, palette[0]![0], palette[0]![1], palette[0]![2])
    gl.uniform3f(uC2, palette[1]![0], palette[1]![1], palette[1]![2])
    gl.uniform3f(uC3, palette[2]![0], palette[2]![1], palette[2]![2])
    // CSS angles turn clockwise from "to top"; the shader's y points up.
    const rad = ((options.angle ?? 135) * Math.PI) / 180
    gl.uniform2f(uDir, Math.sin(rad), Math.cos(rad))

    gl.drawArrays(gl.TRIANGLES, 0, 6)
    if (live && !destroyed) raf = requestAnimationFrame(tick)
  }

  const ro = new ResizeObserver(() => {
    if (resize()) redraw()
  })
  if (canvas.parentElement) ro.observe(canvas.parentElement)
  const io = new IntersectionObserver(([entry]) => {
    onScreen = entry?.isIntersecting ?? true
    wake()
  })
  io.observe(canvas)
  const onVisibility = () => wake()
  document.addEventListener("visibilitychange", onVisibility)
  const onReduce = () => wake()
  mqReduce.addEventListener("change", onReduce)
  const syncTheme = () => {
    const next = resolveDark(options.theme)
    if (next === dark) return
    dark = next
    wake()
  }
  const unwatchTheme = watchTheme(syncTheme)

  // Without preventDefault the browser never hands the context back.
  const onLost = (e: Event) => {
    e.preventDefault()
    lost = true
    cancelAnimationFrame(raf)
    raf = 0
    // A lost canvas paints a broken-image icon over the CSS fallback.
    canvas.style.visibility = "hidden"
    options.onHasGl?.(false)
  }
  const onRestored = () => {
    if (destroyed) return
    // A failed rebuild leaves the orb on its CSS fallback.
    if (!initGl()) return
    lost = false
    canvas.style.visibility = ""
    options.onHasGl?.(true)
    wake()
  }
  canvas.addEventListener("webglcontextlost", onLost)
  canvas.addEventListener("webglcontextrestored", onRestored)

  resize()
  wake()

  return {
    setOptions(next) {
      if (next.lookAt && !options.lookAt) blinkSoon = true
      options = { ...options, ...next }
      dark = resolveDark(options.theme)
      wake()
    },
    destroy() {
      destroyed = true
      cancelAnimationFrame(raf)
      raf = 0
      ro.disconnect()
      io.disconnect()
      document.removeEventListener("visibilitychange", onVisibility)
      mqReduce.removeEventListener("change", onReduce)
      unwatchTheme()
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerdown", onTap)
      window.removeEventListener("scroll", onScroll)
      cancelAnimationFrame(scrollFrame)
      canvas.removeEventListener("webglcontextlost", onLost)
      canvas.removeEventListener("webglcontextrestored", onRestored)
      if (lost) canvas.style.visibility = ""
      options.onHasGl?.(false)
      gl.deleteProgram(program)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
      gl.deleteBuffer(buf)
      // Free the GPU context once the canvas has left the page; browsers cap
      // live contexts at about 16. A canvas still in the page (a React
      // Strict Mode replay) keeps it, so a new engine can reuse it.
      const lose = gl.getExtension("WEBGL_lose_context")
      queueMicrotask(() => {
        if (!canvas.isConnected && !gl.isContextLost()) lose?.loseContext()
      })
    },
  }
}

export type LiveOrbProps = Omit<LiveOrbOptions, "onHasGl"> & {
  className?: string
  /** Edge length in CSS pixels. Default `280`. */
  size?: number
}

/**
 * Evenly lit sphere with two capsule eyes that follow the pointer.
 * The orb stays put; only the gaze moves. Without a `variant` it is white
 * on dark pages and black on light ones.
 */
export function LiveOrb({
  className,
  size = 280,
  variant,
  color,
  eyeColor,
  colors,
  angle,
  interactive = true,
  blink = true,
  depth = true,
  mood = "idle",
  lookAt = null,
  theme = "auto",
}: LiveOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const instanceRef = useRef<LiveOrbInstance | null>(null)
  const [hasGl, setHasGl] = useState(false)
  // The CSS fallback face needs the theme too; it starts light on the
  // server and corrects itself right after mount.
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const sync = () => setDark(resolveDark(theme))
    sync()
    return watchTheme(sync)
  }, [theme])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    instanceRef.current = createLiveOrb(canvas, {
      variant,
      color,
      eyeColor,
      colors,
      angle,
      interactive,
      blink,
      depth,
      mood,
      lookAt,
      theme,
      onHasGl: setHasGl,
    })
    return () => {
      instanceRef.current?.destroy()
      instanceRef.current = null
    }
    // Engine reads live options via setOptions; mount once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    instanceRef.current?.setOptions({
      variant,
      color,
      eyeColor,
      colors,
      angle,
      interactive,
      blink,
      depth,
      mood,
      lookAt,
      theme,
      onHasGl: setHasGl,
    })
  }, [variant, color, eyeColor, colors, angle, interactive, blink, depth, mood, lookAt, theme])

  const resolved = resolveVariant(variant, color, eyeColor, colors, dark)

  return (
    <div
      data-slot="live-orb"
      aria-hidden="true"
      className={clsx("relative shrink-0", className)}
      style={{ width: size, height: size }}
    >
      {!hasGl ? (
        <div
          aria-hidden
          className="absolute inset-[2%] overflow-hidden rounded-full"
          style={fallbackFaceStyle(resolved, angle)}
        >
          <span
            className="absolute rounded-full"
            style={{
              backgroundColor: resolved.eye,
              width: "13%",
              height: "28%",
              left: "31%",
              top: "34%",
            }}
          />
          <span
            className="absolute rounded-full"
            style={{
              backgroundColor: resolved.eye,
              width: "13%",
              height: "28%",
              left: "56%",
              top: "34%",
            }}
          />
        </div>
      ) : null}
      <canvas ref={canvasRef} className="absolute inset-0 size-full" />
    </div>
  )
}
