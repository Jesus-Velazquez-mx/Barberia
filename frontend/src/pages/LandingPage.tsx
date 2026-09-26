import { Header } from '../components/landing/Header';
import { Hero } from '../components/landing/Hero';
import { Services } from '../components/landing/Services';
import { SectionDivider } from '../components/landing/SectionDivider';
import { About } from '../components/landing/About';
import { Team } from '../components/landing/Team';
import { Gallery } from '../components/landing/Gallery';
import { Locations } from '../components/landing/Locations';
import { Footer } from '../components/landing/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#141414] font-sans">
      <Header />
      <Hero />
      <Services />
      <SectionDivider />
      <About />
      <SectionDivider />
      <Team />
      <Gallery />
      <Locations />
      <Footer />
    </div>
  );
}
