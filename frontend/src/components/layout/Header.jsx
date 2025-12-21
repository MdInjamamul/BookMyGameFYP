import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function Header() {
    const { user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <header className="bg-white shadow-sm sticky top-0 z-50">
            <nav className="container-custom py-4">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-2">
                        <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-xl">BG</span>
                        </div>
                        <span className="font-heading font-bold text-2xl text-gray-900">
                            BookMyGame
                        </span>
                    </Link>

                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center space-x-8">
                        <Link to="/venues" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                            Find Venues
                        </Link>
                        <Link to="/about" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                            How It Works
                        </Link>
                        <Link to="/contact" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                            Contact
                        </Link>
                    </div>

                    {/* Auth Section */}
                    <div className="flex items-center space-x-4">
                        {isAuthenticated ? (
                            // Logged in - Show user menu
                            <div className="flex items-center space-x-4">
                                {/* Show operator dashboard link for operators */}
                                {(user?.role === 'operator' || user?.role === 'admin') && (
                                    <Link
                                        to="/operator"
                                        className="hidden sm:flex items-center space-x-1 text-primary-600 hover:text-primary-700 font-medium transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                        </svg>
                                        <span>Dashboard</span>
                                    </Link>
                                )}
                                <div className="flex items-center space-x-2">
                                    <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center">
                                        <span className="text-white font-semibold text-sm">
                                            {user?.fullName?.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <span className="text-gray-700 font-medium hidden sm:inline">
                                        {user?.fullName}
                                    </span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="text-gray-700 hover:text-red-600 font-medium transition-colors"
                                >
                                    Logout
                                </button>
                            </div>
                        ) : (
                            // Not logged in - Show login/signup
                            <>
                                <Link to="/login" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                                    Log In
                                </Link>
                                <Link to="/signup" className="btn-primary">
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>
        </header>
    );
}

export default Header;
