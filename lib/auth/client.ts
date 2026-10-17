/**
 * Auth client — used by client components to interact with auth API routes.
 * Never handles passwords directly beyond form submission.
 */

export interface AuthUser {
  id: string;
  username: string;
  email?: string | null;
  mobile: string;
  role: 'admin' | 'student';
}

interface AuthResponse {
  user?: AuthUser;
  error?: string;
}

interface UsernameCheckResponse {
  available: boolean;
  username?: string;
  reason?: string;
  error?: string;
}

interface ForgotPasswordResponse {
  success?: boolean;
  maskedEmail?: string | null;
  message?: string;
  error?: string;
}

interface VerifyOtpResponse {
  success?: boolean;
  resetToken?: string;
  error?: string;
}

interface ResetPasswordResponse {
  success?: boolean;
  message?: string;
  error?: string;
}

async function handleResponse<T>(response: Response): Promise<T & { error?: string }> {
  try {
    const data = await response.json();
    if (!response.ok && !data.error) {
      return { ...data, error: 'An unexpected error occurred.' };
    }
    return data;
  } catch {
    return { error: 'Failed to process server response.' } as T & { error?: string };
  }
}

export const authClient = {
  /**
   * Register a new account.
   */
  async register(data: {
    username: string;
    email: string;
    mobile: string;
    password: string;
    confirmPassword: string;
  }): Promise<AuthResponse> {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await handleResponse<AuthResponse>(response);
    } catch {
      return { error: 'Network unavailable. Please check your internet connection.' };
    }
  },

  /**
   * Log in with username and password.
   */
  async login(data: {
    username: string;
    password: string;
  }): Promise<AuthResponse> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await handleResponse<AuthResponse>(response);
    } catch {
      return { error: 'Network unavailable. Please check your internet connection.' };
    }
  },

  /**
   * Log out the current session.
   */
  async logout(): Promise<{ success?: boolean; error?: string }> {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      return await handleResponse(response);
    } catch {
      return { success: true };
    }
  },

  /**
   * Get the currently authenticated user.
   */
  async getMe(): Promise<AuthResponse> {
    try {
      const response = await fetch('/api/auth/me');
      return await handleResponse<AuthResponse>(response);
    } catch {
      return { error: 'Network unavailable or offline' };
    }
  },

  /**
   * Check if a username is available.
   */
  async checkUsername(username: string): Promise<UsernameCheckResponse> {
    try {
      const response = await fetch(
        `/api/auth/check-username?u=${encodeURIComponent(username)}`
      );
      return await handleResponse<UsernameCheckResponse>(response);
    } catch {
      return { available: false, error: 'Network unavailable' };
    }
  },

  /**
   * Request password reset OTP.
   */
  async forgotPassword(data: { username: string }): Promise<ForgotPasswordResponse> {
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await handleResponse<ForgotPasswordResponse>(response);
    } catch {
      return { error: 'Network unavailable. Please check your internet connection.' };
    }
  },

  /**
   * Verify the 6-digit OTP.
   */
  async verifyOtp(data: { username: string; otp: string }): Promise<VerifyOtpResponse> {
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await handleResponse<VerifyOtpResponse>(response);
    } catch {
      return { error: 'Network unavailable. Please check your internet connection.' };
    }
  },

  /**
   * Reset password with the verified token.
   */
  async resetPassword(data: {
    resetToken: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<ResetPasswordResponse> {
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await handleResponse<ResetPasswordResponse>(response);
    } catch {
      return { error: 'Network unavailable. Please check your internet connection.' };
    }
  },
};
