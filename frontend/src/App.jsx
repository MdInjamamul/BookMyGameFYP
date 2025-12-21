import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LandingPage from './pages/Landing/LandingPage';
import LoginPage from './pages/Auth/LoginPage';
import SignupPage from './pages/Auth/SignupPage';
import VerifyEmailPage from './pages/Auth/VerifyEmailPage';
import ForgotPasswordPage from './pages/Auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/Auth/ResetPasswordPage';
import VenueSearchResults from './pages/Venues/VenueSearchResults';
import EventCalendar from './pages/Events/EventCalendar';

// Operator imports
import ProtectedRoute from './components/auth/ProtectedRoute';
import OperatorLayout from './components/layout/OperatorLayout';
import OperatorDashboard from './pages/Operator/OperatorDashboard';
import VenueListings from './pages/Operator/VenueListings';
import AddEditVenue from './pages/Operator/AddEditVenue';
import VenueDetails from './pages/Operator/VenueDetails';

function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="App">
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/signup" element={<SignupPage />} />
                        <Route path="/verify-email" element={<VerifyEmailPage />} />
                        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                        <Route path="/reset-password" element={<ResetPasswordPage />} />
                        <Route path="/venues" element={<VenueSearchResults />} />
                        <Route path="/events" element={<EventCalendar />} />

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
                            {/* <Route path="bookings" element={<ManageBookings />} /> */}
                            {/* <Route path="calendar" element={<BookingCalendar />} /> */}
                            {/* <Route path="settings" element={<OperatorSettings />} /> */}
                        </Route>

                        {/* Additional routes will be added here */}
                        {/* <Route path="/venues/:id" element={<VenueDetailsPage />} /> */}
                        {/* <Route path="/events/:id" element={<EventDetailsPage />} /> */}
                        {/* <Route path="/dashboard" element={<DashboardPage />} /> */}
                        {/* <Route path="/booking/:courtId" element={<BookingPage />} /> */}
                    </Routes>
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;

