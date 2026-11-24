import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

/** Lets players "Add to Home Screen" so Kadi Night opens like an app on their phone. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: site.name,
    description: site.description,
    start_url: "/",
    display: "standalone",
    background_color: "#F1FBEA",
    theme_color: "#B9F0A0",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
