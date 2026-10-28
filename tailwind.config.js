/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Text that switches with the theme (CSS variables in index.css).
        fg: "rgb(var(--fg) / <alpha-value>)",
        "fg-muted": "rgb(var(--fg-muted) / <alpha-value>)",
        "fg-subtle": "rgb(var(--fg-subtle) / <alpha-value>)",
        // The blue-grey neutrals, lightest to darkest. 900 is the brand ink.
        ink: {
          25: "#F9FCFF",
          30: "#F3F7FC",
          35: "#F5F7FA",
          40: "#EEF3FF",
          45: "#F1F4F8",
          50: "#F1F3F7",
          55: "#EDF2F8",
          60: "#EEF2F7",
          65: "#EEF1F5",
          70: "#E7EDF6",
          85: "#E2E8F1",
          90: "#E3E8EF",
          95: "#E0E7F0",
          120: "#D8DFE9",
          130: "#D7DFE5",
          145: "#D0D8E3",
          165: "#C9D3E0",
          170: "#C9D2DE",
          225: "#B9C4D2",
          230: "#B8C3D1",
          235: "#B8C2CF",
          325: "#9BAABD",
          425: "#87909D",
          545: "#647184",
          605: "#566273",
          640: "#4A5A6E",
          710: "#39485B",
          715: "#3B4656",
          720: "#3A4657",
          780: "#2B3646",
          790: "#273444",
          805: "#243040",
          810: "#223042",
          815: "#1C2A45",
          820: "#202C3C",
          825: "#1F2B3A",
          830: "#1F2A3A",
          835: "#1D2938",
          850: "#1A2533",
          865: "#17212F",
          875: "#141D2B",
          895: "#111924",
          900: "#101723",
          925: "#0B111B",
        },
      },
      fontFamily: {
        // Headings. Plus Jakarta Sans is free (SIL Open Font License), from Google Fonts.
        display: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Display & Hero
        hero: ['clamp(3rem, 5vw + 1rem, 4.5rem)', { lineHeight: '1.1', fontWeight: '500', letterSpacing: '-0.02em' }],
        display: ['48px', { lineHeight: '1.1', fontWeight: '500', letterSpacing: '-0.02em' }],
        // Headings
        h1: ['36px', { lineHeight: '1.2', fontWeight: '500' }],
        h2: ['28px', { lineHeight: '1.25', fontWeight: '500' }],
        h3: ['22px', { lineHeight: '1.3', fontWeight: '500' }],
        // Body
        'body-lg': ['18px', { lineHeight: '1.6', fontWeight: '400' }],
        body: ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-sm': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        caption: ['12px', { lineHeight: '1.4', fontWeight: '400' }],
        // UI
        button: ['14px', { lineHeight: '1.4', fontWeight: '500' }],
        label: ['14px', { lineHeight: '1.4', fontWeight: '500' }],
      },
      animation: {
        bounce: "bounce 1.3s infinite",
        marquee: "marquee 45s linear infinite",
      },
      keyframes: {
        bounce: {
          "0%, 100%": {
            transform: "translateY(0)",
            animationTimingFunction: "cubic-bezier(0.8, 0, 1, 1)",
          },
          "50%": {
            transform: "translateY(-25%)",
            animationTimingFunction: "cubic-bezier(0, 0, 0.2, 1)",
          },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
    },
  },
  plugins: [],
  darkMode: "class",
};

