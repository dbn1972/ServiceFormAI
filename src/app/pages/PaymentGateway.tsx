import { CreditCard, Smartphone, Building2, Wallet, Shield, CheckCircle, Lock, Info, ArrowLeft } from 'lucide-react';
import { useState, FormEvent, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { validators, formatters } from '../utils/validation';
import { consumerService } from '../services/api/consumer.service';

type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'wallet';

export default function PaymentGateway() {
  const { id } = useParams<{ id: string }>();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [isProcessing, _setIsProcessing] = useState(false);
  const [isPaid, _setIsPaid] = useState(false);

  // Payment details
  const [paymentDetails, setPaymentDetails] = useState({
    service: 'State Merit Scholarship Application',
    applicationId: 'APP-2026-8472',
    amount: 150,
    processingFee: 15,
    total: 165,
  });

  useEffect(() => {
    if (!id) return;
    consumerService.getApplicationById(id).then((app) => {
      const amount = (app.formData?.['payment_amount'] as number) || 150;
      const fee = Math.round(amount * 0.1);
      setPaymentDetails({
        service: app.service?.name || 'Service Application',
        applicationId: app.trackingNumber || id,
        amount,
        processingFee: fee,
        total: amount + fee,
      });
    }).catch(() => {});
  }, [id]);

  // Form states
  const [upiId, setUpiId] = useState('');
  const [upiError, setUpiError] = useState('');

  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
  });
  const [cardErrors, setCardErrors] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
  });

  const handleUPIPayment = async (e: FormEvent) => {
    e.preventDefault();

    // Validate UPI ID
    if (!upiId) {
      setUpiError('UPI ID is required');
      return;
    }

    const emailResult = validators.email(upiId);
    if (emailResult !== true) {
      setUpiError('Invalid UPI ID format');
      return;
    }

    processPayment();
  };

  const handleCardPayment = async (e: FormEvent) => {
    e.preventDefault();

    // Validate card
    const errors = {
      number: '',
      name: '',
      expiry: '',
      cvv: '',
    };

    if (!cardData.number || cardData.number.replace(/\s/g, '').length !== 16) {
      errors.number = 'Invalid card number';
    }

    if (!cardData.name) {
      errors.name = 'Cardholder name is required';
    }

    if (!cardData.expiry || !/^\d{2}\/\d{2}$/.test(cardData.expiry)) {
      errors.expiry = 'Invalid expiry (MM/YY)';
    }

    if (!cardData.cvv || cardData.cvv.length !== 3) {
      errors.cvv = 'Invalid CVV';
    }

    setCardErrors(errors);

    if (Object.values(errors).some(e => e)) {
      toast.error('Please fix the errors in the form');
      return;
    }

    processPayment();
  };

  const processPayment = async () => {
    // Payment backend is not yet active — block submission
    toast.error('Payment processing is not available yet', {
      description: 'Online payment support is coming soon. Please contact your department for offline payment options.',
    });
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ') : cleaned;
  };

  const handleCardNumberChange = (value: string) => {
    const formatted = formatCardNumber(value.replace(/\D/g, '').slice(0, 16));
    setCardData(prev => ({ ...prev, number: formatted }));
    if (cardErrors.number) setCardErrors(prev => ({ ...prev, number: '' }));
  };

  const handleExpiryChange = (value: string) => {
    let formatted = value.replace(/\D/g, '');
    if (formatted.length >= 2) {
      formatted = formatted.slice(0, 2) + '/' + formatted.slice(2, 4);
    }
    setCardData(prev => ({ ...prev, expiry: formatted }));
    if (cardErrors.expiry) setCardErrors(prev => ({ ...prev, expiry: '' }));
  };

  if (isPaid) {
    return (
      <div className="min-h-full bg-gradient-to-br from-success/5 to-background flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-success" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Payment Successful!</h1>
          <p className="text-muted-foreground mb-6">
            Your payment of {formatters.amount(paymentDetails.total)} has been processed successfully.
          </p>

          <div className="bg-card border border-border rounded-xl p-6 mb-6 text-left">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Transaction ID</span>
                <span className="text-sm font-medium">TXN{Date.now().toString().slice(-10)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Application ID</span>
                <span className="text-sm font-medium">{paymentDetails.applicationId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Amount Paid</span>
                <span className="text-sm font-medium text-success">{formatters.amount(paymentDetails.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Payment Method</span>
                <span className="text-sm font-medium capitalize">{paymentMethod.replace('-', ' ')}</span>
              </div>
            </div>
          </div>

          <button className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 mb-3">
            Download Receipt
          </button>
          <button className="w-full py-3 border border-border rounded-lg font-medium hover:bg-accent">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        {/* Coming Soon Banner */}
        <div className="mb-6 p-4 bg-warning/10 border border-warning/30 rounded-xl flex items-start gap-3" role="alert">
          <Info className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-semibold text-warning">Payment Processing — Coming Soon</p>
            <p className="text-sm text-muted-foreground mt-0.5">Online payment is not yet active. Submitting the form will not charge you. Please contact your department for offline payment options.</p>
          </div>
        </div>

        {/* Back Button */}
        <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Application</span>
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Secure Payment</h1>
          <p className="text-muted-foreground">Complete your service payment</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payment Methods */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-xl font-bold mb-6">Select Payment Method</h2>

              {/* Payment Method Tabs */}
              <div className="grid grid-cols-4 gap-3 mb-6">
                {[
                  { id: 'upi' as PaymentMethod, icon: Smartphone, label: 'UPI' },
                  { id: 'card' as PaymentMethod, icon: CreditCard, label: 'Card' },
                  { id: 'netbanking' as PaymentMethod, icon: Building2, label: 'Net Banking' },
                  { id: 'wallet' as PaymentMethod, icon: Wallet, label: 'Wallet' },
                ].map((method) => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                        paymentMethod === method.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Icon className={`w-6 h-6 ${paymentMethod === method.id ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className={`text-xs font-medium ${paymentMethod === method.id ? 'text-primary' : 'text-muted-foreground'}`}>
                        {method.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* UPI Payment */}
              {paymentMethod === 'upi' && (
                <form onSubmit={handleUPIPayment} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Enter UPI ID</label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => {
                          setUpiId(e.target.value);
                          setUpiError('');
                        }}
                        placeholder="yourname@upi"
                        className={`w-full pl-10 pr-4 py-3 bg-input-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring ${
                          upiError ? 'border-destructive' : 'border-border'
                        }`}
                      />
                    </div>
                    {upiError && (
                      <p className="text-sm text-destructive mt-1">{upiError}</p>
                    )}
                  </div>

                  <div className="bg-info/10 border border-info/20 rounded-lg p-4">
                    <p className="text-sm flex items-start gap-2">
                      <Info className="w-4 h-4 text-info flex-shrink-0 mt-0.5" />
                      <span>You'll receive a payment request on your UPI app. Please approve within 5 minutes.</span>
                    </p>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground mb-3">Quick Pay via</p>
                    <div className="grid grid-cols-4 gap-3">
                      {['Google Pay', 'PhonePe', 'Paytm', 'BHIM'].map((app) => (
                        <button 
                          key={app} 
                          type="button"
                          onClick={() => {
                            setUpiId(`user@${app.toLowerCase().replace(' ', '')}`);
                            setUpiError('');
                          }}
                          className="p-3 border border-border rounded-lg hover:bg-accent text-sm font-medium"
                        >
                          {app}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? 'Processing...' : `Pay ${formatters.amount(paymentDetails.total)}`}
                  </button>
                </form>
              )}

              {/* Card Payment */}
              {paymentMethod === 'card' && (
                <form onSubmit={handleCardPayment} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Card Number</label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="text"
                        value={cardData.number}
                        onChange={(e) => handleCardNumberChange(e.target.value)}
                        placeholder="1234 5678 9012 3456"
                        className={`w-full pl-10 pr-4 py-3 bg-input-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring ${
                          cardErrors.number ? 'border-destructive' : 'border-border'
                        }`}
                      />
                    </div>
                    {cardErrors.number && (
                      <p className="text-sm text-destructive mt-1">{cardErrors.number}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Cardholder Name</label>
                    <input
                      type="text"
                      value={cardData.name}
                      onChange={(e) => {
                        setCardData(prev => ({ ...prev, name: e.target.value }));
                        if (cardErrors.name) setCardErrors(prev => ({ ...prev, name: '' }));
                      }}
                      placeholder="Name on card"
                      className={`w-full px-4 py-3 bg-input-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring ${
                        cardErrors.name ? 'border-destructive' : 'border-border'
                      }`}
                    />
                    {cardErrors.name && (
                      <p className="text-sm text-destructive mt-1">{cardErrors.name}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Expiry Date</label>
                      <input
                        type="text"
                        value={cardData.expiry}
                        onChange={(e) => handleExpiryChange(e.target.value)}
                        placeholder="MM/YY"
                        maxLength={5}
                        className={`w-full px-4 py-3 bg-input-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring ${
                          cardErrors.expiry ? 'border-destructive' : 'border-border'
                        }`}
                      />
                      {cardErrors.expiry && (
                        <p className="text-sm text-destructive mt-1">{cardErrors.expiry}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">CVV</label>
                      <input
                        type="password"
                        value={cardData.cvv}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 3);
                          setCardData(prev => ({ ...prev, cvv: value }));
                          if (cardErrors.cvv) setCardErrors(prev => ({ ...prev, cvv: '' }));
                        }}
                        placeholder="123"
                        maxLength={3}
                        className={`w-full px-4 py-3 bg-input-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring ${
                          cardErrors.cvv ? 'border-destructive' : 'border-border'
                        }`}
                      />
                      {cardErrors.cvv && (
                        <p className="text-sm text-destructive mt-1">{cardErrors.cvv}</p>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? 'Processing...' : `Pay ${formatters.amount(paymentDetails.total)}`}
                  </button>
                </form>
              )}

              {/* Other payment methods */}
              {(paymentMethod === 'netbanking' || paymentMethod === 'wallet') && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    {paymentMethod === 'netbanking' ? 'Net Banking' : 'Wallet'} integration coming soon!
                  </p>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    className="text-primary hover:underline"
                  >
                    Try UPI instead
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-card border border-border rounded-xl p-6 sticky top-6">
              <h3 className="font-semibold mb-4">Order Summary</h3>

              <div className="space-y-3 mb-6">
                <div>
                  <p className="text-sm font-medium mb-1">{paymentDetails.service}</p>
                  <p className="text-xs text-muted-foreground">ID: {paymentDetails.applicationId}</p>
                </div>

                <div className="pt-3 border-t border-border space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Service Fee</span>
                    <span>{formatters.amount(paymentDetails.amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Processing Fee</span>
                    <span>{formatters.amount(paymentDetails.processingFee)}</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-2 border-t border-border">
                    <span>Total Amount</span>
                    <span className="text-primary">{formatters.amount(paymentDetails.total)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-success/10 border border-success/20 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <Shield className="w-5 h-5 text-success flex-shrink-0" />
                  <div className="text-xs">
                    <p className="font-medium text-success mb-1">100% Secure Payment</p>
                    <p className="text-muted-foreground">Your payment information is encrypted and secure</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Lock className="w-4 h-4" />
                <span>256-bit SSL encryption</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
