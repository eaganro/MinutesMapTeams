import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // /players/2544-lebron-james -> /players/2544 (see src/lib/player-path.ts).
  async rewrites() {
    return [
      {
        source: "/players/:playerId(\\d+)-:slug([^/]+)",
        destination: "/players/:playerId",
      },
      {
        source: "/players/:playerId(\\d+)-:slug([^/]+)/:season",
        destination: "/players/:playerId/:season",
      },
    ];
  },
};

export default nextConfig;
