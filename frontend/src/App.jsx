import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import LandingPage from './pages/Landing/LandingPage';
import LoginPage from './pages/Auth/LoginPage';
import SignupPage from './pages/Auth/SignupPage';
import VerifyEmailPage from './pages/Auth/VerifyEmailPage';
import ForgotPasswordPage from './pages/Auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/Auth/ResetPasswordPage';
import VenueSearchResults from './pages/Venues/VenueSearchResults';
import VenueDetail from './pages/Venues/VenueDetail';
import EventCalendar from './pages/Events/EventCalendar';
import EventDetail from './pages/Events/EventDetail';
import ShopPage from './pages/Shop/ShopPage';
import ProductDetail from './pages/Shop/ProductDetail';
import Checkout from './pages/Shop/Checkout';
import TrainingVideos from './pages/Training/TrainingVideos';

// User imports
import UserSettings from './pages/User/UserSettings';
import MyBookings from './pages/User/MyBookings';
import UserBookingDetail from './pages/User/UserBookingDetail';
import MyEvents from './pages/User/MyEvents';
import MyOrders from './pages/User/MyOrders';
import UserOrderDetail from './pages/User/UserOrderDetail';

// Booking imports
import BookingPage from './pages/Booking/BookingPage';
import BookingCheckout from './pages/Booking/BookingCheckout';
import BookingSuccess from './pages/Booking/BookingSuccess';
import PaymentCallback from './pages/Payment/PaymentCallback';

// Operator imports
import ProtectedRoute from './components/auth/ProtectedRoute';
import OperatorLayout from './components/layout/OperatorLayout';
import OperatorDashboard from './pages/Operator/OperatorDashboard';
import VenueListings from './pages/Operator/VenueListings';
import AddEditVenue from './pages/Operator/AddEditVenue';
import VenueDetails from './pages/Operator/VenueDetails';
import ManageBookings from './pages/Operator/ManageBookings';
import BookingDetail from './pages/Operator/BookingDetail';
import BookingCalendar from './pages/Operator/BookingCalendar';
import OperatorSettings from './pages/Operator/OperatorSettings';
import EventListings from './pages/Operator/EventListings';
import AddEditEvent from './pages/Operator/AddEditEvent';
import EventRegistrations from './pages/Operator/EventRegistrations';
import OperatorProducts from './pages/Operator/OperatorProducts';
import AddEditProduct from './pages/Operator/AddEditProduct';
import ManageOrders from './pages/Operator/ManageOrders';
import OperatorOrderDetail from './pages/Operator/OperatorOrderDetail';
import ManageReviews from './pages/Operator/ManageReviews';
import OperatorTrainingVideos from './pages/Operator/OperatorTrainingVideos';

// Admin imports
import AdminLayout from './components/layout/AdminLayout';
import AdminDashboard from './pages/Admin/AdminDashboard';
import PendingVenues from './pages/Admin/PendingVenues';
import AllVenues from './pages/Admin/AllVenues';
import VenueApproval from './pages/Admin/VenueApproval';
import UserManagement from './pages/Admin/UserManagement';
import AdminProducts from './pages/Admin/AdminProducts';
import SellerRequests from './pages/Admin/SellerRequests';
import AdminTrainingVideos from './pages/Admin/AdminTrainingVideos';
import FlaggedReviews from './pages/Admin/FlaggedReviews';

