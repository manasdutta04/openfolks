"use client"

import * as React from "react"

/**
 * Beam Wordmark Footer — a midnight-navy closing section crossed by a slow
 * diagonal shaft of light, with the brand set as a giant, bottom-cropped
 * wordmark that the light runs through.
 *
 * Top: a copyright label over a hairline, glassy square social buttons and a
 * two-line credit; then link columns with accent labels over hairlines.
 * Bottom: the wordmark, fitted to the full width, one span per letter. Every
 * letter paints the same beam and pointer glow as the backdrop, aligned to the
 * section's own coordinates, so the light reads as one shaft passing behind
 * the columns and through the letters.
 *
 * Interaction: the beam drifts on its own and leans toward the pointer; the
 * pointer carries a soft glow that lights the letters it passes; letters lift
 * on hover and hop when clicked; columns, hairlines and letters rise in the
 * first time the footer is seen.
 *
 * No dependencies and nothing fetched: React is the only import, icons are
 * inline SVG, the wordmark is live text in whatever sans the page has.
 */

// #region beam
// Pure: colour, fitting and beam maths. Lifted out and run by the test.

export const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v)

/** "#3d6bff" / "#36f" → "61, 107, 255". Anything unparseable falls back. */
export const hexToRgb = (hex: string, fallback: string = "61, 107, 255"): string => {
  const m = /^#?([\da-f]{3}|[\da-f]{6})$/i.exec((hex || "").trim())
  if (!m) return fallback
  const h = m[1].length === 3 ? m[1].replace(/./g, (c) => c + c) : m[1]
  const n = parseInt(h, 16)
  return ((n >> 16) & 255) + ", " + ((n >> 8) & 255) + ", " + (n & 255)
}

/**
 * Font size (px) that makes a word measured at 100px span `target` px. A short
 * word would grow into a tower, so it is capped at `cap` px. Bad input is 0.
 */
export const fitSize = (measuredAt100: number, target: number, cap: number): number => {
  if (!(measuredAt100 > 0) || !(target > 0)) return 0
  const size = (100 * target) / measuredAt100
  return cap > 0 ? Math.min(size, cap) : size
}

/** Where the beam sits (% across the section) for a pointer at `u` (0 → 1 across). */
export const beamTarget = (u: number, lo: number = 30, hi: number = 82): number =>
  lo + (hi - lo) * clamp(Number.isFinite(u) ? u : 0.5, 0, 1)

/** The beam's idle sway: two slow, unrelated sines so it never visibly loops. */
export const drift = (t: number, centre: number = 58, amp: number = 9): number =>
  centre + amp * (0.7 * Math.sin(t * 0.21) + 0.3 * Math.sin(t * 0.077 + 1.3))

/** Frame-rate independent ease toward a target: `k` is the fraction closed per 1/60s. */
export const approach = (from: number, to: number, k: number, dt: number): number =>
  to + (from - to) * Math.pow(1 - clamp(k, 0, 1), clamp(dt, 0, 0.1) * 60)

/**
 * Where the baseline sits in a `line-height: 1` box, as a fraction of the font
 * size, from the font's ascent and descent at 100px. The line box is 100px; the
 * content area is centred in it. Missing metrics fall back to a typical 0.8.
 */
export const baselineAt = (ascent: number, descent: number): number => {
  if (!(ascent > 0) || !(descent >= 0)) return 0.8
  return clamp(((100 - ascent - descent) / 2 + ascent) / 100, 0.5, 1.2)
}

/** Visible wordmark height: down to the baseline, plus `cut` em below it. */
export const wordHeight = (fontSize: number, baseline: number, cut: number): number =>
  Math.max(0, fontSize * (baseline + clamp(Number.isFinite(cut) ? cut : 0, -0.4, 0.4)))

// #endregion

export type SocialIcon = "x" | "linkedin" | "youtube" | "instagram" | "github" | "dribbble"

export type FooterSocial = {
  label: string
  href?: string
  /** One of the built-ins, or your own 24×24 node. */
  icon: SocialIcon | React.ReactNode
}

