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
        // 图2那种深紫色背景
        deepPurple: "#1e1b4b", // 午夜蓝紫
        vibrantPurple: "#7c3aed", // 亮紫色按钮
      },
      backgroundImage: {
        // 头部的大渐变
        'hero-gradient': 'linear-gradient(to bottom, #2e1065, #0f172a)',
        // 按钮流光
        'btn-gradient': 'linear-gradient(90deg, #8b5cf6 0%, #6366f1 100%)',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(124, 58, 237, 0.3)', // 紫色发光效果
      }
    },
  },
  plugins: [],
};
export default config;