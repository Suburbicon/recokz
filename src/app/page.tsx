import { Header } from "@/app/_ui/header";
import { HeroSection } from "@/app/_ui/hero";
import { AboutSection } from "@/app/_ui/about";
import { HowItWorksSection } from "@/app/_ui/how-it-works";
import { TrialFormSection } from "@/app/_ui/trial-form";
import { PricingSection } from "@/app/_ui/pricing";
import { TrialV2FormSection } from "@/app/_ui/trial-v2-form";
import { Footer } from "@/app/_ui/footer";

export default function Home() {
  return (
    <div>
      <Header />
      <HeroSection />
      <AboutSection />
      <HowItWorksSection />
      <TrialFormSection />
      <PricingSection />
      <TrialV2FormSection />
      <Footer />
    </div>
  );
}
