# Authentication System Documentation

## Overview

A complete authentication system has been integrated into your Next.js app with automatic token refresh, session management, and protected routes.

## Key Features

✅ **Automatic Token Refresh**: When an API returns 401, the system automatically attempts to refresh the token  
✅ **Smart Retry Logic**: After successful refresh, the original request is retried  
✅ **Session Management**: Only logs out when refresh token is invalid (returns 401)  
✅ **Protected Routes**: Dashboard and other routes require authentication  
✅ **Auth Middleware**: Automatic redirects based on auth state  
✅ **User Context**: Access user data anywhere in your app  

## Architecture

### API Endpoints

Your backend should implement these endpoints:

```
POST /auth/login          - Login with email/password
POST /auth/register       - Register new user
POST /auth/logout         - Logout (optional, frontend clears tokens)
POST /auth/refresh        - Refresh access token using refresh token
```

### API Response Format

**Login/Register Response:**
```json
{
  "accessToken": "jwt_token",
  "refreshToken": "refresh_token",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

**Refresh Response:**
```json
{
  "accessToken": "new_jwt_token",
  "refreshToken": "new_refresh_token"  // optional
}
```

## Files Created/Modified

### New Files

1. **lib/api-client.ts**
   - Main API client with 401 retry logic
   - Auth token management
   - Functions: `login()`, `register()`, `logout()`, `apiRequest()`

2. **lib/auth-context.tsx**
   - React Context for authentication state
   - Hooks: `useAuth()`, `useIsAuthenticated()`, `useUser()`, `useLogout()`

3. **components/protected-route.tsx**
   - Wrapper component for protected pages
   - Handles loading state and redirects

4. **app/auth/login/page.tsx**
   - Login page with email/password form
   - Shows session expiry message if redirected

5. **app/auth/register/page.tsx**
   - Registration page with name/email/password
   - Password validation

6. **app/auth/logout/page.tsx**
   - Logout handler page
   - Clears tokens and redirects to login

7. **middleware.ts** (updated)
   - Routes protection at middleware level
   - Redirects based on auth state

### Modified Files

1. **app/layout.tsx**
   - Wrapped app with `<AuthProvider>`

2. **app/dashboard/layout.tsx**
   - Added `ProtectedRoute` wrapper
   - Connected user info to Auth context
   - Updated logout functionality

## Usage

### Using the API Client

```typescript
import { apiRequest, login, register } from '@/lib/api-client';

// Login
const response = await login('user@example.com', 'password');

// Register
const response = await register('user@example.com', 'password', 'John Doe');

// Make authenticated API calls
const data = await apiRequest('/api/projects');

// Logout
import { logout } from '@/lib/api-client';
await logout();
```

### Using Auth Context

```typescript
'use client';

import { useAuth, useUser, useLogout, useIsAuthenticated } from '@/lib/auth-context';

export function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();
  const currentUser = useUser();
  const isLoggedIn = useIsAuthenticated();
  const handleLogout = useLogout();

  return (
    <div>
      {isAuthenticated && <p>Hello, {user?.name}!</p>}
    </div>
  );
}
```

### Protecting Routes

**Option 1: Use ProtectedRoute Component**
```typescript
import { ProtectedRoute } from '@/components/protected-route';

export default function ProtectedPage() {
  return (
    <ProtectedRoute>
      <div>This page is protected</div>
    </ProtectedRoute>
  );
}
```

**Option 2: Middleware (automatic)**
Routes starting with `/dashboard` are automatically protected by middleware.

## Authentication Flow

### Login/Register Flow
```
User Input → Login/Register Form → API Call → Store Tokens → Update Context → Redirect to Dashboard
```

### API Request with Auto-Retry Flow
```
API Call → 
  ├─ Success → Return Data
  └─ 401 Error → 
      ├─ Try Refresh Token
      ├─ Refresh Success → Retry Original Request
      └─ Refresh Failed → Clear Tokens → Redirect to Login
```

### Token Management
- **Access Token**: Stored in `localStorage` as `auth_token`
- **Refresh Token**: Stored in `localStorage` as `refresh_token`
- **User Data**: Stored in `localStorage` as `user`

## Security Considerations

### ⚠️ Current Implementation (Development)
- Tokens stored in `localStorage` (browser accessible)
- Suitable for development and demo purposes

### 🔐 Production Recommendations
1. **Use HttpOnly Cookies** instead of localStorage for tokens
   ```typescript
   // Backend sets tokens in HttpOnly cookies
   Set-Cookie: auth_token=...; HttpOnly; Secure; SameSite=Strict
   Set-Cookie: refresh_token=...; HttpOnly; Secure; SameSite=Strict
   ```

2. **Add CSRF Protection**
   - Include CSRF token in requests
   - Validate on backend

3. **Implement Rate Limiting**
   - Limit login attempts
   - Limit refresh token requests

4. **Add 2FA/MFA**
   - Optional for sensitive operations

## Configuration

### Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Update in `.env.local` or your deployment platform.

## Troubleshooting

### Tokens not persisting after refresh
- Check browser's localStorage is enabled
- Verify cookies are being set correctly

### Infinite refresh loop
- Check `/auth/refresh` endpoint is returning correct status codes
- Ensure refresh token is valid

### User not redirected after logout
- Verify `window.location.href` works in your environment
- Check if using SSR - logout should happen on client side

## API Client Rules

The API client follows these rules:

1. **On Normal API 401**:
   - Attempt refresh once
   - If refresh succeeds (200), retry original request
   - If refresh fails (401), logout and redirect to login

2. **On Refresh Endpoint**:
   - Only called once per failed request (prevent loops)
   - If returns 401, clears tokens and redirects immediately
   - If returns 200, updates tokens and retries request

3. **Request Queuing**:
   - While refreshing, other requests wait for the new token
   - Prevents race conditions with multiple failed requests

## Next Steps

1. Update your backend API to implement the auth endpoints
2. Set `NEXT_PUBLIC_API_URL` environment variable
3. Test login/register flow
4. Integrate protected API calls using `apiRequest()`
5. Customize user data in Auth context
6. Add additional auth features (password reset, 2FA, etc.)

## Example Backend Integration

Your backend should:

1. Accept `/auth/login` with `{ email, password }`
2. Accept `/auth/register` with `{ email, password, name }`
3. Accept `/auth/refresh` with `{ refreshToken }`
4. Return JWT tokens with appropriate expiry times
5. Validate tokens on protected endpoints
6. Return 401 on invalid/expired tokens

Example token expiry times:
- Access Token: 15-30 minutes
- Refresh Token: 7 days

This ensures tokens refresh automatically without user interaction while maintaining security.
