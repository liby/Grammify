/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.optimization.minimize = false;
    return config;
  },
  images: {
    unoptimized: true,
  },
  
}

module.exports = nextConfig
