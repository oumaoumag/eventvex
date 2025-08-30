/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: './out',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  assetPrefix: process.env.NODE_ENV === 'production' ? '/eventvex' : '',
  basePath: process.env.NODE_ENV === 'production' ? '/eventvex' : '',
  experimental: {
    esmExternals: true
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
}

export default nextConfig
