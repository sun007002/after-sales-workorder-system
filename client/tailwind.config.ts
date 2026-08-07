import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  prefix: 'tw-',
  theme: {
    extend: {
      colors: {
        primary: '#1976D2',
        success: '#4CAF50',
        error: '#F44336',
        unpaid: '#FFF0F0',
        unpaidText: '#D32F2F',
      },
      spacing: {
        sidebar: '240px',
        'sidebar-collapsed': '64px',
      },
    },
  },
  plugins: [],
};

export default config;
