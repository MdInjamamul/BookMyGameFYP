import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// Mock gear data - will be replaced with API call
const mockGear = [
    {
        id: 1,
        name: 'Professional Football',
        category: 'Football',
        price: 2500,
        originalPrice: 3000,
        image: 'https://images.unsplash.com/photo-1614632537423-1e6c2e7e0aab?w=500',
        rating: 4.8,
        reviews: 124,
        isNew: true,
    },
    {
        id: 2,
        name: 'Basketball Shoes Pro',
        category: 'Basketball',
        price: 8500,
        originalPrice: 10000,
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
        rating: 4.9,
        reviews: 89,
        isNew: false,
    },
    {
        id: 3,
        name: 'Cricket Bat - Premium',
        category: 'Cricket',
        price: 12000,
        originalPrice: 15000,
        image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=500',
        rating: 4.7,
        reviews: 56,
        isNew: true,
    },
    {
        id: 4,
        name: 'Sports Training Kit',
        category: 'Training',
        price: 4500,
        originalPrice: 5500,
        image: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=500',
        rating: 4.6,
        reviews: 203,
        isNew: false,
    },
];

function GearMarketplace() {
    const [gear, setGear] = useState([]);

    useEffect(() => {
        // TODO: Replace with actual API call
        setGear(mockGear);
    }, []);

    if (gear.length === 0) return null;

    return (
        <section className="py-16 md:py-24 bg-white">
            <div className="container-custom">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                        <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                    </div>
                    <h2 className="font-heading font-bold text-3xl md:text-4xl text-gray-900 mb-4">
                        Sports Gear Marketplace
                    </h2>
                    <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                        Shop premium sports equipment and gear from trusted brands
                    </p>
                </div>

                {/* Gear Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {gear.map((item) => (
                        <Link
                            key={item.id}
                            to={`/shop/${item.id}`}
                            className="card group hover:-translate-y-2 p-0 overflow-hidden"
                        >
                            {/* Image */}
                            <div className="relative h-48 overflow-hidden bg-gray-100">
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                                {item.isNew && (
                                    <div className="absolute top-3 left-3 bg-green-500 text-white px-2 py-1 rounded-md text-xs font-semibold">
                                        NEW
                                    </div>
                                )}
                                {item.originalPrice > item.price && (
                                    <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-semibold">
                                        -{Math.round((1 - item.price / item.originalPrice) * 100)}%
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="p-4">
                                <span className="text-xs text-primary-600 font-medium uppercase tracking-wide">
                                    {item.category}
                                </span>
                                <h3 className="font-heading font-semibold text-gray-900 mt-1 mb-2 line-clamp-1">
                                    {item.name}
                                </h3>

                                {/* Rating */}
                                <div className="flex items-center mb-3">
                                    <div className="flex items-center">
                                        {[...Array(5)].map((_, i) => (
                                            <svg
                                                key={i}
                                                className={`w-4 h-4 ${i < Math.floor(item.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                            >
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        ))}
                                    </div>
                                    <span className="text-xs text-gray-500 ml-2">({item.reviews})</span>
                                </div>

                                {/* Price */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-baseline gap-2">
                                        <span className="font-bold text-lg text-gray-900">
                                            Rs. {item.price.toLocaleString()}
                                        </span>
                                        {item.originalPrice > item.price && (
                                            <span className="text-sm text-gray-400 line-through">
                                                Rs. {item.originalPrice.toLocaleString()}
                                            </span>
                                        )}
                                    </div>
                                    <button className="p-2 rounded-full bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* View All CTA */}
                <div className="text-center mt-10">
                    <Link
                        to="/shop"
                        className="btn-primary inline-flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        Browse All Gear
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>
                </div>
            </div>
        </section>
    );
}

export default GearMarketplace;
