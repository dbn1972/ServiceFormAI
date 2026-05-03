import { Mail, Phone, Lock, Eye, EyeOff, Fingerprint, Smartphone, Shield, Users, Check, AlertCircle, Loader2, Info, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, FormEvent, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { validators, formatters } from '../utils/validation';
import { toast } from 'sonner';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';

type LoginMode = 'password' | 'otp';
type LoginMethod = 'mobile' | 'email';
type OTPDelivery = 'sms' | 'whatsapp';

export default function Login() {
  const { login } = useApp();
  const [showPassword, setShowPassword] = useState(false);
  const [loginMode, setLoginMode] = useState<LoginMode>('password');
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('mobile');
  const [otpDelivery, setOTPDelivery] = useState<OTPDelivery>('sms');
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [showMoreSSO, setShowMoreSSO] = useState(false);
  const [hasBiometric, setHasBiometric] = useState(false);
  const [returningUser, setReturningUser] = useState<{ name: string; identifier: string } | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    identifier: '', // mobile or email
    password: '',
    otp: ''
  });
  
  const [errors, setErrors] = useState({
    identifier: '',
    password: '',
    otp: ''
  });

  // Check for returning user and biometric support on mount
  useEffect(() => {
    // Check for saved user preference
    const savedIdentifier = localStorage.getItem('lastLoginIdentifier');
    const savedName = localStorage.getItem('lastLoginName');
    if (savedIdentifier && savedName) {
      setReturningUser({ name: savedName, identifier: savedIdentifier });
    }

    // Check for biometric support (WebAuthn)
    if (window.PublicKeyCredential) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(available => setHasBiometric(available))
        .catch(() => setHasBiometric(false));
    }
  }, []);

  // OTP countdown timer
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [otpCountdown]);

  const handleIdentifierChange = (value: string) => {
    let formattedValue = value;
    
    if (loginMethod === 'mobile') {
      formattedValue = formatters.mobile(value);
    }
    
    setFormData(prev => ({ ...prev, identifier: formattedValue }));
    
    // Clear error when user types
    if (errors.identifier) {
      setErrors(prev => ({ ...prev, identifier: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors = { identifier: '', password: '', otp: '' };
    let isValid = true;

    // Validate identifier
    if (loginMethod === 'mobile') {
      const result = validators.mobile(formData.identifier);
      if (result !== true) {
        newErrors.identifier = result;
        isValid = false;
      }
    } else {
      const result = validators.email(formData.identifier);
      if (result !== true) {
        newErrors.identifier = result;
        isValid = false;
      }
    }

    // Validate based on login mode
    if (loginMode === 'password') {
      if (!formData.password) {
        newErrors.password = 'Password is required';
        isValid = false;
      }
    } else if (loginMode === 'otp') {
      if (!formData.otp || formData.otp.length !== 6) {
        newErrors.otp = 'Please enter the 6-digit OTP';
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSendOTP = async () => {
    // Validate identifier first
    const newErrors = { identifier: '', password: '', otp: '' };
    let isValid = true;

    if (loginMethod === 'mobile') {
      const result = validators.mobile(formData.identifier);
      if (result !== true) {
        newErrors.identifier = result;
        isValid = false;
      }
    } else {
      const result = validators.email(formData.identifier);
      if (result !== true) {
        newErrors.identifier = result;
        isValid = false;
      }
    }

    if (!isValid) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      // Simulate OTP send
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setOtpSent(true);
      setOtpCountdown(30);
      
      const deliveryMethod = otpDelivery === 'whatsapp' ? 'WhatsApp' : 'SMS';
      const maskedIdentifier = loginMethod === 'mobile' 
        ? `******${formData.identifier.slice(-4)}`
        : `${formData.identifier.slice(0, 3)}***@${formData.identifier.split('@')[1]}`;
      
      toast.success(`OTP sent via ${deliveryMethod}`, {
        description: `Check your ${loginMethod === 'mobile' ? 'phone' : 'email'} (${maskedIdentifier})`
      });
    } catch (error) {
      toast.error('Failed to send OTP', {
        description: 'Please check your connection and try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsLoading(true);

    try {
      let success = false;
      
      if (loginMode === 'password') {
        success = await login(formData.identifier, formData.password, loginMethod);
      } else {
        // OTP login simulation
        await new Promise(resolve => setTimeout(resolve, 1000));
        success = formData.otp === '123456'; // Mock OTP validation
        
        if (!success) {
          toast.error('Invalid OTP', {
            description: 'The OTP you entered is incorrect. Please check and try again.'
          });
          setIsLoading(false);
          return;
        }
        
        // Simulate login success
        await login(formData.identifier, 'otp-verified', loginMethod);
      }
      
      if (success) {
        // Save for returning user experience
        localStorage.setItem('lastLoginIdentifier', formData.identifier);
        localStorage.setItem('lastLoginName', 'Citizen User'); // This would come from the API
        
        toast.success('Welcome back!', {
          description: 'You have successfully logged in.'
        });
      } else {
        toast.error('Invalid credentials', {
          description: loginMode === 'password' 
            ? 'The password you entered is incorrect. Try "Forgot password?" if you need help.'
            : 'Authentication failed. Please try again.'
        });
      }
    } catch (error) {
      toast.error('Login failed', {
        description: 'Unable to connect to the server. Please check your internet connection.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    toast.info('Biometric login coming soon', {
      description: 'Biometric (fingerprint / face) authentication is not yet available. Please use your password to login.'
    });
  };

  const handleDigiLockerLogin = async () => {
    toast.info('DigiLocker login coming soon', {
      description: 'DigiLocker integration is not yet available. Please use your mobile number or email to login.'
    });
  };

  const handleGoogleLogin = async () => {
    toast.info('Google Sign-In coming soon', {
      description: 'Google Sign-In integration is not yet available. Please use your mobile number or email to login.'
    });
  };

  const handleMicrosoftLogin = async () => {
    toast.info('Microsoft Sign-In coming soon', {
      description: 'Microsoft Sign-In integration is not yet available. Please use your mobile number or email to login.'
    });
  };

  const handleAadhaarOTP = () => {
    toast.info('Aadhaar OTP coming soon', {
      description: 'Aadhaar OTP login is not yet available. Please use your mobile number or email to login.'
    });
  };

  const useContinueAs = () => {
    if (returningUser) {
      setFormData(prev => ({ ...prev, identifier: returningUser.identifier }));
      setLoginMethod(returningUser.identifier.includes('@') ? 'email' : 'mobile');
    }
  };

  return (
    <div className="min-h-full bg-background">
      <PublicHeader />
      
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-primary/5 to-background flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Smartphone className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold mb-2">
              {returningUser && !formData.identifier ? 'Welcome Back!' : 'Secure Access'}
            </h1>
            <p className="text-muted-foreground">
              {returningUser && !formData.identifier 
                ? `Continue to access 200+ government services`
                : 'Log in to access government services'
              }
            </p>
            
            {/* Trust Indicators */}
            <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1" role="status" aria-label="10 million users trust this platform">
                <Users className="w-4 h-4" />
                <span>10M+ Users</span>
              </div>
              <div className="flex items-center gap-1" role="status" aria-label="256-bit encryption security">
                <Shield className="w-4 h-4" />
                <span>256-bit Encrypted</span>
              </div>
            </div>
          </div>

          {/* Returning User Quick Action */}
          {returningUser && !formData.identifier && (
            <button
              onClick={useContinueAs}
              className="w-full mb-4 p-4 bg-card border-2 border-primary/20 rounded-xl hover:border-primary/40 transition-colors text-left group"
              aria-label={`Continue as ${returningUser.name}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Continue as {returningUser.name}</p>
                  <p className="text-xs text-muted-foreground">{returningUser.identifier}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </button>
          )}

          {/* Login Card */}
          <div className="bg-card border border-border rounded-xl p-6 sm:p-8 shadow-lg">
            {/* Login Mode Toggle - Password vs OTP */}
            <div className="flex gap-2 mb-6 p-1 bg-muted rounded-lg" role="tablist" aria-label="Login method selection">
              <button
                type="button"
                role="tab"
                aria-selected={loginMode === 'password'}
                aria-controls="password-login-panel"
                onClick={() => {
                  setLoginMode('password');
                  setOtpSent(false);
                  setFormData(prev => ({ ...prev, otp: '' }));
                }}
                className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${ 
                  loginMode === 'password'
                    ? 'bg-background shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Lock className="w-4 h-4 inline-block mr-2" />
                Password
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={loginMode === 'otp'}
                aria-controls="otp-login-panel"
                onClick={() => {
                  setLoginMode('otp');
                  setFormData(prev => ({ ...prev, password: '' }));
                }}
                className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
                  loginMode === 'otp'
                    ? 'bg-background shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <MessageSquare className="w-4 h-4 inline-block mr-2" />
                OTP
              </button>
            </div>

            {/* Login Method Toggle - Mobile vs Email */}
            <div className="flex gap-2 mb-6 p-1 bg-muted/50 rounded-lg" role="tablist" aria-label="Identifier type selection">
              <button
                type="button"
                role="tab"
                aria-selected={loginMethod === 'mobile'}
                onClick={() => {
                  setLoginMethod('mobile');
                  setFormData({ identifier: '', password: formData.password, otp: formData.otp });
                  setErrors({ identifier: '', password: '', otp: '' });
                  setOtpSent(false);
                }}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                  loginMethod === 'mobile'
                    ? 'bg-background shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Phone className="w-3.5 h-3.5 inline-block mr-1.5" />
                Mobile
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={loginMethod === 'email'}
                onClick={() => {
                  setLoginMethod('email');
                  setFormData({ identifier: '', password: formData.password, otp: formData.otp });
                  setErrors({ identifier: '', password: '', otp: '' });
                  setOtpSent(false);
                }}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                  loginMethod === 'email'
                    ? 'bg-background shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Mail className="w-3.5 h-3.5 inline-block mr-1.5" />
                Email
              </button>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Mobile/Email Input */}
              {loginMethod === 'mobile' ? (
                <div>
                  <label htmlFor="mobile-input" className="block text-sm font-medium mb-2">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" aria-hidden="true" />
                    <input
                      id="mobile-input"
                      type="tel"
                      value={formData.identifier}
                      onChange={(e) => handleIdentifierChange(e.target.value)}
                      placeholder="98765 43210"
                      aria-invalid={!!errors.identifier}
                      aria-describedby={errors.identifier ? "mobile-error" : undefined}
                      className={`w-full pl-10 pr-4 py-3.5 bg-input-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-all text-base sm:text-sm ${
                        errors.identifier ? 'border-destructive focus:ring-destructive' : 'border-border'
                      }`}
                    />
                  </div>
                  {errors.identifier && (
                    <div id="mobile-error" className="flex items-start gap-1.5 mt-2" role="alert">
                      <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <p className="text-sm text-destructive">{errors.identifier}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label htmlFor="email-input" className="block text-sm font-medium mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" aria-hidden="true" />
                    <input
                      id="email-input"
                      type="email"
                      value={formData.identifier}
                      onChange={(e) => handleIdentifierChange(e.target.value)}
                      placeholder="you@example.com"
                      aria-invalid={!!errors.identifier}
                      aria-describedby={errors.identifier ? "email-error" : undefined}
                      className={`w-full pl-10 pr-4 py-3.5 bg-input-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-all text-base sm:text-sm ${
                        errors.identifier ? 'border-destructive focus:ring-destructive' : 'border-border'
                      }`}
                    />
                  </div>
                  {errors.identifier && (
                    <div id="email-error" className="flex items-start gap-1.5 mt-2" role="alert">
                      <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <p className="text-sm text-destructive">{errors.identifier}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Password Login Mode */}
              {loginMode === 'password' && (
                <>
                  <div>
                    <label htmlFor="password-input" className="block text-sm font-medium mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" aria-hidden="true" />
                      <input
                        id="password-input"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, password: e.target.value }));
                          if (errors.password) {
                            setErrors(prev => ({ ...prev, password: '' }));
                          }
                        }}
                        placeholder="Enter your password"
                        aria-invalid={!!errors.password}
                        aria-describedby={errors.password ? "password-error" : undefined}
                        className={`w-full pl-10 pr-12 py-3.5 bg-input-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-all text-base sm:text-sm ${
                          errors.password ? 'border-destructive focus:ring-destructive' : 'border-border'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" aria-hidden="true" /> : <Eye className="w-5 h-5" aria-hidden="true" />}
                      </button>
                    </div>
                    {errors.password && (
                      <div id="password-error" className="flex items-start gap-1.5 mt-2" role="alert">
                        <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" aria-hidden="true" />
                        <p className="text-sm text-destructive">{errors.password}</p>
                      </div>
                    )}
                  </div>

                  {/* Remember & Forgot */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                        aria-label="Remember me for 30 days"
                      />
                      <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                        Remember me
                      </span>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="More information about remember me"
                        title="Keep you logged in on this device for 30 days"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                    </label>
                    <Link 
                      to="/forgot-password" 
                      className="text-sm text-primary hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-ring rounded px-1"
                    >
                      Forgot password?
                    </Link>
                  </div>
                </>
              )}

              {/* OTP Login Mode */}
              {loginMode === 'otp' && (
                <>
                  {!otpSent ? (
                    <>
                      {/* OTP Delivery Method */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Receive OTP via
                        </label>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => setOTPDelivery('sms')}
                            className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all text-sm ${
                              otpDelivery === 'sms'
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-border hover:border-border/60'
                            }`}
                            aria-pressed={otpDelivery === 'sms'}
                          >
                            <MessageSquare className="w-4 h-4 inline-block mr-2" aria-hidden="true" />
                            SMS
                          </button>
                          <button
                            type="button"
                            onClick={() => setOTPDelivery('whatsapp')}
                            className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all text-sm ${
                              otpDelivery === 'whatsapp'
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-border hover:border-border/60'
                            }`}
                            aria-pressed={otpDelivery === 'whatsapp'}
                          >
                            <svg className="w-4 h-4 inline-block mr-2" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                            </svg>
                            WhatsApp
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 flex items-start gap-1">
                          <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" aria-hidden="true" />
                          <span>OTP is valid for 10 minutes. Standard SMS/data charges may apply.</span>
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleSendOTP}
                        disabled={isLoading || !formData.identifier}
                        className="w-full py-3.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 flex items-center justify-center gap-2 min-h-[48px]"
                        aria-label="Send OTP to your device"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                            Sending OTP...
                          </>
                        ) : (
                          <>
                            <MessageSquare className="w-5 h-5" aria-hidden="true" />
                            Send OTP
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    <>
                      {/* OTP Input */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label htmlFor="otp-input" className="block text-sm font-medium">
                            Enter OTP
                          </label>
                          {otpCountdown > 0 && (
                            <span className="text-xs text-muted-foreground" role="timer" aria-live="polite">
                              Resend in {otpCountdown}s
                            </span>
                          )}
                        </div>
                        <input
                          id="otp-input"
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={6}
                          value={formData.otp}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            setFormData(prev => ({ ...prev, otp: value }));
                            if (errors.otp) {
                              setErrors(prev => ({ ...prev, otp: '' }));
                            }
                          }}
                          placeholder="123456"
                          aria-invalid={!!errors.otp}
                          aria-describedby={errors.otp ? "otp-error" : "otp-help"}
                          className={`w-full px-4 py-3.5 bg-input-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-all text-center text-lg tracking-widest font-mono ${
                            errors.otp ? 'border-destructive focus:ring-destructive' : 'border-border'
                          }`}
                          autoFocus
                        />
                        {errors.otp ? (
                          <div id="otp-error" className="flex items-start gap-1.5 mt-2" role="alert">
                            <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" aria-hidden="true" />
                            <p className="text-sm text-destructive">{errors.otp}</p>
                          </div>
                        ) : (
                          <p id="otp-help" className="text-xs text-muted-foreground mt-2">
                            OTP sent to {loginMethod === 'mobile' ? `******${formData.identifier.slice(-4)}` : formData.identifier}
                          </p>
                        )}
                      </div>

                      {/* Resend OTP */}
                      <button
                        type="button"
                        onClick={handleSendOTP}
                        disabled={otpCountdown > 0 || isLoading}
                        className="text-sm text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed font-medium focus:outline-none focus:ring-2 focus:ring-ring rounded px-1"
                      >
                        Didn't receive OTP? Resend
                      </button>
                    </>
                  )}
                </>
              )}

              {/* Submit Button */}
              {(loginMode === 'password' || (loginMode === 'otp' && otpSent)) && (
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 flex items-center justify-center gap-2 min-h-[48px]"
                  aria-label="Log in to your account"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                      Logging in...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" aria-hidden="true" />
                      Log In
                    </>
                  )}
                </button>
              )}
            </form>

            {/* Biometric Login (if available) */}
            {hasBiometric && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-card text-muted-foreground">Or use</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleBiometricLogin}
                  className="w-full py-3.5 border-2 border-primary/20 bg-primary/5 text-primary rounded-lg font-medium hover:border-primary/40 hover:bg-primary/10 transition-all flex items-center justify-center gap-2 min-h-[48px] focus:outline-none focus:ring-2 focus:ring-ring"
                  aria-label="Login with fingerprint or face recognition"
                >
                  <Fingerprint className="w-5 h-5" aria-hidden="true" />
                  Biometric Login
                </button>
              </>
            )}

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-card text-muted-foreground">Quick access</span>
              </div>
            </div>

            {/* Primary SSO Options */}
            <div className="space-y-3">
              {/* DigiLocker - Primary for India */}
              <button
                type="button"
                onClick={handleDigiLockerLogin}
                className="w-full py-3.5 border-2 border-border rounded-lg font-medium hover:bg-accent transition-all flex items-center justify-center gap-2 min-h-[48px] focus:outline-none focus:ring-2 focus:ring-ring group"
                aria-label="Login with DigiLocker - Verify with government issued documents"
              >
                <Fingerprint className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" aria-hidden="true" />
                <span>DigiLocker Login</span>
                <span className="ml-auto mr-2 text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Coming soon</span>
              </button>

              {/* Aadhaar OTP - Also primary for India */}
              <button
                type="button"
                onClick={handleAadhaarOTP}
                className="w-full py-3.5 border-2 border-border rounded-lg font-medium hover:bg-accent transition-all flex items-center justify-center gap-2 min-h-[48px] focus:outline-none focus:ring-2 focus:ring-ring group"
                aria-label="Aadhaar OTP login — coming soon"
              >
                <Smartphone className="w-5 h-5 text-muted-foreground group-hover:scale-110 transition-transform" aria-hidden="true" />
                <span>Aadhaar OTP</span>
                <span className="ml-auto text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Coming soon</span>
              </button>

              {/* Show More SSO Options */}
              <button
                type="button"
                onClick={() => setShowMoreSSO(!showMoreSSO)}
                className="w-full py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1 focus:outline-none focus:ring-2 focus:ring-ring rounded"
                aria-expanded={showMoreSSO}
                aria-controls="more-sso-options"
              >
                {showMoreSSO ? 'Show less options' : 'More login options'}
                {showMoreSSO ? <ChevronUp className="w-4 h-4" aria-hidden="true" /> : <ChevronDown className="w-4 h-4" aria-hidden="true" />}
              </button>

              {/* Additional SSO Options */}
              {showMoreSSO && (
                <div id="more-sso-options" className="space-y-3 pt-2 border-t border-border">
                  {/* Google Sign-In */}
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-full py-3 border border-border rounded-lg font-medium hover:bg-accent transition-all flex items-center justify-center gap-2 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-ring"
                    aria-label="Continue with Google account"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </button>

                  {/* Microsoft Sign-In */}
                  <button
                    type="button"
                    onClick={handleMicrosoftLogin}
                    className="w-full py-3 border border-border rounded-lg font-medium hover:bg-accent transition-all flex items-center justify-center gap-2 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-ring"
                    aria-label="Continue with Microsoft account"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 21 21" aria-hidden="true">
                      <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                      <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                      <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                      <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
                    </svg>
                    Continue with Microsoft
                  </button>
                </div>
              )}
            </div>

            {/* Sign Up Link */}
            <p className="text-center text-sm text-muted-foreground mt-6">
              Don't have an account?{' '}
              <Link 
                to="/register" 
                className="text-primary font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-ring rounded px-1"
              >
                Sign up
              </Link>
            </p>
          </div>

          {/* Security Footer */}
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Shield className="w-4 h-4" aria-hidden="true" />
              <span>Secured by Government of India • MeitY • SSL Encrypted</span>
            </div>
            
            {/* Help Link */}
            <p className="text-center text-xs text-muted-foreground">
              Having trouble logging in?{' '}
              <Link 
                to="/help-center" 
                className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring rounded px-1"
              >
                Get help
              </Link>
            </p>
          </div>
        </div>
      </div>
      
      <PublicFooter />
    </div>
  );
}

// Helper component for User icon (since it wasn't imported)
function User(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function ChevronRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
