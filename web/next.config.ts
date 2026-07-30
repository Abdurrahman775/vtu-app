import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Lets devices on the LAN (e.g. a phone testing the mobile app, or
  // another laptop hitting the admin dashboard) load dev-only resources
  // like the HMR websocket — otherwise Next.js blocks cross-origin dev
  // requests by default. Update this if the machine's LAN IP changes.
  allowedDevOrigins: ["192.168.100.14"],
};

export default nextConfig;