export type FooterLink = { label: string; href?: string }
export type FooterColumn = { title: string; links: FooterLink[] }
/** One credit line: `lead` muted, `label` bright (a link when it has an `href`), `tail` muted. */
export type FooterCredit = { lead?: string; label: string; href?: string; tail?: string }

export type BeamWordmarkFooterProps = {
  brand?: string
  /** What the giant wordmark spells. Defaults to `brand`. */
  wordmark?: string
  company?: string
  year?: number
  socials?: FooterSocial[]
  credits?: FooterCredit[]
  columns?: FooterColumn[]
  onLinkClick?: (label: string, href?: string) => void
  /** Where the bottom edge cuts the wordmark, in em below its baseline. Negative cuts into the letters. */
  cut?: number
  background?: string
  ink?: string
  muted?: string
  /** Labels, hairlines, the beam and the wordmark's lit edge. */
  accent?: string
  /** The wordmark's resting fill, top and foot. */
  wordTop?: string
  wordFoot?: string
  fontSans?: string
  wordWeight?: number
  /** `false` holds the beam still (the pointer glow still follows). */
  animate?: boolean
  className?: string
  /** Anything extra under the credit lines (for example a "built with" avatar). */
  extra?: React.ReactNode
}

const DEFAULT_SOCIALS: FooterSocial[] = [
  { label: "X", href: "#", icon: "x" },
  { label: "LinkedIn", href: "#", icon: "linkedin" },
  { label: "YouTube", href: "#", icon: "youtube" },
  { label: "Instagram", href: "#", icon: "instagram" },
]

