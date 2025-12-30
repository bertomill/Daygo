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
    ],
  },
}

module.exports = nextConfig
