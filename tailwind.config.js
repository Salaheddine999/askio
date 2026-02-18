/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Instrument Serif"', 'serif'],
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
      },
    },
  },
  plugins: [],
  darkMode: "class",
};

