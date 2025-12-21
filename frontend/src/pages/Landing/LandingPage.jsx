import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import HeroSection from './components/HeroSection';
import SearchBar from './components/SearchBar';
import SportsCategories from './components/SportsCategories';
import FeaturedVenues from './components/FeaturedVenues';
import UpcomingEvents from './components/UpcomingEvents';
import GearMarketplace from './components/GearMarketplace';
import HowItWorks from './components/HowItWorks';

function LandingPage() {
    return (
        <div className="min-h-screen flex flex-col">
            <Header />

            <main className="flex-1">
                {/* Hero Section with Search */}
                <HeroSection />

                {/* Sports Categories */}
                <SportsCategories />

                {/* Featured Venues */}
                <FeaturedVenues />

                {/* Upcoming Events */}
                <UpcomingEvents />

                {/* Sports Gear Marketplace */}
                <GearMarketplace />

                {/* How It Works */}
                <HowItWorks />
            </main>

            <Footer />
        </div>
    );
}

export default LandingPage;
