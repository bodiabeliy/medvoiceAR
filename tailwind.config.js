/** @type {import('tailwindcss').Config} */

module.exports = {
  content: ["./src/**/*.{ts,tsx,html,js,jsx}"],
    theme: {
    extend: {
      colors: {
        'primary': '#ff49db',
        "green":"#00bba8",
        "green-light": '#80D8C3',
        "pink":"#ff4e8e",
        "yellow-lime":"#ccf600",
        "purpure":"#7b2cbf",
        "hovered-pink":"#dd2d4a",
        "hovered-purpure":"#5a189a",
        "transparent":"transparent",
      },
      fontFamily: {
        'sans': ['Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}