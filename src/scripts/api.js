import CONFIG from './config.js';

const API_ENDPOINTS = {
  LOGIN: `${CONFIG.BASE_URL}/login`,
  REGISTER: `${CONFIG.BASE_URL}/register`,
  GET_ALL_STORIES: `${CONFIG.BASE_URL}/stories`,
  ADD_NEW_STORY: `${CONFIG.BASE_URL}/stories`,
  SUBSCRIBE: `${CONFIG.BASE_URL}/${CONFIG.SUBSCRIBE_URL}`,
  UNSUBSCRIBE: `${CONFIG.BASE_URL}/${CONFIG.UNSUBSCRIBE_URL}`,
};

async function register({ name, email, password }) {
  const response = await fetch(API_ENDPOINTS.REGISTER, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  return response.json();
}

async function login({ email, password }) {
  const response = await fetch(API_ENDPOINTS.LOGIN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return response.json();
}

async function getAllStories() {
  const token = sessionStorage.getItem('token');
  if (!token) {
    window.location.hash = '#/login';
    return { error: true, message: 'Missing token', listStory: [] };
  }

  const response = await fetch(`${API_ENDPOINTS.GET_ALL_STORIES}?location=1`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return response.json();
}

async function addNewStory(formData) {
  const token = sessionStorage.getItem('token');
  if (!token) {
    window.location.hash = '#/login';
    return { error: true, message: 'Missing token' };
  }

  const response = await fetch(API_ENDPOINTS.ADD_NEW_STORY, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });
  return response.json();
}

async function subscribeNotification(subscription) {
  const token = sessionStorage.getItem('token');
  if (!token) {
    return { error: true, message: 'Missing token' };
  }

  const response = await fetch(API_ENDPOINTS.SUBSCRIBE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(subscription),
  });
  return response.json();
}

async function unsubscribeNotification(endpoint) {
  const token = sessionStorage.getItem('token');
  if (!token) {
    return { error: true, message: 'Missing token' };
  }

  const response = await fetch(API_ENDPOINTS.UNSUBSCRIBE, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ endpoint }),
  });
  return response.json();
}

export { login, register, getAllStories, addNewStory, subscribeNotification, unsubscribeNotification };