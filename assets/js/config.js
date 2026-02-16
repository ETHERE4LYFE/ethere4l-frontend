// assets/js/config.js
const API_BASE = window.location.hostname.includes('localhost')
  ? 'http://localhost:3000'
  : "https://api.ethere4l.com";


    

export const ENDPOINTS = {
    LOGIN: `${API_BASE}/api/admin/login`,
    ORDERS: `${API_BASE}/api/admin/orders`,
    UPDATE_TRACKING: `${API_BASE}/api/admin/update-tracking`
};