import api from './api';

const contactService = {
    submitContactForm: async (data) => {
        const response = await api.post('/contact', data);
        return response.data;
    },
    getAdminContacts: async () => {
        const response = await api.get('/contact/admin');
        return response.data;
    },
    resolveAdminContact: async (id) => {
        const response = await api.patch(`/contact/admin/${id}`, { status: 'resolved' });
        return response.data;
    }
};

export default contactService;
