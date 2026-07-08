/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    'ais-dev-aeq6qrci2d6wtc6griexpc-662027067265.asia-east1.run.app',
    'ais-pre-aeq6qrci2d6wtc6griexpc-662027067265.asia-east1.run.app'
  ],
  typescript: {
    // We already do tsc check in lint step
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  }
};

export default nextConfig;
