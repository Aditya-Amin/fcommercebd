/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "images.unsplash.com" },
      // Local Laravel — for product images uploaded via /api/products/upload-image
      { protocol: "http", hostname: "localhost", port: "8000" },
      // Facebook CDN — for FB page profile pictures (subdomains rotate)
      { protocol: "https", hostname: "**.fbcdn.net" }
    ]
  }
};

export default nextConfig;
