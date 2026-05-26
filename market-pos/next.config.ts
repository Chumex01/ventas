/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ignora errores de tipeo de TypeScript al hacer build
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;