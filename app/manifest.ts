import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Guided Movement Session",
    short_name: "Movement",
    description: "Privacy-first guided movement and conversation sessions",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f7f9",
    theme_color: "#16324f",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
