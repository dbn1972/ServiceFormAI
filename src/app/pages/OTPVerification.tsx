import { Shield, Smartphone, RefreshCw, ArrowLeft, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../components/ui/input-otp';
import { toast } from 'sonner';

export default function OTPVerification() {
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes
  const [isVerified, setIsVerified] = useState(false);
  
  const mobile = '+91 98765 43210'; // Mock data

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0 && !isVerified) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [timeLeft, isVerified]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVerify = async () => {
    if (otp.length !== 6) {
      toast.error('Please enter complete OTP');
      return;
    }

    setIsVerifying(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock verification (accept any 6 digits)
    if (otp.length === 6) {
      setIsVerified(true);
      toast.success('OTP verified successfully!');
    } else {
      toast.error('Invalid OTP. Please try again.');
    }

    setIsVerifying(false);
  };

  const handleResend = async () => {
    setIsResending(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setTimeLeft(120);
    setOtp('');
    setIsResending(false);
    toast.success('OTP sent successfully!');
  };

  const handleBack = () => {
    // In real app, navigate back
    toast.info('Navigate back');
  };

  if (isVerified) {
    return (
      <div className="min-h-full bg-gradient-to-br from-success/5 to-background flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-success" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Verification Successful!</h1>
          <p className="text-muted-foreground mb-8">
            Your mobile number has been verified successfully.
          </p>
          <button className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90">
            Continue to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-primary/5 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Verify OTP</h1>
          <p className="text-muted-foreground">
            Enter the 6-digit code sent to
          </p>
          <p className="text-foreground font-medium mt-1">{mobile}</p>
        </div>

        {/* Verification Card */}
        <div className="bg-card border border-border rounded-xl p-8 shadow-lg">
          {/* OTP Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-4 text-center">
              Enter OTP Code
            </label>
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={setOtp}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>

          {/* Timer */}
          <div className="text-center mb-6">
            {timeLeft > 0 ? (
              <p className="text-sm text-muted-foreground">
                OTP expires in{' '}
                <span className="font-medium text-foreground">{formatTime(timeLeft)}</span>
              </p>
            ) : (
              <p className="text-sm text-destructive">OTP has expired</p>
            )}
          </div>

          {/* Verify Button */}
          <button
            onClick={handleVerify}
            disabled={otp.length !== 6 || isVerifying || timeLeft === 0}
            className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          >
            {isVerifying ? 'Verifying...' : 'Verify OTP'}
          </button>

          {/* Resend */}
          <div className="text-center">
            <button
              onClick={handleResend}
              disabled={timeLeft > 0 || isResending}
              className="text-sm text-primary hover:underline disabled:text-muted-foreground disabled:no-underline disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
            >
              <RefreshCw className={`w-4 h-4 ${isResending ? 'animate-spin' : ''}`} aria-hidden="true" />
              {isResending ? 'Sending...' : 'Resend OTP'}
            </button>
          </div>

          {/* Help Text */}
          <div className="mt-6 pt-6 border-t border-border">
            <div className="flex items-start gap-3 p-4 bg-info/10 border border-info/20 rounded-lg">
              <Smartphone className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-info mb-1">Didn't receive the OTP?</p>
                <ul className="text-muted-foreground space-y-1">
                  <li>• Check your SMS inbox</li>
                  <li>• Ensure you have network coverage</li>
                  <li>• Wait for {formatTime(timeLeft)} before requesting again</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Secured by Government of India • MeitY
        </p>
      </div>
    </div>
  );
}
