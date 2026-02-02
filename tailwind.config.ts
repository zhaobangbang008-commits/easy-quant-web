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
        // 图中那种标志性的紫色
        brand: "#5850ec",
        // 背景不是纯白，是极淡的灰蓝
        sidebarBg: "#f9fafb",
      },
      borderRadius: {
        // 图中的卡片圆角非常大，很润
        'xl': '12px',
        '2xl': '16px',
      },
    },
  },
  plugins: [],
};
export default config;