import { CallOut } from "@/components/CallOut";
import { Hero } from "@/components/Hero";
import { HowItGoes } from "@/components/HowItGoes";
import { InviteSection } from "@/components/InviteSection";
import { PowerCards } from "@/components/PowerCards";
import { SiteFooter } from "@/components/SiteFooter";

export default function Home() {
  return (
    <>
      <Hero />
      <main>
        <InviteSection />
        <PowerCards />
        <HowItGoes />
        <CallOut />
      </main>
      <SiteFooter />
    </>
  );
}
