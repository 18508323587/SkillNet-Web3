/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // 包含所有 tsx 文件
  ],
  theme: {
    extend: {
      colors: {
        // 自定义一组高大上的科技色调
        brand: {
          dark: '#0f172a',    // 深蓝底色
          light: '#f1f5f9',   // 浅灰文字
          accent: '#38bdf8',  // 天蓝点缀
          purple: '#c084fc',  // 紫色点缀
        }
      },
      backgroundImage: {
        // 定义一个炫酷的渐变背景
        'hero-pattern': "linear-gradient(to bottom right, #0f172a, #1e293b)",
      }
    },
  },
  plugins: [],
}