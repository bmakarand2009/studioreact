

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Checkbox, Alert, AlertTitle, AlertDescription } from '@/components/ui';
import { 
  Eye, 
  EyeOff, 
  Lock,
  Mail,
  Chrome,
  Facebook,
  Github
} from 'lucide-react';
import { authService } from '@/services/authService';

const loginSchema = z.object({
  userId: z.string().min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const navigate = useNavigate();

  // Check if user is already authenticated on page load
  useEffect(() => {
    const checkExistingAuth = async () => {
      try {
        // Check if user is already logged in
        const isLoggedIn = await authService.isLoggedIn();
        if (isLoggedIn) {
          // Get current user to determine redirect path
          const currentUser = await authService.getCurrentUser();
          if (currentUser) {
            let redirectPath = '/dashboard'; // default fallback
            
            switch (currentUser.role) {
              case 'ROLE_ADMIN':
                redirectPath = '/admin/dashboard';
                break;
              case 'ROLE_STUDENT':
                redirectPath = '/student/dashboard';
                break;
              case 'ROLE_STAFF':
                redirectPath = '/staff/dashboard';
                break;
              default:
                redirectPath = '/dashboard';
                break;
            }

            // Check if there's a return URL from query params
            const urlParams = new URLSearchParams(window.location.search);
            const returnUrl = urlParams.get('redirect') || urlParams.get('redirectURL');
            
            if (returnUrl && returnUrl !== '/login' && returnUrl !== '/') {
              // Validate that the return URL is safe (not external)
              try {
                const returnUrlObj = new URL(returnUrl, window.location.origin);
                if (returnUrlObj.origin === window.location.origin) {
                  redirectPath = returnUrl;
                  console.log('Auto-login: Redirecting to original requested page:', redirectPath);
                } else {
                  console.log('Auto-login: Invalid return URL, using default dashboard');
                }
              } catch (e) {
                console.log('Auto-login: Invalid return URL format, using default dashboard');
              }
            } else {
              console.log('Auto-login: Redirecting to default dashboard:', redirectPath);
            }

            console.log('Auto-login: Redirecting to:', redirectPath);
            navigate(redirectPath, { replace: true });
            return;
          }
        }
      } catch (error) {
        console.log('Auto-login check failed:', error);
        // Continue to show login form if check fails
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkExistingAuth();
  }, [navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError('');

    try {
      console.log('Attempting login with:', data);
      const result = await authService.login(data);
      console.log('Login result:', result);
      
      if (result.contact && result.access_token) {
        // Login successful - redirect based on role
        let redirectPath = '/dashboard'; // default fallback
        
        switch (result.contact.role) {
          case 'ROLE_ADMIN':
            redirectPath = '/admin/dashboard';
            break;
          case 'ROLE_STUDENT':
            redirectPath = '/student/dashboard';
            break;
          case 'ROLE_STAFF':
            redirectPath = '/staff/dashboard';
            break;
          default:
            redirectPath = '/dashboard';
            break;
        }

        // Check if there's a return URL from query params
        const urlParams = new URLSearchParams(window.location.search);
        const returnUrl = urlParams.get('redirect') || urlParams.get('redirectURL');
        
        if (returnUrl && returnUrl !== '/login' && returnUrl !== '/') {
          redirectPath = returnUrl;
          console.log('Redirecting to original requested page:', redirectPath);
        } else {
          console.log('Redirecting to default dashboard:', redirectPath);
        }

        console.log('Redirecting to:', redirectPath);
        
        // Small delay to ensure authentication state is properly set
        setTimeout(() => {
          navigate(redirectPath, { replace: true });
        }, 100);
      } else {
        console.error('Invalid login response:', result);
        setError('Invalid login credentials. Please try again.');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await authService.googleLogin();
    } catch (error) {
      setError('Google login failed. Please try again.');
    }
  };

  const handleFacebookLogin = async () => {
    try {
      await authService.facebookLogin();
    } catch (error) {
      setError('Facebook login failed. Please try again.');
    }
  };

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-deep-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Left Side - Form */}
      <div className="flex-shrink-0 flex items-center justify-center p-8 w-full lg:w-auto lg:min-w-[500px]">
        <div className="w-full max-w-md lg:max-w-lg xl:max-w-md">
          {/* Logo & Brand */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-deep-600 rounded-xl shadow-lg mb-4">
              <span className="text-white text-2xl font-bold">W</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome back
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Sign in to your account to continue
            </p>
          </div>

          {/* Error Alert - Only shown when there's an error */}
          {error && (
            <Alert 
              variant="destructive" 
              appearance="outline" 
              className="mb-6"
            >
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="userId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email address
              </label>
              <Input
                {...register('userId')}
                id="userId"
                type="email"
                placeholder="Enter your email"
                leftIcon={<Mail className="h-5 w-5" />}
                message={errors.userId?.message}
                messageType={errors.userId?.message ? 'error' : 'default'}
                className="h-12"
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <Input
                {...register('password')}
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                leftIcon={<Lock className="h-5 w-5" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                }
                message={errors.password?.message}
                messageType={errors.password?.message ? 'error' : 'default'}
                className="h-12"
              />
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <Checkbox
                {...register('rememberMe')}
                id="rememberMe"
                label="Remember me"
                className="-ml-2"
              />
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-deep-600 hover:text-deep-700 dark:text-deep-400 dark:hover:text-deep-300 transition-colors whitespace-nowrap"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </Button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Google OAuth Button */}
            <Button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full h-12 text-base font-semibold bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              disabled={isLoading}
            >
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </div>
            </Button>
          </form>

          {/* Sign Up Link */}
          <div className="text-center mt-6">
            <p className="text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <Link
                to="/sign-up"
                className="font-medium text-deep-600 hover:text-deep-700 dark:text-deep-400 dark:hover:text-deep-300 transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Simple Visual */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-deep-600 to-deep-700 items-center justify-center p-8">
        <div className="text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Wajooba</h2>
          <p className="text-xl text-deep-100 max-w-md">
            Your modern learning management platform. Access courses, track progress, and connect with your learning community.
          </p>
          
          {/* Simple Stats */}
          <div className="grid grid-cols-3 gap-8 mt-12 max-w-sm mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold">50K+</div>
              <div className="text-sm text-deep-200">Active Learners</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">500+</div>
              <div className="text-sm text-deep-200">Courses</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">98%</div>
              <div className="text-sm text-deep-200">Success Rate</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
