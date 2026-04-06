import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import paymentService from '../../services/paymentService';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';

function PaymentCallback() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('verifying'); // verifying, success, failed
    const [message, setMessage] = useState('Verifying your payment...');
    const [paymentData, setPaymentData] = useState(null);
    const [showDetails, setShowDetails] = useState(false);

    // Detect whether this is an event registration payment
    const paymentType = searchParams.get('type'); // 'event' | null (venue booking)

    useEffect(() => {
        const verifyPayment = async () => {
            try {
                // Get Khalti callback parameters
                const pidx = searchParams.get('pidx');
                const txnId = searchParams.get('transaction_id');
                const khaltiStatus = searchParams.get('status');
                const purchaseOrderId = searchParams.get('purchase_order_id');

                if (!pidx) {
                    setStatus('failed');
                    setMessage('Invalid payment callback. Missing payment identifier.');
                    return;
                }

                // Verify payment with backend
                const data = await paymentService.verifyPayment({
                    pidx,
                    transaction_id: txnId,
                    status: khaltiStatus,
                    purchase_order_id: purchaseOrderId
                });

                if (data.success && data.data.status === 'completed') {
                    setStatus('success');
                    setMessage(
                        paymentType === 'event'
                            ? 'Payment successful! Your event registration is confirmed.'
                            : 'Payment successful! Your booking is confirmed.'
                    );
                    setPaymentData(data.data);

                    // Clear cart from localStorage
                    localStorage.removeItem('bookingCart');
                    sessionStorage.removeItem('pendingBooking');
                } else {
                    // Both 'pending' (Khalti server issue) and 'failed' are treated as failed.
                    // The backend has already cleaned up any pending bookings/registrations.
                    setStatus('failed');
                    setMessage(data.message || 'Payment could not be completed. Any pending booking has been cancelled.');
                }
            } catch (error) {
                console.error('Payment verification error:', error);
                // Even on network error, backend attempted cleanup of pending records.
                setStatus('failed');
                setMessage(
                    error.response?.data?.message ||
                    'Payment verification failed. Any pending booking has been cancelled. Please try again.'
                );
            }
        };

        verifyPayment();
    }, [searchParams]);

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="container-custom py-16">
                <div className="max-w-lg mx-auto bg-white rounded-xl p-8 shadow-soft text-center">
                    {status === 'verifying' && (
                        <>
                            <div className="animate-spin w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-6"></div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifying Payment</h1>
                            <p className="text-gray-600">{message}</p>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-bold text-green-600 mb-2">Payment Successful!</h1>
                            <p className="text-gray-600 mb-6">{message}</p>

                            {/* Payment Details Panel */}
                            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                                <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Payment Details</h2>
                                <div className="space-y-2">
                                    {paymentData?.transactionId && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Transaction ID</span>
                                            <span className="font-mono text-gray-800 text-xs break-all max-w-[180px] text-right">{paymentData.transactionId}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Payment Method</span>
                                        <span className="font-medium text-gray-800">Khalti</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Status</span>
                                        <span className="font-medium text-green-600">✓ Completed</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Type</span>
                                        <span className="font-medium text-gray-800">{paymentType === 'event' ? 'Event Registration' : 'Venue Booking'}</span>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400 mt-3">📧 A receipt has been sent to your email.</p>
                            </div>

                            <div className="space-y-3">
                                {paymentType === 'event' ? (
                                    <>
                                        <Link
                                            to="/my-registrations"
                                            className="block w-full py-3 rounded-lg font-semibold btn-primary"
                                        >
                                            View Payment Details
                                        </Link>
                                        <Link
                                            to="/events"
                                            className="block w-full py-3 text-gray-600 hover:text-gray-900 transition-colors"
                                        >
                                            Browse More Events
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        <Link
                                            to="/my-bookings"
                                            className="block w-full py-3 rounded-lg font-semibold btn-primary"
                                        >
                                            View Payment Details
                                        </Link>
                                        <Link
                                            to="/venues"
                                            className="block w-full py-3 text-gray-600 hover:text-gray-900 transition-colors"
                                        >
                                            Browse More Venues
                                        </Link>
                                    </>
                                )}
                            </div>
                        </>
                    )}

                    {status === 'failed' && (
                        <>
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-bold text-red-600 mb-2">Payment Failed</h1>
                            <p className="text-gray-600 mb-2">{message}</p>
                            <p className="text-sm text-gray-400 mb-6">No charges have been made. Your slot is now available again.</p>

                            <div className="space-y-3">
                                {paymentType === 'event' ? (
                                    <>
                                        <Link
                                            to="/events"
                                            className="block w-full py-3 rounded-lg font-semibold btn-primary"
                                        >
                                            Browse Events
                                        </Link>
                                        <button
                                            onClick={() => navigate(-1)}
                                            className="block w-full py-3 text-gray-600 hover:text-gray-900 transition-colors"
                                        >
                                            Try Again
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Link
                                            to="/venues"
                                            className="block w-full py-3 rounded-lg font-semibold btn-primary"
                                        >
                                            Browse Venues
                                        </Link>
                                        <button
                                            onClick={() => navigate(-1)}
                                            className="block w-full py-3 text-gray-600 hover:text-gray-900 transition-colors"
                                        >
                                            Try Again
                                        </button>
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default PaymentCallback;
