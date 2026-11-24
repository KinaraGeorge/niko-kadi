/** Site-wide constants. Swap the placeholder domain once the VPS has a real one. */
export const site = {
  name: "Kadi Night",
  tagline: "Niko kadi! Kenyan poker with your people.",
  description:
    "Invite your friends to an online game of Kadi (Kenyan poker). Share one code and everyone is at the table in seconds. Free to play, no real money.",
  // Placeholder: set NEXT_PUBLIC_SITE_URL when the domain is live.
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://kadinight.app",
  maxSeats: 6,
} as const;
