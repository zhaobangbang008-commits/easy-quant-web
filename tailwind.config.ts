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
        // 参考图里的那个高级紫色
        brand: "#7c3aed", 
        // 背景色不是纯白，是极淡的灰，这样白色卡片才能浮出来
        bgBase: "#f8fafc", 
      },
      boxShadow: {
        // 这种阴影叫“弥散光”，看起来很软，没有黑边
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.06)',
        'floating': '0 10px 40px -10px rgba(124, 58, 237, 0.15)',
      }
    },
  },
  plugins: [],
};
export default config;