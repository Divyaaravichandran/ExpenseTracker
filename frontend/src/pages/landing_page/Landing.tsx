import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { Features } from "./components/Features";
import { HowItWorks } from "./components/HowItWorks";
import { Stats } from "./components/Stats";
import { Footer } from "./components/Footer";
import { CTA } from "./components/CTA";

export const Landing = () => {
  return (
    <div className="min-h-screen bg-[radial-gradient(1100px_600px_at_20%_5%,rgba(37,99,235,0.22),transparent_42%),radial-gradient(900px_560px_at_70%_85%,rgba(34,211,238,0.14),transparent_45%),linear-gradient(135deg,#060d1f_0%,#04122b_45%,#05142d_100%)] text-slate-100">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Stats />
        <CTA />
        <Footer />
      </main>
    </div>
  );
};
