// tailwind.config.ts
const config: Config = {
  theme: {
    extend: {
      colors: {
        'brand-purple': '#7c3aed', // 主紫色按钮
        'brand-light-purple': '#f5f3ff', // 浅紫色背景
        'sidebar-bg': '#f9fafb', // 极浅灰侧边栏
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      }
    },
  },
}