import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import 'core-js';

import axios from 'axios';
import App from './App';
import store from './store';

// Just set axios header if token exists in localStorage
const token = localStorage.getItem('token');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <App />
  </Provider>
);