const DEFAULT_COLUMNS: FooterColumn[] = [
  {
    title: "Our Product",
    links: [
      { label: "Features", href: "#" },
      { label: "Benefits", href: "#" },
      { label: "Pricing", href: "#" },
      { label: "Testimonials", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "#" },
      { label: "FAQ", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
]

const SANS =
  '"DM Sans", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'

const ICONS: Record<SocialIcon, React.ReactNode> = {
  x: (
    <path
      d="M17.6 3.5h2.9l-6.3 7.2 7.4 9.8h-5.8l-4.5-5.9-5.2 5.9H3.2l6.7-7.7L2.8 3.5h5.9l4.1 5.4 4.8-5.4Zm-1 15.3h1.6L7.9 5.1H6.2l10.4 13.7Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinejoin="round"
    />
  ),
  linkedin: (
    <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="3.5" width="17" height="17" rx="2.5" />
      <path d="M8 10.5V16M12 16v-5.5M12 13c0-1.6 1-2.6 2.4-2.6s2.1.9 2.1 2.4V16" />
      <circle cx="8" cy="7.7" r=".55" fill="currentColor" />
    </g>
  ),
  youtube: (
    <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
      <rect x="2.75" y="5.5" width="18.5" height="13" rx="4" />
      <path d="M10.2 9.3v5.4l4.6-2.7-4.6-2.7Z" />
    </g>
  ),
  instagram: (
    <g fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="3.9" />
      <circle cx="17.1" cy="6.9" r=".6" fill="currentColor" stroke="none" />
    </g>
  ),
  github: (
    <path
      d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  dribbble: (
    <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.6 4.2c3.4 4.4 5.4 9.6 6.1 15.6M3.6 10.6c5.6.3 10.4-1 13.9-4.4M5.6 17.6c3.4-4.2 8.6-5.6 14.8-3.6" />
    </g>
  ),
}

/** Baseline of the wordmark's actual font, read off a canvas. */
const measureBaseline = (family: string, weight: number, text: string): number => {
  try {
    const ctx = document.createElement("canvas").getContext("2d")
    if (!ctx) return 0.8
    ctx.font = weight + " 100px " + family
    const m = ctx.measureText(text)
    return baselineAt(m.fontBoundingBoxAscent, m.fontBoundingBoxDescent)
  } catch {
    return 0.8
  }
}

const isIconName = (v: unknown): v is SocialIcon => typeof v === "string" && v in ICONS

// One scoped stylesheet. Every rule sits under .bwf; element resets go through
// :where(.bwf) so they never out-rank the component's own classes or yours.
const CSS =
  ".bwf{position:relative;isolation:isolate;overflow:hidden;container-type:inline-size;background:var(--bwf-bg);color:var(--bwf-ink);font-family:var(--bwf-sans);-webkit-font-smoothing:antialiased;touch-action:pan-y}" +
  ":where(.bwf) a{color:inherit;text-decoration:none}" +
  ":where(.bwf) button{font:inherit;color:inherit;background:none;border:0;padding:0;margin:0;cursor:pointer}" +
  ":where(.bwf) ul{list-style:none;margin:0;padding:0}" +
  ":where(.bwf) p{margin:0}" +
  ".bwf svg{max-width:none;display:block}" +
  ".bwf .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}" +
  // The top rule: a hairline of accent, brighter where the beam crosses it.
  ".bwf-rule{position:absolute;left:0;right:0;top:0;height:1px;z-index:3;background:linear-gradient(90deg,rgba(var(--bwf-acc),.15),rgba(var(--bwf-acc),.55) var(--bwf-b),rgba(var(--bwf-acc),.15))}" +
  // Backdrop: navy wash, faint vertical bands, the beam, a soft second beam,
  // the pointer glow, and grain. One frame (the section box) for all of them.
  ".bwf-sky{position:absolute;inset:0;z-index:0;pointer-events:none}" +
  ".bwf-wash{position:absolute;inset:0;background:radial-gradient(120% 90% at 8% 0%,rgba(var(--bwf-acc),.2),transparent 55%),radial-gradient(90% 70% at 92% 8%,rgba(var(--bwf-acc),.14),transparent 60%),linear-gradient(180deg,rgba(var(--bwf-acc),.06),transparent 70%)}" +
  ".bwf-bands{position:absolute;inset:0;background:repeating-linear-gradient(90deg,rgba(var(--bwf-acc),.05) 0 1.6cqw,transparent 1.6cqw 4.2cqw);-webkit-mask-image:linear-gradient(100deg,#000 0%,transparent 55%);mask-image:linear-gradient(100deg,#000 0%,transparent 55%);opacity:.9}" +
  ".bwf-beam{position:absolute;inset:0;filter:blur(calc(1px + 1.6cqw));background:linear-gradient(var(--bwf-ang),transparent calc(var(--bwf-b) - 11%),rgba(var(--bwf-acc),.10) calc(var(--bwf-b) - 5%),rgba(var(--bwf-acc),.34) var(--bwf-b),rgba(var(--bwf-acc),.08) calc(var(--bwf-b) + 4%),transparent calc(var(--bwf-b) + 9%)),linear-gradient(var(--bwf-ang),transparent calc(var(--bwf-b) - 34%),rgba(var(--bwf-acc),.10) calc(var(--bwf-b) - 27%),transparent calc(var(--bwf-b) - 20%))}" +
  ".bwf-glow{position:absolute;inset:0;opacity:var(--bwf-g);background:radial-gradient(circle 26cqw at var(--bwf-px) var(--bwf-py),rgba(var(--bwf-acc),.16),transparent 70%)}" +
  ".bwf-grain{position:absolute;inset:0;opacity:.14;mix-blend-mode:overlay;background-image:url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")}" +
  // Layout.
  ".bwf-inner{position:relative;z-index:2;box-sizing:border-box;max-width:1120px;margin:0 auto;padding:clamp(48px,8.5cqw,104px) clamp(20px,6cqw,88px) 0;display:grid;grid-template-columns:minmax(0,1.62fr) minmax(0,.86fr) minmax(0,.86fr);column-gap:clamp(24px,4cqw,48px);row-gap:44px}" +
  ".bwf-label{font-size:12px;line-height:1;letter-spacing:.01em;color:rgb(var(--bwf-acc));padding-bottom:13px;position:relative;display:block}" +
  ".bwf-label::after{content:'';position:absolute;left:0;right:0;bottom:0;height:1px;background:linear-gradient(90deg,rgba(var(--bwf-acc),.55),rgba(var(--bwf-acc),.28));transform-origin:0 50%;transform:scaleX(var(--bwf-line,1));transition:transform 1.1s cubic-bezier(.2,.7,.1,1) var(--bwf-d,0ms)}" +
  ".bwf[data-in='false'] .bwf-label::after{--bwf-line:0}" +
  ".bwf-col{min-width:0}" +
  ".bwf-col:nth-child(1){max-width:420px}" +
  ".bwf-fade{transition:opacity .9s ease var(--bwf-d,0ms),translate .9s cubic-bezier(.2,.7,.1,1) var(--bwf-d,0ms)}" +
  ".bwf[data-in='false'] .bwf-fade{opacity:0;translate:0 14px}" +
  // Socials: glassy squares with a lit top edge.
  ".bwf-socials{display:flex;gap:16px;margin-top:13px}" +
  ".bwf-soc{position:relative;width:31px;height:31px;display:grid;place-items:center;border-radius:5px;color:rgba(var(--bwf-ink-rgb),.62);background:linear-gradient(180deg,rgba(var(--bwf-ink-rgb),.09),rgba(var(--bwf-ink-rgb),.025));box-shadow:inset 0 0 0 1px rgba(var(--bwf-ink-rgb),.16),inset 0 1px 0 rgba(var(--bwf-ink-rgb),.14),0 6px 14px -8px rgba(0,0,0,.8);transition:color .25s,box-shadow .35s,translate .35s cubic-bezier(.2,.8,.2,1),background .35s}" +
  ".bwf-soc svg{width:17px;height:17px}" +
  ".bwf-soc:hover,.bwf-soc:focus-visible{color:var(--bwf-ink);translate:0 -2px;background:linear-gradient(180deg,rgba(var(--bwf-acc),.32),rgba(var(--bwf-acc),.08));box-shadow:inset 0 0 0 1px rgba(var(--bwf-acc),.75),inset 0 1px 0 rgba(var(--bwf-ink-rgb),.3),0 10px 26px -8px rgba(var(--bwf-acc),.75)}" +
  ".bwf-soc:focus-visible{outline:none}" +
  ".bwf-tip{position:absolute;z-index:5;left:50%;top:calc(100% + 9px);translate:-50% -4px;white-space:nowrap;font-size:11px;line-height:1;padding:6px 8px;border-radius:4px;background:rgba(var(--bwf-acc),.95);color:#fff;opacity:0;pointer-events:none;transition:opacity .2s,translate .25s}" +
  ".bwf-tip::after{content:'';position:absolute;left:50%;bottom:100%;margin-left:-4px;border:4px solid transparent;border-bottom-color:rgba(var(--bwf-acc),.95)}" +
  ".bwf-soc:hover .bwf-tip,.bwf-soc:focus-visible .bwf-tip{opacity:1;translate:-50% 0}" +
  // Credits.
  ".bwf-credits{margin-top:21px;font-size:14px;line-height:1.5;color:var(--bwf-muted)}" +
  ".bwf-credits p+p{margin-top:2px}" +
  ".bwf-credits b{font-weight:400;color:var(--bwf-ink)}" +
  ".bwf-credits a{color:var(--bwf-ink);background:linear-gradient(rgb(var(--bwf-acc)),rgb(var(--bwf-acc))) 0 100%/0 1px no-repeat;transition:background-size .35s cubic-bezier(.2,.8,.2,1),color .25s}" +
  ".bwf-credits a:hover,.bwf-credits a:focus-visible{background-size:100% 1px;color:#fff;outline:none}" +
  // Link columns.
  ".bwf-links{margin-top:13px;display:flex;flex-direction:column;gap:0}" +
  ".bwf-link{position:relative;display:inline-flex;align-items:center;gap:8px;padding:6px 0;font-size:14.5px;line-height:21px;color:rgba(var(--bwf-ink-rgb),.78);transition:color .25s}" +
  ".bwf-link-t{display:inline-block;transition:translate .35s cubic-bezier(.2,.8,.2,1)}" +
  ".bwf-link::before{content:'';position:absolute;left:0;top:50%;width:6px;height:1px;margin-top:0;background:rgb(var(--bwf-acc));transform:scaleX(0);transform-origin:0 50%;transition:transform .35s cubic-bezier(.2,.8,.2,1)}" +
  ".bwf-link svg{width:12px;height:12px;opacity:0;translate:-6px 0;color:rgb(var(--bwf-acc));transition:opacity .25s,translate .35s cubic-bezier(.2,.8,.2,1)}" +
  ".bwf-link:hover,.bwf-link:focus-visible{color:#fff;outline:none}" +
  ".bwf-link:hover::before,.bwf-link:focus-visible::before{transform:scaleX(1)}" +
  ".bwf-link:hover .bwf-link-t,.bwf-link:focus-visible .bwf-link-t{translate:12px 0}" +
  ".bwf-link:hover svg,.bwf-link:focus-visible svg{opacity:1;translate:10px 0}" +
  ".bwf-link:focus-visible .bwf-link-t{text-decoration:underline;text-underline-offset:4px;text-decoration-color:rgba(var(--bwf-acc),.8)}" +
  // The wordmark. Each letter paints the section-sized background, shifted
  // back by its own offset, so beam and glow line up with the backdrop.
  ".bwf-word{position:relative;z-index:1;overflow:hidden;margin-top:clamp(28px,7cqw,96px)}" +
  ".bwf-word-box{padding:0 clamp(20px,6cqw,88px);max-width:1120px;margin:0 auto;box-sizing:border-box}" +
  ".bwf-word-in{display:inline-flex;white-space:nowrap;font-weight:var(--bwf-ww);line-height:1;letter-spacing:-.045em;user-select:none;-webkit-user-select:none}" +
  ".bwf-lw{display:inline-block;translate:0 0;transition:translate 1.25s cubic-bezier(.16,.84,.2,1) var(--bwf-d,0ms)}" +
  ".bwf[data-in='false'] .bwf-lw{translate:0 85%}" +
  ".bwf-l{display:inline-block;cursor:pointer;color:transparent;-webkit-background-clip:text;background-clip:text;background-repeat:no-repeat;background-size:var(--bwf-rw) var(--bwf-rh);background-position:calc(var(--bwf-x) * -1) calc(var(--bwf-y) * -1);" +
  "background-image:radial-gradient(circle 22cqw at var(--bwf-px) var(--bwf-py),rgba(var(--bwf-lit),calc(var(--bwf-g) * .85)),transparent 70%)," +
  "linear-gradient(var(--bwf-ang),transparent calc(var(--bwf-b) - 9%),rgba(var(--bwf-lit),.55) calc(var(--bwf-b) - 1.5%),rgba(var(--bwf-lit),.7) var(--bwf-b),rgba(var(--bwf-lit),.2) calc(var(--bwf-b) + 3.5%),transparent calc(var(--bwf-b) + 8%))," +
  "linear-gradient(180deg,var(--bwf-wt) var(--bwf-top),var(--bwf-wf) var(--bwf-bot));" +
  "transition:transform .5s cubic-bezier(.2,.9,.25,1.2),filter .4s;transform-origin:50% 100%}" +
  ".bwf-l:hover{transform:translateY(-.045em);filter:brightness(1.35) saturate(1.1)}" +
  ".bwf-l.is-hop{animation:bwf-hop .75s cubic-bezier(.2,.8,.2,1)}" +
  "@keyframes bwf-hop{0%{transform:translateY(0) scale(1,1)}18%{transform:translateY(.02em) scale(1.06,.9)}45%{transform:translateY(-.14em) scale(.97,1.05)}70%{transform:translateY(.01em) scale(1.02,.97)}100%{transform:translateY(-.045em) scale(1,1)}}" +
  // The foot sinks into the dark, the way the reference does.
  ".bwf-foot{position:absolute;left:0;right:0;bottom:0;height:34%;z-index:2;pointer-events:none;background:linear-gradient(180deg,transparent,rgba(var(--bwf-bg-rgb),.55) 55%,var(--bwf-bg))}" +
  "@container (max-width: 760px){.bwf-inner{grid-template-columns:minmax(0,1fr) minmax(0,1fr);row-gap:40px}.bwf-col:nth-child(1){grid-column:1 / -1;max-width:none}}" +
  "@media (prefers-reduced-motion: reduce){.bwf .bwf-lw,.bwf .bwf-fade,.bwf .bwf-label::after,.bwf .bwf-l,.bwf .bwf-soc,.bwf .bwf-link-t,.bwf .bwf-link svg{transition:none!important;animation:none!important}.bwf[data-in='false'] .bwf-lw,.bwf[data-in='false'] .bwf-fade{translate:none;opacity:1}.bwf[data-in='false'] .bwf-label::after{--bwf-line:1}}"

const Arrow = () => (
  <svg viewBox="0 0 12 12" aria-hidden="true">
    <path d="M2.5 9.5l7-7M4 2.5h5.5V8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export default function BeamWordmarkFooter({
  brand = "Zephyr",
  wordmark,
  company,
  year = new Date().getFullYear(),
  socials = DEFAULT_SOCIALS,
  credits,
  columns = DEFAULT_COLUMNS,
  onLinkClick,
  cut = 0.14,
  background = "#02040b",
  ink = "#eef1f8",
  muted = "#8a91a6",
  accent = "#3d6bff",
  wordTop = "#1d3fa3",
  wordFoot = "#060b22",
  fontSans = SANS,
  wordWeight = 500,
  animate = true,
  className = "",
  extra,
}: BeamWordmarkFooterProps) {
  const word = (wordmark ?? brand).trim() || brand
  const letters = React.useMemo(() => Array.from(word), [word])
  const credit = credits ?? [
    { lead: brand + " template by ", label: "Kedhar", href: "https://21st.dev/@kedhareswer" },
    { lead: "Part of ", label: "Night Shift", tail: " collection" },
  ]

  const rootRef = React.useRef<HTMLElement>(null)
  const wordRef = React.useRef<HTMLDivElement>(null)
  const innerRef = React.useRef<HTMLDivElement>(null)
  const [size, setSize] = React.useState(0)
  const [base, setBase] = React.useState(0.8)
  const [seen, setSeen] = React.useState(false)

  // Pointer state lives in a ref and reaches the page as CSS variables, so the
  // beam never re-renders React.
  const ptr = React.useRef({ u: 0.5, x: 0, y: 0, inside: false })

  // Fit the wordmark to the column width, then tell every letter where it sits
  // inside the section so its slice of the beam lines up with the backdrop.
  React.useLayoutEffect(() => {
    const root = rootRef.current
    const box = wordRef.current
    const inner = innerRef.current
    if (!root || !box || !inner) return
    let frame = 0
    const fit = () => {
      const wb = inner.parentElement ?? box
      const pad = parseFloat(getComputedStyle(wb).paddingLeft) || 0
      const target = wb.clientWidth - pad * 2
      inner.style.fontSize = "100px"
      const measured = inner.offsetWidth
      setBase(measureBaseline(getComputedStyle(inner).fontFamily, wordWeight, word))
      const next = fitSize(measured, target, target * 0.42)
      inner.style.fontSize = next + "px"
      setSize(next)
      place()
    }
    const place = () => {
      const r = root.getBoundingClientRect()
      root.style.setProperty("--bwf-rw", r.width + "px")
      root.style.setProperty("--bwf-rh", r.height + "px")
      const spans = inner.querySelectorAll<HTMLElement>(".bwf-l")
      let top = 0
      spans.forEach((s, i) => {
        // offsetLeft/Top chains ignore the reveal translate, so the beam is
        // already aligned while the letters are still rising.
        let x = 0
        let y = 0
        let el: HTMLElement | null = s
        while (el && el !== root) {
          x += el.offsetLeft
          y += el.offsetTop
          el = el.offsetParent as HTMLElement | null
        }
        s.style.setProperty("--bwf-x", x + "px")
        s.style.setProperty("--bwf-y", y + "px")
        if (i === 0) top = y
      })
      root.style.setProperty("--bwf-top", top + "px")
      root.style.setProperty("--bwf-bot", top + (parseFloat(inner.style.fontSize) || 0) * 0.92 + "px")
    }
    const schedule = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(fit)
    }
    fit()
    const ro = new ResizeObserver(schedule)
    ro.observe(root)
    let alive = true
    document.fonts?.ready.then(() => alive && schedule())
    return () => {
      alive = false
      cancelAnimationFrame(frame)
      ro.disconnect()
    }
  }, [word, fontSans, wordWeight])

  // Reveal once, the first time the footer is on screen; the beam runs only
  // while it is.
  const [visible, setVisible] = React.useState(false)
  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const io = new IntersectionObserver(
      ([e]) => {
        setVisible(e.isIntersecting)
        if (e.isIntersecting) setSeen(true)
      },
      { threshold: 0.12 },
    )
    io.observe(root)
    return () => io.disconnect()
  }, [])

  const [reduced, setReduced] = React.useState(false)
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const onMq = () => setReduced(mq.matches)
    onMq()
    mq.addEventListener("change", onMq)
    return () => mq.removeEventListener("change", onMq)
  }, [])

  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const set = (b: number, px: number, py: number, g: number) => {
      root.style.setProperty("--bwf-b", b.toFixed(2) + "%")
      root.style.setProperty("--bwf-px", px.toFixed(1) + "px")
      root.style.setProperty("--bwf-py", py.toFixed(1) + "px")
      root.style.setProperty("--bwf-g", g.toFixed(3))
    }
    const still = reduced || !animate
    if (still || !visible) {
      // Hold the beam; the glow still answers the pointer, because it only
      // moves when you do.
      const p = ptr.current
      set(58, p.x, p.y, p.inside ? 1 : 0)
      if (!still) return
      const onMove = () => set(58, ptr.current.x, ptr.current.y, ptr.current.inside ? 1 : 0)
      root.addEventListener("pointermove", onMove)
      root.addEventListener("pointerleave", onMove)
      return () => {
        root.removeEventListener("pointermove", onMove)
        root.removeEventListener("pointerleave", onMove)
      }
    }
    let raf = 0
    let last = performance.now()
    let t = last / 1000
    let b = 58
    let px = ptr.current.x
    let py = ptr.current.y
    let g = 0
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      t += dt
      const p = ptr.current
      const idle = drift(t)
      const target = p.inside ? beamTarget(p.u) * 0.75 + idle * 0.25 : idle
      b = approach(b, target, 0.035, dt)
      px = approach(px, p.x, 0.16, dt)
      py = approach(py, p.y, 0.16, dt)
      g = approach(g, p.inside ? 1 : 0, 0.06, dt)
      set(b, px, py, g)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [reduced, animate, visible])

  const onPointer = (e: React.PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const p = ptr.current
    p.x = e.clientX - r.left
    p.y = e.clientY - r.top
    p.u = r.width ? p.x / r.width : 0.5
    p.inside = e.type !== "pointerleave"
  }

  const hop = (e: React.MouseEvent<HTMLSpanElement>) => {
    if (reduced) return
    const el = e.currentTarget
    el.classList.remove("is-hop")
    void el.offsetWidth
    el.classList.add("is-hop")
  }

  const follow = (e: React.MouseEvent<HTMLAnchorElement>, label: string, href?: string) => {
    // "#" and missing hrefs never touch the host page's URL hash.
    if (!href || href === "#") e.preventDefault()
    onLinkClick?.(label, href)
  }

  const vars = {
    "--bwf-bg": background,
    "--bwf-bg-rgb": hexToRgb(background, "2, 4, 11"),
    "--bwf-ink": ink,
    "--bwf-ink-rgb": hexToRgb(ink, "238, 241, 248"),
    "--bwf-muted": muted,
    "--bwf-acc": hexToRgb(accent),
    "--bwf-lit": hexToRgb(accent),
    "--bwf-wt": wordTop,
    "--bwf-wf": wordFoot,
    "--bwf-sans": fontSans,
    "--bwf-ww": String(wordWeight),
    "--bwf-ang": "118deg",
    "--bwf-b": "58%",
    "--bwf-px": "50%",
    "--bwf-py": "50%",
    "--bwf-g": "0",
    "--bwf-top": "0px",
    "--bwf-bot": "100%",
  } as React.CSSProperties

  const label = company ?? brand + " LLC"
  let d = 0
  const delay = () => ({ "--bwf-d": (d += 70) + "ms" }) as React.CSSProperties

  return (
    <footer
      ref={rootRef}
      className={"bwf " + className}
      style={vars}
      data-in={seen || reduced ? "true" : "false"}
      onPointerMove={onPointer}
      onPointerEnter={onPointer}
      onPointerLeave={onPointer}
    >
      <style>{CSS}</style>
      <div className="bwf-rule" aria-hidden="true" />
      <div className="bwf-sky" aria-hidden="true">
        <div className="bwf-wash" />
        <div className="bwf-bands" />
        <div className="bwf-beam" />
        <div className="bwf-glow" />
        <div className="bwf-grain" />
      </div>

      <div className="bwf-inner">
        <div className="bwf-col">
          <p className="bwf-label" style={delay()}>
            © {year} {label}
          </p>
          {socials.length > 0 && (
            <ul className="bwf-socials">
              {socials.map((s, i) => (
                <li key={s.label + i} className="bwf-fade" style={delay()}>
                  <a
                    className="bwf-soc"
                    href={s.href || "#"}
                    aria-label={s.label}
                    onClick={(e) => follow(e, s.label, s.href)}
                    {...(s.href && /^https?:/.test(s.href) ? { target: "_blank", rel: "noreferrer" } : {})}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      {isIconName(s.icon) ? ICONS[s.icon] : s.icon}
                    </svg>
                    <span className="bwf-tip" aria-hidden="true">
                      {s.label}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
          {credit.length > 0 && (
            <div className="bwf-credits">
              {credit.map((c, i) => (
                <p key={i} className="bwf-fade" style={delay()}>
                  {c.lead}
                  {c.href ? (
                    <a
                      href={c.href}
                      onClick={(e) => follow(e, c.label, c.href)}
                      {...(/^https?:/.test(c.href) ? { target: "_blank", rel: "noreferrer" } : {})}
                    >
                      {c.label}
                    </a>
                  ) : (
                    <b>{c.label}</b>
                  )}
                  {c.tail}
                </p>
              ))}
            </div>
          )}
          {extra}
        </div>

        {columns.map((col, ci) => (
          <nav key={col.title + ci} className="bwf-col" aria-label={col.title}>
            <p className="bwf-label" style={delay()}>
              {col.title}
            </p>
            <ul className="bwf-links">
              {col.links.map((l, li) => (
                <li key={l.label + li} className="bwf-fade" style={delay()}>
                  <a className="bwf-link" href={l.href || "#"} onClick={(e) => follow(e, l.label, l.href)}>
                    <span className="bwf-link-t">{l.label}</span>
                    <Arrow />
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div
        ref={wordRef}
        className="bwf-word"
        style={{ height: size ? wordHeight(size, base, cut) : "calc(" + (0.8 + cut) * 26 + "cqw)" }}
      >
        <p className="sr-only">{word}</p>
        <div className="bwf-word-box">
        <div ref={innerRef} className="bwf-word-in" aria-hidden="true">
          {letters.map((ch, i) => (
            <span key={i} className="bwf-lw" style={{ "--bwf-d": 260 + i * 75 + "ms" } as React.CSSProperties}>
              <span className="bwf-l" onClick={hop} onAnimationEnd={(e) => e.currentTarget.classList.remove("is-hop")}>
                {ch === " " ? " " : ch}
              </span>
            </span>
          ))}
        </div>
        </div>
        <div className="bwf-foot" aria-hidden="true" />
      </div>
    </footer>
  )
}
