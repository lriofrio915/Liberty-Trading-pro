/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['res.cloudinary.com'],
  },
  async headers() {
    return [
      {
        source: '/dashboard/monitor',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-src 'self' https://worldmonitor.app",
          },
        ],
      },
    ]
  },
}

export default nextConfig
