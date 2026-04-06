import { useState, useEffect } from 'react';
import contactService from '../../services/contactService';
import { toast } from 'react-hot-toast';

function AdminContacts() {
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInquiries();
    }, []);

    const fetchInquiries = async () => {
        try {
            const data = await contactService.getAdminContacts();
            setInquiries(data.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching inquiries:', error);
            toast.error('Failed to load contact messages');
            setLoading(false);
        }
    };

    const handleResolve = async (id) => {
        try {
            await contactService.resolveAdminContact(id);
            toast.success('Inquiry marked as resolved');
            fetchInquiries(); // refresh list
        } catch (error) {
            console.error('Error updating inquiry status:', error);
            toast.error('Failed to update status');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 font-heading">Contact Messages</h1>
                    <p className="text-gray-600 mt-1">Manage user inquiries and support requests</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Date/Time</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Sender</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Subject / Message</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {inquiries.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                        <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        <p>No contact messages found.</p>
                                    </td>
                                </tr>
                            ) : (
                                inquiries.map((inquiry) => (
                                    <tr key={inquiry.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 align-top">
                                            <div className="text-sm font-medium text-gray-900">
                                                {new Date(inquiry.createdAt).toLocaleDateString()}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {new Date(inquiry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 align-top">
                                            <div className="text-sm font-semibold text-gray-900">{inquiry.name}</div>
                                            <a href={`mailto:${inquiry.email}`} className="text-xs text-primary-600 hover:underline">
                                                {inquiry.email}
                                            </a>
                                        </td>
                                        <td className="px-6 py-4 align-top">
                                            <div className="font-medium text-sm text-gray-900 mb-1">{inquiry.subject}</div>
                                            <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-3">
                                                {inquiry.message}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 align-top">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                inquiry.status === 'resolved' 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {inquiry.status.charAt(0).toUpperCase() + inquiry.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 align-top text-right">
                                            {inquiry.status === 'pending' ? (
                                                <button
                                                    onClick={() => handleResolve(inquiry.id)}
                                                    className="inline-flex items-center justify-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm"
                                                >
                                                    Mark Resolved
                                                </button>
                                            ) : (
                                                <span className="text-sm text-gray-400 italic">Resolved</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default AdminContacts;
