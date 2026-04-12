import { useLocation } from 'wouter';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LandingPage from '@/components/LandingPage';

export default function Home() {
  const [, setLocation] = useLocation();

  const handleBackToLanding = () => {
    setLocation('/');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header onLogoClick={handleBackToLanding} />

      <main id="main-content" className="flex-1" role="main">
        <LandingPage />
      </main>

      <Footer />
    </div>
  );
}