function App() {
    return (
        <AuthProvider>
            <CartProvider>
                <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                    <div className="App">
                        <Toaster position="top-right" />
                        <Routes>
                        {/* Public Routes */}
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/signup" element={<SignupPage />} />
                        <Route path="/verify-email" element={<VerifyEmailPage />} />
                        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                        <Route path="/reset-password" element={<ResetPasswordPage />} />
                        <Route path="/venues" element={<VenueSearchResults />} />
                        <Route path="/venues/:id" element={<VenueDetail />} />
                        <Route path="/events" element={<EventCalendar />} />
                        <Route path="/events/:id" element={<EventDetail />} />
                        <Route path="/shop" element={<ShopPage />} />
                        <Route path="/shop/:id" element={<ProductDetail />} />
                        <Route path="/training" element={<TrainingVideos />} />

                        {/* User Settings Route - All authenticated users */}
                        <Route
                            path="/settings"
                            element={
                                <ProtectedRoute>
                                    <UserSettings />
                                </ProtectedRoute>
                            }
                        />

                        {/* User Bookings Routes */}
                        <Route
                            path="/my-bookings"
                            element={
                                <ProtectedRoute>
                                    <MyBookings />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/my-bookings/:id"
                            element={
                                <ProtectedRoute>
                                    <UserBookingDetail />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/my-events"
                            element={
                                <ProtectedRoute>
                                    <MyEvents />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/my-orders"
                            element={
                                <ProtectedRoute>
                                    <MyOrders />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/my-orders/:id"
                            element={
                                <ProtectedRoute>
                                    <UserOrderDetail />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/shop/checkout"
                            element={
                                <ProtectedRoute>
                                    <Checkout />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/booking/:venueId"
                            element={
                                <ProtectedRoute>
                                    <BookingPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/booking/:venueId/checkout"
                            element={
                                <ProtectedRoute>
                                    <BookingCheckout />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/booking/success/:bookingId"
                            element={
                                <ProtectedRoute>
                                    <BookingSuccess />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/payment/callback"
                            element={
                                <ProtectedRoute>
                                    <PaymentCallback />
                                </ProtectedRoute>
                            }
                        />

                        {/* Operator Routes */}
                        <Route
                            path="/operator"
                            element={
                                <ProtectedRoute requiredRoles={['operator', 'admin']}>
                                    <OperatorLayout />
                                </ProtectedRoute>
                            }
                        >
                            <Route index element={<OperatorDashboard />} />
                            <Route path="venues" element={<VenueListings />} />
                            <Route path="venues/new" element={<AddEditVenue />} />
                            <Route path="venues/:id" element={<VenueDetails />} />
                            <Route path="venues/:id/edit" element={<AddEditVenue />} />
                            <Route path="bookings" element={<ManageBookings />} />
                            <Route path="bookings/:id" element={<BookingDetail />} />
                            <Route path="calendar" element={<BookingCalendar />} />
                            <Route path="events" element={<EventListings />} />
                            <Route path="events/new" element={<AddEditEvent />} />
                            <Route path="events/:id" element={<EventRegistrations />} />
                            <Route path="events/:id/edit" element={<AddEditEvent />} />
                            <Route path="settings" element={<OperatorSettings />} />
                            <Route path="products" element={<OperatorProducts />} />
                            <Route path="products/new" element={<AddEditProduct />} />
                            <Route path="products/:id/edit" element={<AddEditProduct />} />
                            <Route path="orders" element={<ManageOrders />} />
                            <Route path="orders/:id" element={<OperatorOrderDetail />} />
                            <Route path="reviews" element={<ManageReviews />} />
                            <Route path="training" element={<OperatorTrainingVideos />} />
                        </Route>

                        {/* Admin Routes */}
                        <Route
                            path="/admin"
                            element={
                                <ProtectedRoute requiredRoles={['admin']}>
                                    <AdminLayout />
                                </ProtectedRoute>
                            }
                        >
                            <Route index element={<AdminDashboard />} />
                            <Route path="venues/pending" element={<PendingVenues />} />
                            <Route path="venues/:id" element={<VenueApproval />} />
                            <Route path="venues" element={<AllVenues />} />
                            <Route path="users" element={<UserManagement />} />
                            <Route path="products" element={<AdminProducts />} />
                            <Route path="seller-requests" element={<SellerRequests />} />
                            <Route path="training" element={<AdminTrainingVideos />} />
                            <Route path="reviews/flagged" element={<FlaggedReviews />} />
                        </Route>
                    </Routes>
                </div>
            </Router>
            </CartProvider>
        </AuthProvider>
    );
}

export default App;


