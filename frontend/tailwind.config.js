/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                accent: '#2563eb',
                'accent-strong': '#1e3a8a',
                'accent-soft': '#eff6ff',
            },
            borderRadius: {
                'lg': '12px',
                'xl': '20px',
            },
        },
    },
    plugins: [],
}
