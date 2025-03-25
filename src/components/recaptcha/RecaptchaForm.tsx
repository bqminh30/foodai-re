'use client';

import React, { useState, FormEvent } from 'react';
import { useRecaptchaToken } from './useRecaptchaToken';
import { useRecaptcha } from './RecaptchaProvider';

interface RecaptchaFormProps {
  onSubmit: (data: { email: string; message: string; token: string }) => Promise<void>;
}

export function RecaptchaForm({ onSubmit }: RecaptchaFormProps) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const { isEnabled } = useRecaptcha();
  const { executeRecaptcha, isLoading: isRecaptchaLoading } = useRecaptchaToken({
    action: 'contactFormSubmit',
  });
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    
    try {
      setIsSubmitting(true);
      
      const token = await executeRecaptcha();
      
      if (!token && isEnabled) {
        setError('Failed to verify that you are human. Please try again.');
        return;
      }
      
      await onSubmit({
        email,
        message,
        token: token || 'disabled',
      });
      
      setEmail('');
      setMessage('');
      setSuccess(true);
    } catch (err) {
      setError('An error occurred while submitting the form. Please try again.');
      console.error('Form submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isEnabled && (
        <div className="text-sm text-gray-500">
          This form is protected by Google reCAPTCHA v3.
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 p-4 rounded-md text-red-800">{error}</div>
      )}
      
      {success && (
        <div className="bg-green-50 p-4 rounded-md text-green-800">
          Your message has been sent successfully!
        </div>
      )}
      
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        />
      </div>
      
      <div>
        <label htmlFor="message" className="block text-sm font-medium">
          Message
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={4}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        />
      </div>
      
      <button
        type="submit"
        disabled={isSubmitting || isRecaptchaLoading}
        className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {isSubmitting || isRecaptchaLoading ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
} 