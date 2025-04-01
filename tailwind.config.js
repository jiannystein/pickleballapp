/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            color: '#d1d5db',
            a: {
              color: '#6366f1',
              '&:hover': {
                color: '#818cf8',
              },
            },
            h1: {
              color: '#f9fafb',
            },
            h2: {
              color: '#f3f4f6',
            },
            h3: {
              color: '#e5e7eb',
            },
            strong: {
              color: '#f9fafb',
            },
            blockquote: {
              color: '#e5e7eb',
              borderLeftColor: '#4b5563',
            },
            hr: {
              borderColor: '#374151',
            },
            ul: {
              li: {
                '&::marker': {
                  color: '#6366f1',
                },
              },
            },
            ol: {
              li: {
                '&::marker': {
                  color: '#6366f1',
                },
              },
            },
            code: {
              color: '#e5e7eb',
              backgroundColor: '#374151',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
} 