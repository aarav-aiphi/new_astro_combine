/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  output: 'standalone',
  images: {
    unoptimized: true, // Disable image optimization for static export
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn-icons-png.flaticon.com' },
      { protocol: 'https', hostname: 'img.freepik.com' },
      { protocol: 'https', hostname: 'srcs.unsplash.com' },
      { protocol: 'https', hostname: 'cdn.pixabay.com' },
      { protocol: 'https', hostname: 'pujayagna.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'i.pinimg.com' },
      { protocol: 'https', hostname: 'www.indastro.com' },
      { protocol: 'https', hostname: 'i.ibb.co' }
    ],
  },
  env: {
    API_URL: process.env.API_URL || '/api/v1',
    SOCKET_URL: process.env.NODE_ENV === 'development' 
      ? 'http://localhost:7000' 
      : undefined,
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://127.0.0.1:7000/api/v1/:path*',
      },
      {
        source: '/socket.io/',
        destination: 'http://127.0.0.1:7000/socket.io/',
      },
      {
        source: '/socket.io/:path*',
        destination: 'http://127.0.0.1:7000/socket.io/:path*',
      },
    ];
  },  
};

export default nextConfig;
