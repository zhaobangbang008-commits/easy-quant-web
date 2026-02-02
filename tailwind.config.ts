import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // 定义参考图里的高级紫和背景灰
        primary: "#7c3aed", 
        bgLight: "#f9fafb",
      },
    },
  },
  plugins: [],
};
export default config;