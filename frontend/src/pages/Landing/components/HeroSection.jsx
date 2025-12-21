import SearchBar from './SearchBar';

function HeroSection() {
    return (
        <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-600 text-white overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }} />
            </div>

            <div className="container-custom relative z-10 py-20 md:py-32">
                <div className="max-w-4xl mx-auto text-center">
                    {/* Heading */}
                    <h1 className="font-heading font-bold text-4xl md:text-6xl lg:text-7xl mb-6 animate-fade-in">
                        Find & Book Your
                        <span className="block mt-2">Perfect Sports Venue</span>
                    </h1>

                    {/* Subtitle */}
                    <p className="text-lg md:text-xl text-primary-100 mb-12 max-w-2xl mx-auto">
                        Discover and book football, basketball, and cricket courts near you.
                        Easy booking, secure payment, instant confirmation.
                    </p>

                    {/* Search Bar */}
                    <SearchBar />

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-6 mt-16 max-w-2xl mx-auto">
                        <div className="text-center">
                            <div className="font-heading font-bold text-3xl md:text-4xl mb-1">500+</div>
                            <div className="text-primary-200 text-sm md:text-base">Venues</div>
                        </div>
                        <div className="text-center">
                            <div className="font-heading font-bold text-3xl md:text-4xl mb-1">10K+</div>
                            <div className="text-primary-200 text-sm md:text-base">Bookings</div>
                        </div>
                        <div className="text-center">
                            <div className="font-heading font-bold text-3xl md:text-4xl mb-1">50+</div>
                            <div className="text-primary-200 text-sm md:text-base">Cities</div>
                        </div>
                    </div>

                    {/* Scroll Indicator */}
                    <div className="mt-12 flex flex-col items-center animate-bounce">
                        <span className="text-primary-200 text-sm mb-2">Scroll to explore</span>
                        <svg
                            className="w-6 h-6 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Wave Shape Divider */}
            <div className="absolute bottom-0 left-0 right-0">
                <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 0L60 10C120 20 240 40 360 46.7C480 53 600 47 720 43.3C840 40 960 40 1080 46.7C1200 53 1320 67 1380 73.3L1440 80V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z" fill="#F9FAFB" />
                </svg>
            </div>
        </section>
    );
}

export default HeroSection;
