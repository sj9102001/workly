/**
 * API Client with automatic auth refresh on 401
 *
 * Rules:
 * - If API call returns 401 → try refresh once
 * - If /auth/refresh returns 200 → retry original request
 * - If /auth/refresh returns 401 → sign out and redirect to login
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface ApiResponse<T = any> {
    data: T;
    status: number;
}

interface RequestConfig {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    headers?: Record<string, string>;
    body?: any;
    includeAuth?: boolean;
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const onRefreshed = (token: string) => {
    refreshSubscribers.forEach((callback) => callback(token));
    refreshSubscribers = [];
};

const addRefreshSubscriber = (callback: (token: string) => void) => {
    refreshSubscribers.push(callback);
};

/**
 * Get stored auth token from localStorage
 */
function getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
}

/**
 * Store auth token in localStorage
 */
function storeToken(accessToken: string) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('auth_token', accessToken);
}

/**
 * Clear auth token from localStorage
 */
export function clearTokens() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('auth_token');
}

/**
 * Refresh the access token using the refresh token (stored in HTTP-only cookie)
 */
async function refreshAccessToken(): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // Include cookies for refresh token
        });

        if (response.status === 200) {
            const data = await response.json();
            if (data.accessToken) {
                storeToken(data.accessToken);
                onRefreshed(data.accessToken);
                return true;
            }
            return false;
        } else if (response.status === 401) {
            // Refresh token is invalid, clear tokens and redirect to login
            clearTokens();
            onRefreshed('');
            // Redirect to login page
            if (typeof window !== 'undefined') {
                window.location.href = '/auth/login?sessionExpired=true';
            }
            return false;
        }
    } catch (error) {
        console.error('Error refreshing token:', error);
        clearTokens();
        return false;
    }

    return false;
}

/**
 * Main API request function with automatic auth retry
 */
export async function apiRequest<T = any>(
    endpoint: string,
    config: RequestConfig = {}
): Promise<T> {
    const {
        method = 'GET',
        headers = {},
        body,
        includeAuth = true,
    } = config;

    const url = `${API_BASE_URL}${endpoint}`;
    const finalHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...headers,
    };

    // Add auth token if available and includeAuth is true
    if (includeAuth) {
        const token = getAuthToken();
        if (token) {
            finalHeaders['Authorization'] = `Bearer ${token}`;
        }
    }

    try {
        let response = await fetch(url, {
            method,
            headers: finalHeaders,
            body: body ? JSON.stringify(body) : undefined,
            credentials: 'include', // Include cookies for refresh token
        });

        // Handle 401 - try refresh once
        if (response.status === 401 && includeAuth && method !== 'POST') {
            // Only retry for non-auth endpoints
            const isAuthEndpoint =
                endpoint.includes('/auth/login') ||
                endpoint.includes('/auth/register') ||
                endpoint.includes('/auth/logout') ||
                endpoint.includes('/auth/refresh');

            if (!isAuthEndpoint && !isRefreshing) {
                isRefreshing = true;

                const refreshed = await refreshAccessToken();
                isRefreshing = false;

                if (refreshed) {
                    // Retry the original request with new token
                    const newToken = getAuthToken();
                    if (newToken) {
                        finalHeaders['Authorization'] = `Bearer ${newToken}`;
                        response = await fetch(url, {
                            method,
                            headers: finalHeaders,
                            body: body ? JSON.stringify(body) : undefined,
                            credentials: 'include',
                        });
                    }
                } else {
                    // Refresh failed, throw error
                    const data = await response.json();
                    throw {
                        status: response.status,
                        message: data.message || 'Authentication failed',
                        data,
                    };
                }
            } else if (isRefreshing) {
                // Wait for refresh to complete, then retry
                return new Promise((resolve, reject) => {
                    addRefreshSubscriber((token) => {
                        if (token) {
                            finalHeaders['Authorization'] = `Bearer ${token}`;
                            fetch(url, {
                                method,
                                headers: finalHeaders,
                                body: body ? JSON.stringify(body) : undefined,
                                credentials: 'include',
                            })
                                .then(async (res) => {
                                    const data = await res.json();
                                    if (!res.ok) {
                                        throw {
                                            status: res.status,
                                            message: data.message || 'API request failed',
                                            data,
                                        };
                                    }
                                    return data;
                                })
                                .then(resolve)
                                .catch(reject);
                        } else {
                            // Refresh failed, reject with 401 error
                            response.json().then((data) => {
                                reject({
                                    status: response.status,
                                    message: data.message || 'Authentication failed',
                                    data,
                                });
                            }).catch(() => {
                                reject({
                                    status: response.status,
                                    message: 'Authentication failed',
                                });
                            });
                        }
                    });
                });
            }
        }

        const data = await response.json();

        // Handle errors
        if (!response.ok) {
            throw {
                status: response.status,
                message: data.message || 'API request failed',
                data,
            };
        }

        return data as T;
    } catch (error: any) {
        throw error;
    }
}

/**
 * Login - POST /auth/login
 * Returns: { accessToken: string, userId: number }
 */
export async function login(email: string, password: string) {
    const response = await apiRequest<{ accessToken: string; userId: number }>('/auth/login', {
        method: 'POST',
        body: { email, password },
        includeAuth: false,
    });

    if (response.accessToken) {
        storeToken(response.accessToken);
    }

    return response;
}

/**
 * Register - POST /auth/register
 * Returns: { accessToken: string, userId: number }
 */
export async function register(
    email: string,
    password: string,
    name: string,
    orgName: string
) {
    const response = await apiRequest<{ accessToken: string; userId: number }>('/auth/register', {
        method: 'POST',
        body: { email, password, name, orgName },
        includeAuth: false,
    });

    if (response.accessToken) {
        storeToken(response.accessToken);
    }

    return response;
}

/**
 * Logout - POST /auth/logout
 */
export async function logout() {
    try {
        await apiRequest('/auth/logout', {
            method: 'POST',
            includeAuth: true,
        });
    } catch (error) {
        // Logout endpoint error is not critical
        console.error('Logout error:', error);
    } finally {
        clearTokens();
        if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
        }
    }
}

/**
 * Get current user - GET /user
 * Returns: { id: number, name: string, email: string, createdAt: string, updatedAt: string }
 */
export async function getCurrentUser() {
    return apiRequest<{
        id: number;
        name: string;
        email: string;
        createdAt: string;
        updatedAt: string;
    }>('/user', {
        method: 'GET',
        includeAuth: true,
    });
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
    return !!getAuthToken();
}
