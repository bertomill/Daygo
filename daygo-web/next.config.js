/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable importing from parent src folder
  transpilePackages: ['../src'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'kwcnpjvhdqwzkmtwypnt.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'pixabay.com',
        pathname: '/**',
      },
    ],
  },
}

module.exports = nextConfig
