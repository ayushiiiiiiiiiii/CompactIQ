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

export const getGraphElements = async (deviceId) => {
    const url = deviceId ? `${API_BASE}/inventory/graph/elements?device_id=${deviceId}` : `${API_BASE}/inventory/graph/elements`;
    const response = await axios.get(url);
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
