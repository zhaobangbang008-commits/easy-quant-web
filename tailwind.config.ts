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
        // 你的品牌主色
        brand: {
          light: '#8b5cf6', // 浅紫
          DEFAULT: '#7c3aed', // 标准紫
          dark: '#6d28d9', // 深紫
        }
      },
      backgroundImage: {
        // 定义一个“午夜深蓝”的侧边栏渐变，比纯黑更有质感
        'sidebar-gradient': 'linear-gradient(to bottom, #0f172a, #1e1b4b)', 
        // 按钮的流光渐变
        'brand-gradient': 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
      }
    },
  },
  plugins: [],
};
export default config;