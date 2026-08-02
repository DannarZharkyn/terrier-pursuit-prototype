/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/organizer/login",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
