import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import BranchSection from "../components/BranchSection";
import Footer from "../components/Footer";

function Home() {
  return (
    <>
      {/* Header from Emerald Horizon */}
      <Navbar />

      <main>
        {/* Hero Section from Emerald Horizon */}
        <Hero />

        {/* 3D Academic Department Cards (Matched to Emerald Horizon Theme) with Ambition Statement */}
        <BranchSection />
      </main>

      {/* Footer from Emerald Horizon */}
      <Footer />
    </>
  );
}

export default Home;