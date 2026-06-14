/** @type {import('next').NextConfig} */

// Set default timezone
process.env.TZ = "Asia/Jakarta";

const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
};

export default nextConfig;
