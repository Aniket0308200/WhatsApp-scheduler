import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { createWorker } from 'tesseract.js';
import QRCode from 'qrcode';
import { fetchSubscriptionConfig, submitSubscriptionPayment } from '../api';

const DEFAULT_UPI_ID = 'aniketchouhan314@okicici';
const DEFAULT_UPI_NAME = 'Aniket Vinod Chouhan';

export const PLANS_INFO = {
  starter: {
    key: 'starter',
    name: 'Starter Plan',
    pricing: {
      monthly: {
        amount: 199,
        originalAmount: 249,
        interval: 'month',
        label: '₹199 / month'
      },
      yearly: {
        amount: 1999,
        originalAmount: 2400,
        interval: 'year',
        discountText: 'Save ₹401 (Special Offer)',
        label: '₹1,999 / year'
      }
    },
    symbol: '₹',
    badge: 'Popular',
    icon: '⚡',
    monthlyLimit: 250,
    features: [
      '250 Scheduled Messages / month',
      'Send to up to 20 Contacts at once',
      'Send to up to 10 Groups at once',
      'Images, Audio, Docs & Stickers support',
      'Recurring Schedules (Daily / Weekly repeats)',
      'Smart Name Variables ({Name})',
      'Google Contacts Sync (up to 2 accounts)',
      'Priority Delivery Queue'
    ]
  },
  pro: {
    key: 'pro',
    name: 'Pro Plan',
    pricing: {
      monthly: {
        amount: 499,
        originalAmount: 599,
        interval: 'month',
        label: '₹499 / month'
      },
      yearly: {
        amount: 4999,
        originalAmount: 6000,
        interval: 'year',
        discountText: 'Save ₹1,001 (Mega Offer)',
        label: '₹4,999 / year'
      }
    },
    symbol: '₹',
    badge: 'Ultimate Power',
    icon: '🚀',
    monthlyLimit: 100000,
    isUnlimited: true,
    features: [
      '👑 100% Unlimited Scheduled Messages',
      'Unlimited Contacts & Groups at once',
      'All Media (Videos, Documents, PDFs, Audio)',
      'Smart Media Editor (Draw, Shapes, Arrows, Blur & Text)',
      'WhatsApp Poll Scheduling',
      'Smart Timezone Auto-Adjustment',
      'Google Contacts Multi-Account Sync',
      'VIP 24/7 Priority Support & Fast Server Dispatch'
    ]
  }
};

