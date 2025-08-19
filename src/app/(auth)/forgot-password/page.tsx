'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Alert, AlertTitle, AlertDescription } from '@/components/ui';
import { 
  Mail, 
  ArrowLeft,
  CheckCircle
} from 'lucide-react';
import { authService } from '@/services/authService';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onChange',
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError('');

    try {
      await authService.forgotPassword(data);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
        {/* Left side - Success Message */}
        <div className="flex-shrink-0 flex items-center justify-center p-8 w-full lg:w-auto lg:min-w-[500px]">
          <div className="w-full max-w-md lg:max-w-lg xl:max-w-md">
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-deep-600 rounded-xl shadow-lg mb-4">
                <span className="text-white text-2xl font-bold">W</span>
              </div>
            </div>

            {/* Success Message */}
            <div className="text-center">
              <div className="mx-auto h-16 w-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Check your email
              </h2>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                We've sent a password reset link to your email address. Please check your inbox and follow the instructions to reset your password.
              </p>
              
              <div className="space-y-4">
                <Link href="/login">
                  <Button variant="primary" fullWidth className="h-12">
                    Back to sign in
                  </Button>
                </Link>
                
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Didn't receive the email?{' '}
                  <button
                    onClick={() => setIsSuccess(false)}
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
                  >
                    Try again
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Simple Visual */}
        <div className="hidden lg:flex flex-1 bg-gradient-to-br from-deep-600 to-deep-700 items-center justify-center p-8">
          <div className="text-center text-white">
            <h2 className="text-4xl font-bold mb-4">Password Reset</h2>
            <p className="text-xl text-deep-100 max-w-md">
              No worries, we'll send you reset instructions. Just enter your email address and we'll take care of the rest.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Left side - Forgot Password Form */}
      <div className="flex-shrink-0 flex items-center justify-center p-8 w-full lg:w-auto lg:min-w-[500px]">
        <div className="w-full max-w-md lg:max-w-lg xl:max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-deep-600 rounded-xl shadow-lg mb-4">
              <span className="text-white text-2xl font-bold">W</span>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 
              className="text-2xl font-bold text-gray-900 dark:text-white mb-2 leading-tight"
              style={{ 
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                minWidth: 'fit-content'
              }}
            >
              Forgot your password?
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              No worries, we'll send you reset instructions.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert 
              variant="destructive" 
              appearance="outline" 
              className="mb-6"
            >
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Forgot Password Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email address
              </label>
              <Input
                {...register('email')}
                id="email"
                type="email"
                placeholder="Enter your email address"
                leftIcon={<Mail className="h-5 w-5" />}
                message={errors.email?.message}
                messageType={errors.email?.message ? 'error' : 'default'}
                className="h-12"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={isLoading}
              disabled={!isValid || isLoading}
              className="h-12 text-base font-medium"
            >
              {isLoading ? 'Sending...' : 'Send reset instructions'}
            </Button>
          </form>

          {/* Back to Login */}
          <div className="text-center mt-6">
            <Link
              href="/login"
              className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to sign in
            </Link>
          </div>
        </div>
      </div>

      {/* Right side - Simple Visual */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-deep-600 to-deep-700 items-center justify-center p-8">
        <div className="text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Reset Your Password</h2>
          <p className="text-xl text-deep-100 max-w-md">
            We understand that forgetting passwords happens to the best of us. Let us help you get back to learning.
          </p>
        </div>
      </div>
    </div>
  );
}
