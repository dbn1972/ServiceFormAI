import { useState, FormEvent, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft, Loader2 } from 'lucide-react';
import { sendAadhaarOTP, verifyAadhaarOTP } from '../services/sso';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';
import { clearPendingOnboardingIdentity, isOnboardingCompletedForUser, setPendingOnboardingIdentity } from '../utils/onboarding';

export default function AadhaarOTPLogin() {
  const { loginWithSSO } = useApp();
  const [step, setStep] = useState<'aadhaar' | 'otp'>('aadhaar');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [otp, setOTP] = useState(['', '', '', '', '', '']);
  const [transactionId, setTransactionId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [countdown]);

  const formatAadhaar = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    const truncated = digits.slice(0, 12);
    return truncated.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  };

  const handleAadhaarChange = (value: string) => {
    setAadhaarNumber(formatAadhaar(value));
  };

  const handleSendOTP = async (e: FormEvent) => {
    e.preventDefault();

    const cleanAadhaar = aadhaarNumber.replace(/\s/g, '');

    if (cleanAadhaar.length !== 12) {
      toast.error('Please enter a valid 12-digit Aadhaar number');
      return;
    }

    setIsLoading(true);

    try {
      const response = await sendAadhaarOTP(cleanAadhaar);
      setTransactionId(response.transactionId);
      setStep('otp');
      setCountdown(30);
      toast.success('OTP sent to your registered mobile number');

      // Focus first OTP input
      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 100);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOTP = [...otp];
    newOTP[index] = value.slice(-1);
    setOTP(newOTP);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOTPKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOTPPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOTP = [...otp];

    for (let i = 0; i < pastedData.length; i++) {
      newOTP[i] = pastedData[i] ?? '';
    }

    setOTP(newOTP);

    // Focus last filled input or last input
    const focusIndex = Math.min(pastedData.length, 5);
    otpRefs.current[focusIndex]?.focus();
  };

  const handleVerifyOTP = async (e: FormEvent) => {
    e.preventDefault();

    const otpCode = otp.join('');

    if (otpCode.length !== 6) {
      toast.error('Please enter complete 6-digit OTP');
      return;
    }

    setIsLoading(true);

    try {
      const verification = await verifyAadhaarOTP(transactionId, otpCode);

      if (verification.success) {
        // Login with Aadhaar profile
        const authenticatedUser = await loginWithSSO('aadhaar', {
          id: verification.aadhaar_number,
          name: verification.name,
          email: '', // Will be collected during onboarding
          aadhaar: verification.aadhaar_number,
        });

        toast.success('Logged in successfully!');

        const onboardingCompleted = isOnboardingCompletedForUser(authenticatedUser);
        if (!onboardingCompleted) {
          setPendingOnboardingIdentity(authenticatedUser?.id || verification.aadhaar_number);
        } else {
          clearPendingOnboardingIdentity();
        }

        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = onboardingCompleted ? '/dashboard' : '/onboarding/citizen';
        }, 1000);
      } else {
        toast.error('Invalid OTP');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'OTP verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;

    setIsLoading(true);

    try {
      const cleanAadhaar = aadhaarNumber.replace(/\s/g, '');
      const response = await sendAadhaarOTP(cleanAadhaar);
      setTransactionId(response.transactionId);
      setCountdown(30);
      setOTP(['', '', '', '', '', '']);
      toast.success('OTP resent successfully');
      otpRefs.current[0]?.focus();
    } catch (error) {
      toast.error('Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-primary/5 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-success rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-10 h-10 text-success-foreground" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Aadhaar OTP Login</h1>
          <p className="text-muted-foreground">
            {step === 'aadhaar' ? 'Enter your Aadhaar number' : 'Verify OTP'}
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-card border border-border rounded-xl p-8 shadow-lg">
          {step === 'aadhaar' ? (
            <form className="space-y-5" onSubmit={handleSendOTP}>
              <div>
                <label className="block text-sm font-medium mb-2">Aadhaar Number</label>
                <input
                  type="text"
                  value={aadhaarNumber}
                  onChange={(e) => handleAadhaarChange(e.target.value)}
                  placeholder="1234 5678 9012"
                  className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring font-mono text-lg tracking-wider"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground mt-2">
                  OTP will be sent to your registered mobile number
                </p>
              </div>

              <div className="bg-info/10 border border-info/20 rounded-lg p-4">
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-info" />
                  Secure Authentication
                </h3>
                <p className="text-xs text-muted-foreground">
                  Your Aadhaar information is processed securely through UIDAI APIs and is never stored on our servers.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading || aadhaarNumber.replace(/\s/g, '').length !== 12}
                className="w-full py-3 bg-success text-success-foreground rounded-lg font-medium hover:bg-success/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                    Sending OTP...
                  </>
                ) : (
                  'Send OTP'
                )}
              </button>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleVerifyOTP}>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  OTP sent to mobile ending in ****{aadhaarNumber.slice(-4)}
                </p>

                <div className="flex gap-3 justify-center" onPaste={handleOTPPaste}>
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (otpRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOTPChange(index, e.target.value)}
                      onKeyDown={(e) => handleOTPKeyDown(index, e)}
                      className="w-12 h-14 text-center text-xl font-semibold bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  ))}
                </div>
              </div>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Didn't receive the OTP?{' '}
                  {countdown > 0 ? (
                    <span className="text-muted-foreground">Resend in {countdown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={isLoading}
                      className="text-success font-medium hover:underline disabled:opacity-50"
                    >
                      Resend OTP
                    </button>
                  )}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setStep('aadhaar');
                    setOTP(['', '', '', '', '', '']);
                  }}
                  className="flex-1 py-3 border border-border rounded-lg font-medium hover:bg-accent flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading || otp.join('').length !== 6}
                  className="flex-1 py-3 bg-success text-success-foreground rounded-lg font-medium hover:bg-success/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                      Verifying...
                    </>
                  ) : (
                    'Verify & Login'
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Back to Login */}
          <div className="mt-6 pt-6 border-t border-border">
            <Link
              to="/login"
              className="text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to other login options
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Secured by UIDAI • Government of India
        </p>
      </div>
    </div>
  );
}