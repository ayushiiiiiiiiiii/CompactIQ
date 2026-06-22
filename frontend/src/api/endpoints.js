import axios from 'axios';

const API_BASE = 'http://127.0.0.1:8000/api/v1';

export const submitInventory = async (device_id, os, components) => {
    const payload = { device_id, os, components };
    const response = await axios.post(`${API_BASE}/inventory/`, payload);
    return response.data;
};

export const getCompliance = async (device_id) => {
    const response = await axios.get(`${API_BASE}/inventory/${device_id}`);
    return response.data;
};

export const chatAssistant = async (device_id, query) => {
    const payload = { device_id, query };
    const response = await axios.post(`${API_BASE}/chat/`, payload);
    return response.data;
};

// NOTE: getGraphElements is intentionally removed.
// Graph elements are returned inline from submitInventory() and getCompliance().
// Access graph data from AppContext: const { graphData } = useContext(AppContext);

export const getGlobalRules = async () => {
    const response = await axios.get(`${API_BASE}/inventory/rules`);
    return response.data;
};

export const uploadDocument = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post(`${API_BASE}/documents/ingest`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const getDocumentsList = async () => {
    const response = await axios.get(`${API_BASE}/documents/`);
    return response.data;
};

export const removeDocument = async (document_id, password) => {
    const response = await axios.post(`${API_BASE}/documents/${document_id}/remove`, { password });
    return response.data;
};

export const flushDatabase = async (password) => {
    const response = await axios.post(`${API_BASE}/admin/flush`, { password });
    return response.data;
};
