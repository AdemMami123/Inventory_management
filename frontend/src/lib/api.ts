import { API_BASE_URL } from './config';

/**
 * Helper function to make API requests
 * @param endpoint - API endpoint (without the base URL)
 * @param options - Fetch options
 * @returns Promise with the response
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Ensure we have the right headers and credentials
  const defaultOptions: RequestInit = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...options.headers,
    },
    mode: 'cors',
  };

  // Merge default options with provided options
  const fetchOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  // Make the request
  try {
    console.log(`Making API request to: ${API_BASE_URL}${endpoint}`);
    const response = await fetch(`${API_BASE_URL}${endpoint}`, fetchOptions);

    // Log response status
    console.log(`API response status: ${response.status} ${response.statusText}`);

    // Handle non-OK responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('API error data:', errorData);
      throw new Error(
        errorData?.message || `API error: ${response.status} ${response.statusText}`
      );
    }

    // Parse and return the response
    const data = await response.json();
    console.log('API response data:', data);
    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// Auth API functions
export const authApi = {
  login: (email: string, password: string) =>
    apiRequest('/api/users/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (name: string, email: string, password: string) =>
    apiRequest('/api/users/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  logout: () =>
    apiRequest('/api/users/logout', {
      method: 'GET',
    }),

  getUser: () =>
    apiRequest('/api/users/getuser', {
      method: 'GET',
    }),

  loginStatus: () =>
    apiRequest('/api/users/loggedin', {
      method: 'GET',
    }),
};

// Products API functions
export const productsApi = {
  getAll: () =>
    apiRequest('/api/products', {
      method: 'GET',
    }),

  getById: (id: string) =>
    apiRequest(`/api/products/${id}`, {
      method: 'GET',
    }),

  create: (formData: FormData) =>
    fetch(`${API_BASE_URL}/api/products`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
      mode: 'cors',
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      }
    }).then(res => {
      if (!res.ok) {
        return res.json().then(err => {
          throw new Error(err.message || 'Failed to create product');
        });
      }
      return res.json();
    }),

  update: (id: string, formData: FormData) =>
    fetch(`${API_BASE_URL}/api/products/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      body: formData,
      mode: 'cors',
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      }
    }).then(res => {
      if (!res.ok) {
        return res.json().then(err => {
          throw new Error(err.message || 'Failed to update product');
        });
      }
      return res.json();
    }),

  delete: (id: string) =>
    apiRequest(`/api/products/${id}`, {
      method: 'DELETE',
    }),
};

// Orders API functions
export const ordersApi = {
  getAll: () =>
    apiRequest('/api/orders/all', {
      method: 'GET',
    }),

  getMyOrders: () =>
    apiRequest('/api/orders/my-orders', {
      method: 'GET',
    }),

  getById: (id: string) =>
    apiRequest(`/api/orders/${id}`, {
      method: 'GET',
    }),

  create: (orderData: any) =>
    apiRequest('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    }),

  updateStatus: (id: string, status: string, notes?: string) =>
    apiRequest(`/api/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    }),

  updatePayment: (id: string, paymentStatus: string, paymentMethod?: string, notes?: string) =>
    apiRequest(`/api/orders/${id}/payment`, {
      method: 'PATCH',
      body: JSON.stringify({ paymentStatus, paymentMethod, notes }),
    }),

  delete: (id: string) =>
    apiRequest(`/api/orders/${id}`, {
      method: 'DELETE',
    }),
};

// Users API functions
export const usersApi = {
  getCustomers: () =>
    apiRequest('/api/users/customers', {
      method: 'GET',
    }),
};

// Settings API functions
export const settingsApi = {
  getSettings: () =>
    apiRequest('/api/settings', {
      method: 'GET',
    }),

  updateSettings: (settingsData: any) =>
    apiRequest('/api/settings', {
      method: 'PATCH',
      body: JSON.stringify(settingsData),
    }),
};
