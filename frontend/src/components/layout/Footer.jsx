import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BiSupport } from 'react-icons/bi';

function Footer() {
    const { user, isAuthenticated } = useAuth();

    // Show Support block for regular users; show Venue Owners block for guests/operators/admins
    const isRegularUser = isAuthenticated && user?.role === 'user';

    return (
        <footer className="bg-gray-900 text-white">
            <div className="container-custom py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

                    {/* Company Info */}
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center space-x-2 mb-4">
                            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-xl">BG</span>
                            </div>
                            <span className="font-heading font-bold text-2xl">
                                BookMyGame
                            </span>
                        </div>
                        <p className="text-gray-400 mb-4 max-w-md">
                            Your one-stop platform for booking sports venues. Find and book football, basketball,
                            and cricket courts near you.
                        </p>
                        <div className="flex space-x-4">
                            <a href="#" className="text-gray-400 hover:text-white transition-colors">
                                <i className="fab fa-facebook-f"></i>
                            </a>
                            <a href="#" className="text-gray-400 hover:text-white transition-colors">
                                <i className="fab fa-twitter"></i>
                            </a>
                            <a href="#" className="text-gray-400 hover:text-white transition-colors">
                                <i className="fab fa-instagram"></i>
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="font-heading font-semibold mb-4">Quick Links</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link to="/venues" className="text-gray-400 hover:text-white transition-colors">
                                    Find Venues
                                </Link>
                            </li>
                            <li>
                                <Link to="/contact" className="text-gray-400 hover:text-white transition-colors">
                                    Contact
                                </Link>
                            </li>
                            <li>
                                <Link to="/faq" className="text-gray-400 hover:text-white transition-colors">
                                    FAQ
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Conditional 4th column */}
                    {isRegularUser ? (
                        /* Support column — shown to regular logged-in users */
                        <div>
                            <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
                                <BiSupport className="w-5 h-5 text-primary-400 text-lg" />
                                Support
                            </h3>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3">
                                    <svg className="w-4 h-4 text-primary-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <a href="mailto:injamamulhaque767@gmail.com" className="text-gray-400 hover:text-white transition-colors text-sm break-all">
                                        injamamulhaque767@gmail.com
                                    </a>
                                </li>
                                <li className="flex items-start gap-3">
                                    <svg className="w-4 h-4 text-primary-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    <a href="tel:+9779814797363" className="text-gray-400 hover:text-white transition-colors text-sm">
                                        +977 9814797363
                                    </a>
                                </li>
                                <li className="flex items-start gap-3">
                                    <svg className="w-4 h-4 text-primary-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    <Link to="/contact" className="text-gray-400 hover:text-white transition-colors text-sm">
                                        Send us a message
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    ) : (isAuthenticated && (user?.role === 'operator' || user?.role === 'admin')) ? (
                        /* For Logged-in Operators / Admins */
                        <div>
                            <h3 className="font-heading font-semibold mb-4">Operator Panel</h3>
                            <ul className="space-y-2">
                                <li>
                                    <Link to="/operator" className="text-gray-400 hover:text-white transition-colors">
                                        My Dashboard
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/operator/venues/new" className="text-gray-400 hover:text-white transition-colors">
                                        Add New Venue
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/operator/bookings" className="text-gray-400 hover:text-white transition-colors">
                                        View Bookings
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    ) : (
                        /* For Venue Owners — shown to guests */
                        <div>
                            <h3 className="font-heading font-semibold mb-4">For Venue Owners</h3>
                            <ul className="space-y-2">
                                <li>
                                    <Link to="/login" className="text-gray-400 hover:text-white transition-colors">
                                        List Your Venue
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/login" className="text-gray-400 hover:text-white transition-colors">
                                        Owner Dashboard
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    )}
                </div>

                {/* Bottom bar — Terms & Privacy always visible */}
                <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-gray-400 text-sm">
                    <p>&copy; {new Date().getFullYear()} BookMyGame. All rights reserved.</p>
                    <div className="flex items-center gap-4">
                        <Link to="/terms" className="hover:text-white transition-colors">
                            Terms &amp; Conditions
                        </Link>
                        <span className="text-gray-700">|</span>
                        <Link to="/privacy" className="hover:text-white transition-colors">
                            Privacy Policy
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
