/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "src/app/**/*.{html,ts}", // Asegura que Tailwind lea todos los archivos .html y .ts dentro de app/
    "./src/app/*.{html,ts}"  // Asegura que Tailwind lea todos los archivos .html y .ts dentro de app/
  ],
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 0.8s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      colors: {
        primary: '#1E3A8A',   // Tu color primario
        secondary: '#9333EA',  // Tu color secundario
        accent: '#F59E0B',     // Otro color, si lo necesitas
        neutral: '#64748B',    // Color neutral
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Cambia la fuente global
        heading: ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

