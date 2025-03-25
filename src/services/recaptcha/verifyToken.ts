export interface VerifyRecaptchaResponse {
  success: boolean;
  score?: number;
  action?: string;
  challengeTimestamp?: string;
  hostname?: string;
  errorCodes?: string[];
}

/**
 * Verifies a reCAPTCHA token with Google's API
 * @param token - The reCAPTCHA token to verify
 * @param expectedAction - The expected action that was used when generating the token
 * @param minScore - The minimum score to consider valid (0.0 to 1.0)
 * @returns The verification result
 */
export async function verifyRecaptchaToken(
  token: string,
  expectedAction?: string,
  minScore: number = 0.5
): Promise<VerifyRecaptchaResponse> {
  // First check: If reCAPTCHA feature is disabled, always return success
  // Check directly from environment variables
  const recaptchaEnabled = process.env.NEXT_PUBLIC_FEATURE_RECAPTCHA !== 'false';
  if (!recaptchaEnabled) {
    return { success: true };
  }
  
  // Second check: If token is 'disabled' (sent by client when feature is off), also return success
  if (token === 'disabled') {
    return { success: true };
  }
  
  // Check if token exists
  if (!token) {
    return { 
      success: false, 
      errorCodes: ['missing-input-response'] 
    };
  }
  
  // Get secret key from environment variables
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  if (!secretKey) {
    console.error('RECAPTCHA_SECRET_KEY is not set');
    return { 
      success: false, 
      errorCodes: ['missing-input-secret'] 
    };
  }
  
  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    
    const verificationResponse = await fetch(
      'https://www.google.com/recaptcha/api/siteverify',
      {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    
    const responseData = await verificationResponse.json();
    
    const {
      success,
      score,
      action,
      challenge_ts: challengeTimestamp,
      hostname,
      'error-codes': errorCodes,
    } = responseData;
    
    // Check if score is high enough
    if (success && score < minScore) {
      return {
        success: false,
        score,
        action,
        challengeTimestamp,
        hostname,
        errorCodes: ['low-score'],
      };
    }
    
    // Check if action matches expected action
    if (success && expectedAction && action !== expectedAction) {
      return {
        success: false,
        score,
        action,
        challengeTimestamp,
        hostname,
        errorCodes: ['action-mismatch'],
      };
    }
    
    return {
      success,
      score,
      action,
      challengeTimestamp,
      hostname,
      errorCodes,
    };
  } catch (error) {
    console.error('Error verifying reCAPTCHA token:', error);
    return {
      success: false,
      errorCodes: ['verification-failed'],
    };
  }
} 