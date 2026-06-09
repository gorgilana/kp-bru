const API_URL = 'http://localhost:3000/api';
const ADMIN_API_URL = 'http://localhost:3000/admin-api';

class APIClient {
    static async get(endpoint) {
        try {
            const response = await fetch(`${API_URL}${endpoint}`);
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            return { success: false, message: 'Error fetching data' };
        }
    }

    static async post(endpoint, data) {
        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            return { success: false, message: 'Error posting data' };
        }
    }

    static async adminPost(endpoint, formData, token) {
        try {
            const response = await fetch(`${ADMIN_API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            return { success: false, message: 'Error posting data' };
        }
    }

    static async adminRequest(method, endpoint, data, token) {
        try {
            const options = {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            };
            if (data) options.body = JSON.stringify(data);

            const response = await fetch(`${ADMIN_API_URL}${endpoint}`, options);
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            return { success: false, message: 'Error in request' };
        }
    }
}