export default function PaymentModal({
  isOpen,
  onClose,
  initialPlan = 'starter',
  initialCycle = 'monthly',
  authUser,
  connectedPhone = null,
  currentPlan = 'free',
  onSuccess
}) {
  // Step Wizard State: 1 = Details, 2 = Scanner, 3 = Verification Proof, 4 = Congratulations
  const [step, setStep] = useState(1);

  // Form selections
  const [selectedPlan, setSelectedPlan] = useState(initialPlan === 'pro' ? 'pro' : 'starter');
  const [billingCycle, setBillingCycle] = useState(initialCycle === 'yearly' ? 'yearly' : 'monthly');
  const [name, setName] = useState(authUser?.name || '');
  const [email, setEmail] = useState(authUser?.email || '');
  const [phone, setPhone] = useState(
    connectedPhone
      ? `+${connectedPhone.replace(/\D/g, '')}`
      : authUser?.linkedWhatsAppPhone
      ? `+${authUser.linkedWhatsAppPhone.replace(/\D/g, '')}`
      : ''
  );

  // Step 2 & 3: Payment details
  const [utr, setUtr] = useState('');
  const [screenshotData, setScreenshotData] = useState(null);
  const [screenshotName, setScreenshotName] = useState('');
  const [screenshotSize, setScreenshotSize] = useState('');

  // 30-Minute Scanner window timer
  const [secondsRemaining, setSecondsRemaining] = useState(30 * 60);
  const [scannerStarted, setScannerStarted] = useState(false);
  const [scannerActivatedAt, setScannerActivatedAt] = useState(null);

  // Dynamic QR Code data URL
  const [dynamicQrUrl, setDynamicQrUrl] = useState(null);
  const [upiConfig, setUpiConfig] = useState({
    upiId: DEFAULT_UPI_ID,
    upiName: DEFAULT_UPI_NAME
  });

  // Verification & OCR states
  const [isCheckingOcr, setIsCheckingOcr] = useState(false);
  const [ocrVerified, setOcrVerified] = useState(false);
  const [ocrErrors, setOcrErrors] = useState([]);
  const [ocrExtractedData, setOcrExtractedData] = useState(null);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);

  const fileInputRef = useRef(null);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedPlan(initialPlan === 'pro' ? 'pro' : 'starter');
      setBillingCycle(initialCycle === 'yearly' ? 'yearly' : 'monthly');
      setName(authUser?.name || '');
      setEmail(authUser?.email || '');
      if (connectedPhone) {
        const clean = connectedPhone.replace(/\D/g, '');
        setPhone(clean.startsWith('+') ? clean : `+${clean}`);
      } else if (authUser?.linkedWhatsAppPhone) {
        const clean = authUser.linkedWhatsAppPhone.replace(/\D/g, '');
        setPhone(clean.startsWith('+') ? clean : `+${clean}`);
      }
      setUtr('');
      setScreenshotData(null);
      setScreenshotName('');
      setScreenshotSize('');
      setOcrVerified(false);
      setOcrErrors([]);
      setOcrExtractedData(null);
      setScannerStarted(false);
      setScannerActivatedAt(null);
      setSecondsRemaining(30 * 60);
      setSubmittedData(null);
    }
  }, [isOpen, initialPlan, initialCycle, authUser, connectedPhone]);

  // Load backend UPI config
  useEffect(() => {
    let isMounted = true;
    fetchSubscriptionConfig()
      .then((data) => {
        if (isMounted && data) {
          setUpiConfig({
            upiId: data.upiId || DEFAULT_UPI_ID,
            upiName: data.upiName || DEFAULT_UPI_NAME
          });
        }
      })
      .catch((err) => {
        console.warn('Using default UPI config:', err.message);
      });
    return () => { isMounted = false; };
  }, []);

  // Compute active plan details and current amount
  const planInfo = PLANS_INFO[selectedPlan] || PLANS_INFO.starter;
  const currentPricing = planInfo.pricing[billingCycle] || planInfo.pricing.monthly;
  const activeAmount = currentPricing.amount;

  // Generate dynamic QR code whenever plan, cycle, or upiId changes
  useEffect(() => {
    const upiId = upiConfig.upiId || DEFAULT_UPI_ID;
    const payeeName = upiConfig.upiName || DEFAULT_UPI_NAME;
    const note = `WA Scheduler ${planInfo.name} (${billingCycle})`;
    const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${activeAmount}&cu=INR&tn=${encodeURIComponent(note)}`;

    QRCode.toDataURL(upiUri, {
      width: 280,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
      .then((url) => setDynamicQrUrl(url))
      .catch(() => setDynamicQrUrl(null));
  }, [selectedPlan, billingCycle, activeAmount, upiConfig.upiId, upiConfig.upiName]);

  // 30-Minute Countdown Timer once user enters Step 2
  useEffect(() => {
    let timer = null;
    if (scannerStarted && secondsRemaining > 0 && step >= 2 && step <= 3) {
      timer = setInterval(() => {
        setSecondsRemaining((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [scannerStarted, secondsRemaining, step]);

  if (!isOpen) return null;

  // Format seconds to MM:SS
  const formatTime = (totalSecs) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  // ── Step 1 Validation -> Proceed to Step 2 ──
  const handleProceedToScanner = (e) => {
    e.preventDefault();
    if (!name || name.trim().length < 2) {
      toast.error('Please enter your full name.');
      return;
    }
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      toast.error('Please enter your WhatsApp phone number with country code (e.g. +91 9876543210).');
      return;
    }

    if (!scannerStarted) {
      setScannerStarted(true);
      setScannerActivatedAt(new Date());
      setSecondsRemaining(30 * 60);
    }

    setStep(2);
  };

  // ── Step 2 -> Proceed to Step 3 ──
  const handleProceedToProof = () => {
    setStep(3);
  };

  // Handle UTR change
  const handleUtrChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 12);
    setUtr(value);
    setOcrVerified(false);
    setOcrErrors([]);
  };

  // Handle Screenshot file upload
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Screenshot size exceeds 10MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setScreenshotData(event.target?.result);
      setScreenshotName(file.name);
      setScreenshotSize((file.size / 1024).toFixed(1) + ' KB');
      setOcrVerified(false);
      setOcrErrors([]);
    };
    reader.readAsDataURL(file);
  };

  // ── Smart OCR Verification Check ──
  const handleVerifyOcr = async () => {
    if (!utr || utr.length !== 12) {
      toast.error('Please enter the full 12-digit UTR ID first.');
      return;
    }

    if (!screenshotData) {
      toast.error('Please upload your payment screenshot first.');
      return;
    }

    setIsCheckingOcr(true);
    setOcrErrors([]);
    setOcrVerified(false);

    const toastId = toast.loading('🔍 Scanning payment screenshot with AI OCR…');

    try {
      const worker = await createWorker('eng');
      const ret = await worker.recognize(screenshotData);
      const rawText = ret?.data?.text || '';
      const upperText = rawText.toUpperCase();
      await worker.terminate();

      const errors = [];
      const expectedAmount = activeAmount;

      // 1. Amount verification
      const rawHasExpected = rawText.includes(String(expectedAmount));
      if (!rawHasExpected) {
        errors.push(`Amount Mismatch: Could not verify ₹${expectedAmount} in screenshot.`);
      }

      // 2. Payee / Recipient check
      const isPaidToAniket =
        upperText.includes('ANIKET') ||
        upperText.includes('ANIKET VINOD') ||
        upperText.includes('ANIKETCHOUHAN314') ||
        upperText.includes('WA SCHEDULER');

      if (!isPaidToAniket) {
        errors.push('Recipient Check: Ensure payment was sent to official UPI ID (aniketchouhan314@okicici).');
      }

      // 3. UTR Check
      const cleanUtr = utr.trim();
      const hasUtr = rawText.replace(/\s+/g, '').includes(cleanUtr);
      if (!hasUtr) {
        errors.push(`UTR Mismatch: Entered UTR "${cleanUtr}" not clearly visible in screenshot.`);
      }

      if (errors.length > 0) {
        setOcrErrors(errors);
        setOcrVerified(false);
        toast.error(`Verification Warning: ${errors[0]} (Admin will verify manually)`, { id: toastId, duration: 6000 });
      } else {
        setOcrErrors([]);
        setOcrVerified(true);
        setOcrExtractedData({
          amount: `₹${expectedAmount}`,
          utr: cleanUtr,
          recipient: 'Verified'
        });
        toast.success(`✓ 100% Match! Amount (₹${expectedAmount}) & UTR verified.`, { id: toastId, duration: 5000 });
      }
    } catch (err) {
      console.warn('OCR error:', err.message);
      toast.error('Could not auto-read screenshot clearly. Admin will verify manually.', { id: toastId });
    } finally {
      setIsCheckingOcr(false);
    }
  };

  // ── Step 3: Final Submit Payment ──
  const handleSubmitPayment = async (e) => {
    e.preventDefault();

    if (!utr || utr.length !== 12) {
      toast.error('Please enter your 12-digit UPI UTR number.');
      return;
    }

    if (!screenshotData) {
      toast.error('Please upload your payment screenshot.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await submitSubscriptionPayment({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        plan: selectedPlan,
        billingCycle,
        utr: utr.trim(),
        screenshotUrl: screenshotData,
        scannerActivatedAt: scannerActivatedAt ? scannerActivatedAt.toISOString() : new Date().toISOString()
      });

      setSubmittedData({
        planName: planInfo.name,
        billingCycle: billingCycle === 'yearly' ? 'Yearly' : 'Monthly',
        amount: activeAmount,
        utr: utr.trim(),
        email: email.trim(),
        name: name.trim(),
        submittedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });

      setStep(4);
      toast.success('🎉 Payment submitted! Admin verification initiated.');
      onSuccess?.(response);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to submit payment details. Please try again.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-wa-dpanel text-slate-900 dark:text-wa-dtext rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-wa-dbdr overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[95vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header & Progress Wizard Indicator */}
        <div className="bg-gradient-to-r from-wa-dark via-[#0d4f43] to-wa-teal p-4 sm:p-5 text-white relative">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-2.5">
              <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-base sm:text-lg">
                💳
              </span>
              <div>
                <h3 className="text-sm sm:text-lg font-black tracking-tight leading-tight">
                  Upgrade to {planInfo.name}
                </h3>
                <p className="text-[10px] sm:text-[11px] text-emerald-200 font-medium">
                  {billingCycle === 'yearly' ? 'Yearly Membership with Big Savings' : 'Monthly Flexible Subscription'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs sm:text-sm font-bold transition-colors"
              title="Close"
            >
              ✕
            </button>
          </div>

          {/* 4-Step Progress Bar */}
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2 pt-0.5 text-center select-none">
            {[
              { num: 1, label: 'Plan' },
              { num: 2, label: 'Scanner' },
              { num: 3, label: 'Proof' },
              { num: 4, label: 'Success' }
            ].map((s) => (
              <div key={s.num} className="flex flex-col items-center">
                <div
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[11px] sm:text-xs font-black transition-all ${
                    step > s.num
                      ? 'bg-emerald-400 text-slate-900 font-extrabold shadow-md'
                      : step === s.num
                      ? 'bg-white text-emerald-800 shadow-md ring-2 ring-emerald-300'
                      : 'bg-white/20 text-white/70'
                  }`}
                >
                  {step > s.num ? '✓' : s.num}
                </div>
                <span
                  className={`text-[9px] sm:text-[10px] mt-1 font-semibold truncate ${
                    step === s.num ? 'text-white font-bold' : 'text-emerald-200/70'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scroll flex-1">
          {/* ───────────────────────────────────────────────────────────── */}
          {/* STEP 1: PLAN SELECTION & USER DETAILS                         */}
          {/* ───────────────────────────────────────────────────────────── */}
          {step === 1 && (
            <form onSubmit={handleProceedToScanner} className="space-y-6">
              {/* Billing Cycle Switcher */}
              <div className="flex items-center justify-center">
                <div className="inline-flex items-center bg-slate-100 dark:bg-wa-dsurf p-1 rounded-full border border-slate-200 dark:border-wa-dbdr shadow-inner">
                  <button
                    type="button"
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                      billingCycle === 'monthly'
                        ? 'bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-wa-dmuted hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Monthly Billing
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCycle('yearly')}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                      billingCycle === 'yearly'
                        ? 'bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-wa-dmuted hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span>Yearly Billing</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500 text-white">
                      Discount Offer
                    </span>
                  </button>
                </div>
              </div>

              {/* Plan Choice Cards (Starter vs Pro) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Starter Plan */}
                <div
                  onClick={() => setSelectedPlan('starter')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    selectedPlan === 'starter'
                      ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-md'
                      : 'border-slate-200 dark:border-wa-dbdr hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>⚡</span> Starter Plan
                    </span>
                    <input
                      type="radio"
                      checked={selectedPlan === 'starter'}
                      onChange={() => setSelectedPlan('starter')}
                      className="accent-emerald-600"
                    />
                  </div>
                  <div className="my-2">
                    {billingCycle === 'yearly' ? (
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xs text-slate-400 line-through">₹2,400</span>
                        <span className="text-xl font-black text-slate-900 dark:text-white">₹1,999</span>
                        <span className="text-[11px] text-slate-500">/ year</span>
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-black text-slate-900 dark:text-white">₹199</span>
                        <span className="text-[11px] text-slate-500">/ month</span>
                      </div>
                    )}
                    {billingCycle === 'yearly' && (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                        🔥 Save ₹401 (Special Yearly Offer)
                      </span>
                    )}
                  </div>
                  <ul className="text-[11px] space-y-1 text-slate-600 dark:text-wa-dmuted mt-3">
                    <li>✓ 250 Messages / month</li>
                    <li>✓ 20 Contacts & 10 Groups at once</li>
                    <li>✓ Images, Audio & Stickers</li>
                  </ul>
                </div>

                {/* Pro Plan */}
                <div
                  onClick={() => setSelectedPlan('pro')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    selectedPlan === 'pro'
                      ? 'border-purple-500 bg-purple-50/40 dark:bg-purple-950/20 shadow-md'
                      : 'border-slate-200 dark:border-wa-dbdr hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>🚀</span> Pro Plan
                    </span>
                    <input
                      type="radio"
                      checked={selectedPlan === 'pro'}
                      onChange={() => setSelectedPlan('pro')}
                      className="accent-purple-600"
                    />
                  </div>
                  <div className="my-2">
                    {billingCycle === 'yearly' ? (
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xs text-slate-400 line-through">₹6,000</span>
                        <span className="text-xl font-black text-purple-700 dark:text-purple-300">₹4,999</span>
                        <span className="text-[11px] text-slate-500">/ year</span>
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-black text-purple-700 dark:text-purple-300">₹499</span>
                        <span className="text-[11px] text-slate-500">/ month</span>
                      </div>
                    )}
                    {billingCycle === 'yearly' && (
                      <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 block mt-0.5">
                        👑 Save ₹1,001 (Mega Yearly Offer)
                      </span>
                    )}
                  </div>
                  <ul className="text-[11px] space-y-1 text-slate-600 dark:text-wa-dmuted mt-3">
                    <li>✓ 👑 Unlimited Scheduled Messages</li>
                    <li>✓ Unlimited Contacts & Groups</li>
                    <li>✓ Videos, Documents, PDFs & Editor</li>
                  </ul>
                </div>
              </div>

              {/* User Identity Details Fields */}
              <div className="space-y-3.5 bg-slate-50 dark:bg-wa-dsurf/60 p-4 rounded-2xl border border-slate-200 dark:border-wa-dbdr">
                <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                  👤 Your Account Details
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-wa-dpanel border border-slate-300 dark:border-wa-dbdr text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Account Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-wa-dpanel border border-slate-300 dark:border-wa-dbdr text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    WhatsApp Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-wa-dpanel border border-slate-300 dark:border-wa-dbdr text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                    required
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Include country code (+91 for India). Your plan will be linked to this number.
                  </p>
                </div>
              </div>

              {/* Next Step Button */}
              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-2xl font-black text-sm bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/25 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <span>Next: Scan & Pay ₹{activeAmount}</span>
                <span>→</span>
              </button>
            </form>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* STEP 2: DYNAMIC SCANNER ONLY (CLEAN UI & NO UPI ID DISPLAY)  */}
          {/* ───────────────────────────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-4 sm:space-y-5">
              {/* 30-Minute Timer Badge */}
              <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                    Payment Window Active:
                  </span>
                </div>
                <div className="font-mono text-xs sm:text-sm font-black text-amber-700 dark:text-amber-300">
                  ⏳ {formatTime(secondsRemaining)}
                </div>
              </div>

              {/* QR Code Container - Pure Scanner Only */}
              <div className="flex flex-col items-center justify-center bg-slate-50 dark:bg-wa-dsurf/40 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-wa-dbdr">
                <div className="text-center mb-2.5">
                  <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-wa-dmuted">
                    Exact Payable Amount
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-0.5">
                    ₹{activeAmount}
                  </div>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                    {planInfo.name} ({billingCycle === 'yearly' ? 'Full Year' : 'Monthly'})
                  </div>
                </div>

                {/* QR Image Box */}
                <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200 my-1">
                  {dynamicQrUrl ? (
                    <img
                      src={dynamicQrUrl}
                      alt="UPI Payment QR Code"
                      className="w-48 h-48 sm:w-60 sm:h-60 object-contain rounded-xl"
                    />
                  ) : (
                    <div className="w-48 h-48 sm:w-60 sm:h-60 flex items-center justify-center text-xs text-slate-400">
                      Generating Scanner…
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 dark:text-wa-dmuted mt-2.5 text-center">
                  Scan with <strong>Google Pay</strong>, <strong>PhonePe</strong>, <strong>Paytm</strong>, or any UPI payment app on your phone.
                </p>
              </div>

              {/* Supported UPI Apps Pills */}
              <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap text-[10px] sm:text-[11px] text-slate-500">
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-wa-dsurf border border-slate-200 dark:border-wa-dbdr font-medium">
                  🟢 Google Pay
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-wa-dsurf border border-slate-200 dark:border-wa-dbdr font-medium">
                  🟣 PhonePe
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-wa-dsurf border border-slate-200 dark:border-wa-dbdr font-medium">
                  🔵 Paytm
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-wa-dsurf border border-slate-200 dark:border-wa-dbdr font-medium">
                  🟠 BHIM / Any UPI
                </span>
              </div>

              {/* Step 2 Navigation Buttons */}
              <div className="flex items-center gap-2 sm:gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="py-2.5 sm:py-3 px-4 sm:px-5 rounded-2xl font-bold text-xs sm:text-sm bg-slate-100 dark:bg-wa-dsurf text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={handleProceedToProof}
                  className="flex-1 py-2.5 sm:py-3 px-4 sm:px-6 rounded-2xl font-black text-xs sm:text-sm bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/25 active:scale-98 transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Paid? Enter UTR &amp; Proof</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* STEP 3: UTR INPUT & SCREENSHOT VERIFICATION PROOF              */}
          {/* ───────────────────────────────────────────────────────────── */}
          {step === 3 && (
            <form onSubmit={handleSubmitPayment} className="space-y-6">
              {/* Payment Summary Pill */}
              <div className="bg-slate-50 dark:bg-wa-dsurf/50 p-3.5 rounded-2xl border border-slate-200 dark:border-wa-dbdr flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 dark:text-wa-dmuted block text-[10px]">Plan &amp; Amount:</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    {planInfo.name} ({billingCycle === 'yearly' ? 'Yearly' : 'Monthly'}) — ₹{activeAmount}
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Step 3 of 4
                </span>
              </div>

              {/* 12-Digit UTR Input */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  12-Digit UPI UTR / Reference ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={utr}
                  onChange={handleUtrChange}
                  placeholder="e.g. 431289564120"
                  maxLength={12}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-wa-dsurf border-2 border-slate-200 dark:border-wa-dbdr focus:border-emerald-500 font-mono text-sm tracking-wider text-slate-900 dark:text-white outline-none"
                  required
                />
                <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                  <span>Found in transaction receipt (Google Pay / PhonePe / Paytm)</span>
                  <span className="font-mono">{utr.length}/12 Digits</span>
                </div>
              </div>

              {/* Screenshot Upload Dropzone */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Payment Screenshot Proof <span className="text-red-500">*</span>
                </label>

                {!screenshotData ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 dark:border-wa-dbdr hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl p-6 text-center cursor-pointer bg-slate-50 dark:bg-wa-dsurf/30 transition-all group"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-emerald-500/10 group-hover:bg-emerald-500/20 text-emerald-600 flex items-center justify-center text-2xl transition-all">
                      📷
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Click to upload payment screenshot
                    </span>
                    <span className="text-[11px] text-slate-500 mt-0.5 block">
                      PNG, JPG, WEBP up to 10MB
                    </span>
                  </div>
                ) : (
                  <div className="relative rounded-2xl border-2 border-emerald-500/50 p-3 bg-emerald-50/20 dark:bg-emerald-950/20 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={screenshotData}
                        alt="Uploaded screenshot"
                        className="w-14 h-14 object-cover rounded-xl border border-slate-300 dark:border-wa-dbdr shadow-xs"
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">
                          {screenshotName || 'Screenshot.png'}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          {screenshotSize} • Image Ready
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setScreenshotData(null);
                        setScreenshotName('');
                        setScreenshotSize('');
                        setOcrVerified(false);
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-100 hover:bg-red-200 text-red-700 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* OCR Verify Button & Results */}
              {screenshotData && (
                <div className="space-y-2">
                  <button
                    type="button"
                    disabled={isCheckingOcr || !utr || utr.length !== 12}
                    onClick={handleVerifyOcr}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                      ocrVerified
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                        : 'bg-slate-100 dark:bg-wa-dsurf text-slate-800 dark:text-wa-dtext border-slate-300 dark:border-wa-dbdr hover:bg-slate-200'
                    }`}
                  >
                    {isCheckingOcr ? (
                      <>
                        <span className="animate-spin">🔄</span>
                        <span>Scanning via AI OCR…</span>
                      </>
                    ) : ocrVerified ? (
                      <>
                        <span>✓</span>
                        <span>Screenshot &amp; UTR 100% Verified!</span>
                      </>
                    ) : (
                      <>
                        <span>🔍</span>
                        <span>Auto-Check Proof with AI OCR</span>
                      </>
                    )}
                  </button>

                  {ocrErrors.length > 0 && (
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-[11px] text-amber-800 dark:text-amber-300">
                      <strong>Note:</strong> {ocrErrors[0]} (Don't worry, our admin team will manually verify it!).
                    </div>
                  )}
                </div>
              )}

              {/* Step 3 Navigation Buttons */}
              <div className="flex items-center gap-2 sm:gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="py-2.5 sm:py-3 px-4 sm:px-5 rounded-2xl font-bold text-xs sm:text-sm bg-slate-100 dark:bg-wa-dsurf text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={submitting || !utr || utr.length !== 12 || !screenshotData}
                  className={`flex-1 py-2.5 sm:py-3 px-4 sm:px-6 rounded-2xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 ${
                    submitting || !utr || utr.length !== 12 || !screenshotData
                      ? 'bg-slate-300 dark:bg-wa-dsurf text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/25 active:scale-98'
                  }`}
                >
                  {submitting ? (
                    <>
                      <span className="animate-spin">🔄</span>
                      <span>Submitting Payment…</span>
                    </>
                  ) : (
                    <>
                      <span>Submit &amp; Verify Payment</span>
                      <span>✓</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* STEP 4: CONGRATULATIONS & 24H REASSURANCE SCREEN              */}
          {/* ───────────────────────────────────────────────────────────── */}
          {step === 4 && (
            <div className="text-center py-4 space-y-6 animate-fade-in">
              {/* Celebration Icon */}
              <div className="relative inline-block">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-4xl shadow-xl shadow-emerald-500/30 animate-bounce">
                  🎉
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm border-2 border-white dark:border-wa-dpanel">
                  ✓
                </div>
              </div>

              {/* Title Banner */}
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Congratulations! Payment Submitted
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-wa-dmuted">
                  Your upgrade request for <strong>{submittedData?.planName}</strong> has been received successfully.
                </p>
              </div>

              {/* Crucial 24-Hour Reassurance Box */}
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-500/40 rounded-2xl p-4 sm:p-5 text-left space-y-2">
                <div className="flex items-center gap-2 text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                  <span>🛡️</span>
                  <span>100% Peace of Mind Guarantee</span>
                </div>
                <p className="text-xs sm:text-sm text-emerald-900 dark:text-emerald-100 font-semibold leading-relaxed">
                  "If plan is not activated immediately, our admin team will verify and activate it within 24 hours. Don't worry!"
                </p>
                <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80 leading-normal">
                  If your upgraded plan does not reflect immediately, rest assured our verification team will validate your receipt and confirm your subscription within <strong>24 hours</strong>.
                </p>
              </div>

              {/* Summary Details Card */}
              {submittedData && (
                <div className="bg-slate-50 dark:bg-wa-dsurf rounded-2xl p-4 border border-slate-200 dark:border-wa-dbdr text-left space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200 dark:border-wa-dbdr">
                    <span className="text-slate-500">Plan &amp; Cycle:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {submittedData.planName} ({submittedData.billingCycle})
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200 dark:border-wa-dbdr">
                    <span className="text-slate-500">Amount Paid:</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400">
                      ₹{submittedData.amount}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200 dark:border-wa-dbdr">
                    <span className="text-slate-500">12-Digit UTR:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {submittedData.utr}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Account Email:</span>
                    <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[200px]">
                      {submittedData.email}
                    </span>
                  </div>
                </div>
              )}

              {/* Final Done Button */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  window.location.reload();
                }}
                className="w-full py-3.5 px-6 rounded-2xl font-black text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/25 active:scale-98 transition-all"
              >
                Done &amp; Return to Dashboard ✓
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
