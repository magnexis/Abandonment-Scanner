/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        githubDark: "#0d1117",
        githubBorder: "#30363d",
        githubGreen: "#2ea44f",
      },
    },
  },
  plugins: [],
};