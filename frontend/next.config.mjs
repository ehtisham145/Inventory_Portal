/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Required for the production Docker image (Dockerfile.prod uses the standalone server.js)
  output: "standalone",
};

export default nextConfig;
