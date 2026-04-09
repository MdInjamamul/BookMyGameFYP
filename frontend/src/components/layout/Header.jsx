import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/logo.png';
import NotificationBell from '../common/NotificationBell';
import { useCart } from '../../context/CartContext';
import CartSidebar from '../shop/CartSidebar';

function Header() {
    const { user, isAuthenticated, logout } = useAuth();
    const { cartItems, setIsCartOpen } = useCart();
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const cartItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

    const handleLogout = () => {
        logout();
        navigate('/');
        setDropdownOpen(false);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="bg-white shadow-sm sticky top-0 z-50">
            <nav className="container-custom py-2">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="flex items-center -ml-10">
                        <img src={logo} alt="BookMyGame" className="h-14 w-auto transform scale-[3.5] origin-left" />
                    </Link>

                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center space-x-8">
                        <Link to="/venues" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                            Find Venues
                        </Link>
                        <Link to="/events" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                            Events
                        </Link>
                        <Link to="/shop" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                            Shop
                        </Link>
                        <Link to="/training" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                            Training Videos
                        </Link>
                        {isAuthenticated && user?.role === 'user' && (
                            <>
                                <Link to="/my-bookings" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                                    My Bookings
                                </Link>
                                <Link to="/my-orders" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                                    My Orders
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Auth Section */}
                    <div className="flex items-center space-x-4">
                        {isAuthenticated ? (
                            // Logged in - Show user menu with dropdown
                            <div className="flex items-center space-x-4">
                                {/* Show operator dashboard link for operators - Desktop only */}
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
                                {/* Show admin panel link for admins only - Desktop only */}
                                {user?.role === 'admin' && (
                                    <Link
                                        to="/admin"
                                        className="hidden sm:flex items-center space-x-1 text-red-600 hover:text-red-700 font-medium transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                        <span>Admin</span>
                                    </Link>
                                )}

                                {/* Cart Icon */}
                                <button
                                    onClick={() => setIsCartOpen(true)}
                                    className="relative p-2 text-gray-500 hover:text-primary-600 transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    {cartItemCount > 0 && (
                                        <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                                            {cartItemCount}
                                        </span>
                                    )}
                                </button>

                                {/* Notification Bell */}
                                <NotificationBell />

                                {/* User Dropdown */}
                                <div className="relative" ref={dropdownRef}>
                                    <button
                                        onClick={() => setDropdownOpen(!dropdownOpen)}
                                        className="flex items-center space-x-2 focus:outline-none"
                                    >
                                        <div className="w-9 h-9 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center overflow-hidden ring-2 ring-transparent hover:ring-primary-200 transition-all">
                                            {user?.profileImage ? (
                                                <img
                                                    src={user.profileImage}
                                                    alt={user?.fullName}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-white font-semibold text-sm">
                                                    {user?.fullName?.charAt(0).toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                        <svg className={`w-4 h-4 text-gray-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {/* Dropdown Menu */}
                                    {dropdownOpen && (
                                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                                            {/* User Info */}
                                            <div className="px-4 py-3 border-b border-gray-100">
                                                <p className="font-medium text-gray-900 truncate">{user?.fullName}</p>
                                                <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                                            </div>

                                            {/* Menu Items */}
                                            <div className="py-2">
                                                {/* Operator Dashboard - Mobile only */}
                                                {(user?.role === 'operator' || user?.role === 'admin') && (
                                                    <Link
                                                        to="/operator"
                                                        onClick={() => setDropdownOpen(false)}
                                                        className="sm:hidden flex items-center gap-3 px-4 py-2 text-primary-600 hover:bg-primary-50 transition-colors"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                                        </svg>
                                                        <span>Dashboard</span>
                                                    </Link>
                                                )}

                                                {/* Admin Panel - Mobile only */}
                                                {user?.role === 'admin' && (
                                                    <Link
                                                        to="/admin"
                                                        onClick={() => setDropdownOpen(false)}
                                                        className="sm:hidden flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                                        </svg>
                                                        <span>Admin Panel</span>
                                                    </Link>
                                                )}

                                                <Link
                                                    to="/settings"
                                                    onClick={() => setDropdownOpen(false)}
                                                    className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                                                >
                                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    <span>Account Settings</span>
                                                </Link>

                                                {/* My Bookings and Orders - for regular users */}
                                                {user?.role === 'user' && (
                                                    <>
                                                        <Link
                                                            to="/my-bookings"
                                                            onClick={() => setDropdownOpen(false)}
                                                            className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                                                        >
                                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                            <span>My Bookings</span>
                                                        </Link>
                                                        <Link
                                                            to="/my-orders"
                                                            onClick={() => setDropdownOpen(false)}
                                                            className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                                                        >
                                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                                            </svg>
                                                            <span>My Orders</span>
                                                        </Link>
                                                    </>
                                                )}
                                            </div>

                                            {/* Logout */}
                                            <div className="border-t border-gray-100 pt-2">
                                                <button
                                                    onClick={handleLogout}
                                                    className="flex items-center gap-3 w-full px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                    </svg>
                                                    <span>Logout</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
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
            <CartSidebar />
        </header>
    );
}

export default Header;
