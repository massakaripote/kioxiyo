const colors = require('tailwindcss/colors');

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // slate（青みがかったグレー・紺色寄り）を neutral（純粋な無彩色グレー）にマッピング
        slate: colors.neutral,
        kioxiyo: {
          master: '#EF4444',     // 赤：マスター
          learning: '#3B82F6',   // 青：出題済み・未習得
          unseen: '#E5E5E5',     // 白・無彩色グレー：未出題
          primary: '#2563EB',
          accent: '#F59E0B',
          surface: '#FAFAFA',
          darkSurface: '#171717', // 無彩色ダークグレー
        }
      },
      fontFamily: {
        sans: [
          '"Hiragino Kaku Gothic ProN"',
          '"Noto Sans JP"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}

