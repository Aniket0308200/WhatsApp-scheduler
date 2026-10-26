import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { createWorker } from 'tesseract.js';
import QRCode from 'qrcode';
import { fetchSubscriptionConfig, submitSubscriptionPayment } from '../api';

const DEFAULT_UPI_ID = 'aniketchouhan314@okicici';
const DEFAULT_UPI_NAME = 'WA Scheduler';
const SCANNER_IMAGE_URL = '/upi-qr-scanner.png';

const PLANS = {
  starter: {
    key: 'starter',
    name: 'Starter Plan',
    amount: 199,
    currency: 'INR',
    symbol: '₹',
    badge: 'Popular',
    icon: '⚡',
    monthlyLimit: 250,
    features: [
      '250 Scheduled Messages / month',
      'Send to up to 20 Contacts at once',
      'Send to up to 10 Groups at once',
      'Images, Audio & Stickers support',
      'Recurring Schedules (Daily / Weekly repeats)',
      'Smart Name Variables ({Name})',
      'Google Contacts Sync (up to 2 accounts)'
    ]
  },
  pro: {
    key: 'pro',
    name: 'Pro Plan',
    amount: 499,
    currency: 'INR',
    symbol: '₹',
    badge: 'Ultimate Power',
    icon: '🚀',
    monthlyLimit: 1000,
    features: [
      'Unlimited / 1,000 Messages / month',
      'Unlimited Contacts & Groups at once',
      'All Media (Videos, Documents, PDFs, Audio)',
      'WhatsApp Status & Story Scheduling',
      'WhatsApp Poll Scheduling',
      'Smart Timezone Auto-Adjustment',
      'Google Contacts Sync (Multi-Account)',
      'Priority Delivery Queue & VIP 24/7 Support'
    ]
  }
};

export default function PaymentModal({
  isOpen,
  onClose,
  initialPlan = 'starter',
  authUser,
  connectedPhone = null,
  currentPlan = 'free',
  onSuccess
}) {
  const [selectedPlan, setSelectedPlan] = useState(initialPlan === 'pro' ? 'pro' : 'starter');
  const [currency, setCurrency] = useState('INR');
  const [phone, setPhone] = useState(connectedPhone ? `+${connectedPhone.replace(/\D/g, '')}` : (authUser?.linkedWhatsAppPhone || ''));
  const [email, setEmail] = useState(authUser?.email || '');
  const [utr, setUtr] = useState('');
  const [screenshotData, setScreenshotData] = useState(null);
  const [screenshotName, setScreenshotName] = useState('');
  const [screenshotSize, setScreenshotSize] = useState('');

  // 30-Minute Scanner Reveal & Live Countdown Timer State
  const [isScannerVisible, setIsScannerVisible] = useState(false);
  const [scannerActivatedAt, setScannerActivatedAt] = useState(null);
  const [secondsRemaining, setSecondsRemaining] = useState(30 * 60); // 1800 seconds (30 mins)

  const [upiConfig, setUpiConfig] = useState({
    upiId: DEFAULT_UPI_ID,
    upiName: DEFAULT_UPI_NAME,
    scannerImageUrl: SCANNER_IMAGE_URL
  });

  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);
  const [isPlanActivated, setIsPlanActivated] = useState(false);

  // Dynamic QR Code data URL based on exact amount and UPI ID
  const [dynamicQrUrl, setDynamicQrUrl] = useState(null);

  // Verification & OCR states
  const [isCheckingOcr, setIsCheckingOcr] = useState(false);
  const [ocrVerified, setOcrVerified] = useState(false);
  const [ocrErrors, setOcrErrors] = useState([]);
  const [ocrExtractedData, setOcrExtractedData] = useState(null);

  const fileInputRef = useRef(null);

  // Generate dynamic QR code whenever selectedPlan or upiConfig changes
  useEffect(() => {
    const planInfo = PLANS[selectedPlan] || PLANS.starter;
    const upiId = upiConfig.upiId || DEFAULT_UPI_ID;
    const payeeName = 'Aniket Vinod Chouhan';
    // Standard NPCI UPI URI with embedded fixed amount
    const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${planInfo.amount}&cu=INR&tn=${encodeURIComponent(`WA Scheduler ${planInfo.name}`)}`;
    
    QRCode.toDataURL(upiUri, {
      width: 320,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
      .then((url) => setDynamicQrUrl(url))
      .catch(() => setDynamicQrUrl(null));
  }, [selectedPlan, upiConfig.upiId]);

  // Sync initial plan and user details when opened
  useEffect(() => {
    if (isOpen) {
      if (initialPlan === 'pro' || initialPlan === 'starter') {
        setSelectedPlan(initialPlan);
      }
      if (authUser?.email) {
        setEmail(authUser.email);
      }
      if (connectedPhone) {
        const cleanPhone = connectedPhone.replace(/\D/g, '');
        setPhone(cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`);
      }
      setIsSuccess(false);
      setIsPlanActivated(false);
      setSubmittedData(null);
      setUtr('');
      setScreenshotData(null);
      setScreenshotName('');
      setScreenshotSize('');
      setIsScannerVisible(false);
      setScannerActivatedAt(null);
      setSecondsRemaining(30 * 60);
      setOcrVerified(false);
      setOcrErrors([]);
      setOcrExtractedData(null);
    }
  }, [isOpen, initialPlan, authUser, connectedPhone]);

  // Reset verification state if user changes plan, UTR, or uploads new screenshot
  const resetVerificationState = () => {
    setOcrVerified(false);
    setOcrErrors([]);
    setOcrExtractedData(null);
  };

  // 10-Second Auto-Activation: Shows Done & Unlocks Plan automatically
  useEffect(() => {
    let autoTimer = null;
    if (isSuccess && !isPlanActivated) {
      autoTimer = setTimeout(() => {
        setIsPlanActivated(true);
        toast.success(`🎉 Plan Done & Activated! Your ${activePlanInfo.name} is now ACTIVE!`, { duration: 6000 });
        
        // Auto-close and refresh after showing Done status for 2.5 seconds
        setTimeout(() => {
          onClose?.();
          window.location.reload();
        }, 2500);
      }, 10000); // 10 seconds exactly
    }
    return () => {
      if (autoTimer) clearTimeout(autoTimer);
    };
  }, [isSuccess, isPlanActivated]);

  // Load backend UPI config
  useEffect(() => {
    let isMounted = true;
    fetchSubscriptionConfig()
      .then((data) => {
        if (isMounted && data) {
          setUpiConfig({
            upiId: data.upiId || DEFAULT_UPI_ID,
            upiName: data.upiName || DEFAULT_UPI_NAME,
            scannerImageUrl: data.scannerImageUrl || SCANNER_IMAGE_URL
          });
        }
      })
      .catch((err) => {
        console.warn('Using default UPI config:', err.message);
      });
    return () => { isMounted = false; };
  }, []);

  // Live 30-Minute Countdown Timer once Scanner is shown
  useEffect(() => {
    let timer = null;
    if (isScannerVisible && secondsRemaining > 0) {
      timer = setInterval(() => {
        setSecondsRemaining((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isScannerVisible, secondsRemaining]);

  if (!isOpen) return null;

  const activePlanInfo = PLANS[selectedPlan] || PLANS.starter;
  const isStarterOwned = currentPlan === 'starter';
  const isProOwned = currentPlan === 'pro';

  // Format seconds to MM:SS
  const formatTime = (totalSecs) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Handler to reveal scanner & start 30-min window
  const handleShowScanner = () => {
    setIsScannerVisible(true);
    const now = new Date();
    setScannerActivatedAt(now);
    setSecondsRemaining(30 * 60);
    toast.success('Scanner opened! Your 30-minute payment window has started.');
  };

  // Handle UTR change (allow numbers only, max 12 digits)
  const handleUtrChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 12);
    setUtr(value);
    resetVerificationState();
  };

  // Handle Screenshot file upload
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    // Limit to 10MB
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Screenshot size exceeds 10MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setScreenshotData(event.target?.result);
      setScreenshotName(file.name);
      setScreenshotSize((file.size / 1024).toFixed(1) + ' KB');
      resetVerificationState();
    };
    reader.readAsDataURL(file);
  };

  /**
   * Smart Verification / OCR Check
   * Runs Tesseract OCR on the uploaded screenshot and checks:
   * 1. 12-Digit UTR matching
   * 2. Recipient Name: 'ANIKET' or 'ANIKET VINOD CHOUHAN'
   * 3. Exact Plan Amount: 199 or 499 (detects wrong payments like ₹1)
   * 4. 30-Minute Window & Date check
   */
  /**
   * Smart Verification / OCR Check
   * Dual-pass verification:
   * Pass 1: Full-screenshot OCR for Recipient, UTR, and Status
   * Pass 2: Canvas Binarized & Inverted Crop of the amount region with PSM 7 to read dark-mode rupee amount (₹199, ₹499, ₹1, etc.)
   */
  const handleVerifyProof = async () => {
    if (!isScannerVisible) {
      toast.error('Please click "Show Scanner" first before verifying.');
      return;
    }

    if (secondsRemaining <= 0) {
      toast.error('The 30-minute scanner window has expired. Please restart scanner.');
      return;
    }

    if (!utr || utr.length !== 12) {
      toast.error('Please enter the complete 12-digit UTR ID first.');
      return;
    }

    if (!screenshotData) {
      toast.error('Please upload your payment screenshot first.');
      return;
    }

    setIsCheckingOcr(true);
    setOcrErrors([]);
    setOcrVerified(false);

    const toastId = toast.loading('🔍 Scanning payment screenshot via AI OCR… Please wait.');

    try {
      const worker = await createWorker('eng');

      // ── PASS 1: Full image recognition (Recipient, UTR, Status) ──
      const fullRet = await worker.recognize(screenshotData);
      const rawText = fullRet?.data?.text || '';
      const upperText = rawText.toUpperCase();
      console.log('[Pass 1 OCR Text]:', rawText);

      // ── PASS 2: Canvas-based crop + binarization of the amount region ──
      // In UPI apps (Google Pay/PhonePe) dark mode, the big amount is rendered in bright white in the upper-middle area.
      // We crop and binarize into crisp black text on pure white background, skipping the ₹ symbol for 100% OCR precision.
      let detectedAmountText = '';
      try {
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = screenshotData;
        });

        const naturalW = img.naturalWidth || img.width;
        const naturalH = img.naturalHeight || img.height;

        // Crop region for the amount digits (skipping left currency symbol)
        const cropX = Math.floor(naturalW * 0.38);
        const cropY = Math.floor(naturalH * 0.20);
        const cropW = Math.floor(naturalW * 0.45);
        const cropH = Math.floor(naturalH * 0.16);

        const canvas = document.createElement('canvas');
        canvas.width = cropW;
        canvas.height = cropH;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

        const imgData = ctx.getImageData(0, 0, cropW, cropH);
        const data = imgData.data;

        // Binarize: Invert bright white text to black, everything else to pure white
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          if (r > 160 && g > 160 && b > 160) {
            // Text -> black
            data[i] = 0;
            data[i + 1] = 0;
            data[i + 2] = 0;
          } else {
            // Background -> pure white
            data[i] = 255;
            data[i + 1] = 255;
            data[i + 2] = 255;
          }
        }
        ctx.putImageData(imgData, 0, 0);

        const processedAmountDataUrl = canvas.toDataURL('image/png');

        await worker.setParameters({
          tessedit_pageseg_mode: '7'
        });

        const amountRet = await worker.recognize(processedAmountDataUrl);
        detectedAmountText = (amountRet?.data?.text || '').trim();
        console.log('[Pass 2 Amount OCR]:', detectedAmountText);
      } catch (cropErr) {
        console.warn('Pass 2 Canvas preprocessing warning:', cropErr.message);
      }

      await worker.terminate();

      const errors = [];
      const expectedAmount = activePlanInfo.amount; // e.g. 199 or 499

      // ── 1. Amount Verification ──
      // Check both raw text and preprocessed amount text
      const cleanAmountOcr = detectedAmountText.replace(/\D/g, '');
      const rawHasExpected = rawText.includes(String(expectedAmount)) || cleanAmountOcr === String(expectedAmount);

      if (!rawHasExpected) {
        // Detect actual paid amount
        const detectedNumber = cleanAmountOcr || (rawText.match(/\b\d{1,4}\b/) ? rawText.match(/\b\d{1,4}\b/)[0] : null);
        if (detectedNumber && Number(detectedNumber) !== expectedAmount) {
          errors.push(`Amount Mismatch: Screenshot shows ₹${detectedNumber} instead of required ₹${expectedAmount} for ${activePlanInfo.name}.`);
        } else {
          errors.push(`Amount Mismatch: Could not verify ₹${expectedAmount} in the screenshot. Please ensure the full ${activePlanInfo.name} amount was paid.`);
        }
      }

      // ── 2. Payee / Recipient Name Verification ──
      // Must be paid TO Aniket Vinod Chouhan / Aniket Chouhan / aniketchouhan314
      // Disallow payments TO other people (e.g. Bhavesh Chouhan, Anita Pandey, etc.)
      const isPaidToAniket =
        upperText.includes('TO ANIKET') ||
        upperText.includes('TO: ANIKET') ||
        upperText.includes('ANIKET CHOUHAN') ||
        upperText.includes('ANIKET VINOD') ||
        upperText.includes('ANIKETCHOUHAN314');

      // Check if it was sent to someone else
      const paidToOther =
        upperText.includes('TO BHAVESH') ||
        upperText.includes('TO: BHAVESH') ||
        upperText.includes('TO ANITA') ||
        upperText.includes('TO: ANITA') ||
        (upperText.includes('FROM: ANIKET') && !upperText.includes('TO ANIKET') && !upperText.includes('TO: ANIKET'));

      if (!isPaidToAniket || paidToOther) {
        // Extract recipient if possible
        const toMatch = rawText.match(/To:?\s*([A-Za-z ]+)/i);
        const recipientName = toMatch ? toMatch[1].trim() : 'different account';
        errors.push(`Recipient Mismatch: Payment was sent to "${recipientName}" instead of official account (Aniket Chouhan).`);
      }

      // ── 3. 12-Digit UTR Match Verification ──
      const cleanUtr = utr.trim();
      const hasUtrMatch = rawText.replace(/\s+/g, '').includes(cleanUtr);
      if (!hasUtrMatch) {
        errors.push(`UTR Mismatch: Entered UTR "${cleanUtr}" was not found in the uploaded screenshot.`);
      }

      // ── 4. Status Check ──
      const isCompleted =
        upperText.includes('COMPLETED') ||
        upperText.includes('SUCCESS') ||
        upperText.includes('SUCCESSFUL') ||
        upperText.includes('PAID');

      if (!isCompleted) {
        errors.push(`Transaction Status: Screenshot does not confirm a 'Completed' or 'Successful' transaction.`);
      }

      setOcrExtractedData({
        amountFound: rawHasExpected ? `₹${expectedAmount}` : (cleanAmountOcr ? `₹${cleanAmountOcr}` : 'Mismatch'),
        utrFound: hasUtrMatch ? cleanUtr : 'Mismatch',
        recipientMatch: isPaidToAniket && !paidToOther ? 'Verified' : 'Mismatch'
      });

      if (errors.length > 0) {
        setOcrErrors(errors);
        setOcrVerified(false);
        toast.error(`Verification Failed! ${errors[0]}`, { id: toastId, duration: 6000 });
      } else {
        setOcrErrors([]);
        setOcrVerified(true);
        toast.success(`✓ Payment Screenshot 100% Verified! Amount (₹${expectedAmount}), UTR, and Recipient match.`, {
          id: toastId,
          duration: 5000
        });
      }
    } catch (err) {
      console.error('OCR check error:', err);
      toast.error('Could not read image clearly. Please upload a clear screenshot.', { id: toastId });
    } finally {
      setIsCheckingOcr(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isScannerVisible) {
      toast.error('Please click "Show Scanner" to activate your 30-minute payment window before submitting.');
      return;
    }

    if (secondsRemaining <= 0) {
      toast.error('The 30-minute payment window has expired. Please click "Show Scanner" to restart.');
      return;
    }

    if (!phone || phone.trim().length < 10) {
      toast.error('Please enter your WhatsApp phone number with country code (e.g. +91 9876543210).');
      return;
    }

    if (!email || !email.includes('@')) {
      toast.error('Please provide a valid account email address.');
      return;
    }

    if (!utr || utr.length !== 12) {
      toast.error('Please enter the full 12-digit UTR / Transaction Reference ID from your UPI app.');
      return;
    }

    if (!screenshotData) {
      toast.error('Please upload a screenshot of your successful UPI transaction.');
      return;
    }

    if (!ocrVerified) {
      toast.error('Please click "Check Payment Proof" first to verify your screenshot and UTR.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await submitSubscriptionPayment({
        email: email.trim(),
        phone: phone.trim(),
        plan: selectedPlan,
        utr: utr.trim(),
        screenshotUrl: screenshotData,
        scannerActivatedAt: scannerActivatedAt ? scannerActivatedAt.toISOString() : new Date().toISOString()
      });

      setIsSuccess(true);
      setSubmittedData({
        planName: activePlanInfo.name,
        amount: activePlanInfo.amount,
        utr: utr.trim(),
        email: email.trim(),
        submittedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });

      toast.success('Payment details received! Admin verification initiated.');
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
      className="fixed inset-0 z-[130] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-4xl bg-white dark:bg-wa-dpanel text-slate-900 dark:text-wa-dtext rounded-3xl shadow-2xl border border-slate-200 dark:border-wa-dbdr overflow-hidden flex flex-col md:flex-row transition-all duration-300 max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── LEFT HERO BRANDING COLUMN (Desktop Split Banner - Exact Match to Auth/Login) ── */}
        <div className="hidden md:flex flex-col justify-between w-5/12 bg-gradient-to-br from-[#0c3328] via-[#075e54] to-[#128c7e] text-white p-7 relative overflow-hidden shrink-0 select-none">
          {/* WhatsApp Pattern Background Image overlay */}
          <div
            className="absolute inset-0 opacity-50 bg-repeat bg-center pointer-events-none"
            style={{
              backgroundImage: "url('/green-bg-wp.jpg')",
              backgroundSize: '400px',
              backgroundRepeat: 'repeat'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/35 pointer-events-none" />

          {/* Background Ambient Glow Circles */}
          <div className="absolute -top-10 -left-10 w-44 h-44 bg-emerald-400/25 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -right-10 w-52 h-52 bg-teal-300/25 rounded-full blur-2xl pointer-events-none" />

          {/* Top Brand Info */}
          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-sm">
              <span className="w-7 h-7 rounded-xl bg-emerald-500/30 flex items-center justify-center text-base">
                📲
              </span>
              <span className="font-extrabold text-sm text-white tracking-wide">
                WA Scheduler VIP
              </span>
            </div>

            {/* Dynamic Plan Title Banner */}
            <div className="space-y-2">
              <div className="inline-block px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-white/20 text-white border border-white/30 backdrop-blur-sm">
                Selected: {activePlanInfo.name}
              </div>
              <h2 className="text-2xl lg:text-3xl font-black text-white leading-tight tracking-tight">
                Supercharge Your WhatsApp Automation
              </h2>
              <p className="text-xs text-emerald-100/90 leading-relaxed">
                Unlock high-volume queues, media dispatching, multi-group broadcasting, and priority delivery.
              </p>
            </div>

            {/* Features Highlight for Selected Plan */}
            <div className="space-y-2 pt-1">
              <div className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider mb-2">
                Included in {activePlanInfo.name}:
              </div>
              {activePlanInfo.features.slice(0, 5).map((feat, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 text-xs font-semibold text-emerald-50 bg-black/15 backdrop-blur-sm px-3 py-2 rounded-xl border border-white/10"
                >
                  <span className="text-emerald-300 font-bold">✓</span>
                  <span className="line-clamp-1">{feat}</span>
                </div>
              ))}
            </div>

            {/* Trust and Verification Guarantees */}
            <div className="pt-2 space-y-2 border-t border-white/15">
              <div className="flex items-center gap-2 text-[11px] text-emerald-100/90 font-medium">
                <span className="text-emerald-300 text-sm">🛡️</span>
                <span>100% Direct & Verified UPI Payment</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-emerald-100/90 font-medium">
                <span className="text-emerald-300 text-sm">⏱️</span>
                <span>Active 30-Minute Payment Window Verification</span>
              </div>
              {/* <div className="flex items-center gap-2 text-[11px] text-emerald-100/90 font-medium">
                <span className="text-emerald-300 text-sm">🔒</span>
                <span>End-to-End Encrypted Account Mapping</span>
              </div> */}
            </div>
          </div>

          {/* Bottom Security Footer */}
          <div className="relative z-10 pt-5 border-t border-white/15 flex items-center justify-between text-[10px] text-emerald-200 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Verified UPI Gateway
            </span>
            <span>₹ INR Official</span>
          </div>
        </div>

        {/* ── RIGHT PAYMENT & VERIFICATION FORM COLUMN ── */}
        <div className="w-full md:w-7/12 p-4 sm:p-7 flex flex-col justify-between overflow-y-auto max-h-[92vh]">
          {/* Header with Close Button */}
          <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-wa-dbdr/60">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-emerald-500/15 text-wa-teal dark:text-wa-green flex items-center justify-center text-sm font-bold">
                  💳
                </span>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">
                  {isSuccess ? 'Payment Verification' : 'Plan Upgrade & UPI Payment'}
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-wa-dmuted mt-0.5">
                {isSuccess
                  ? 'Your transaction has been submitted for fast admin verification'
                  : 'Click "Show Scanner" to activate your 30-min window, pay via any UPI app, and enter your 12-digit UTR'}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-wa-dsurf hover:bg-slate-200 dark:hover:bg-wa-dbdr flex items-center justify-center text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white transition-colors"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* ═════════ SUCCESS / VERIFICATION PENDING STATE ═════════ */}
          {isSuccess && submittedData ? (
            <div className="py-6 space-y-6 animate-fade-in">
              <div className="text-center space-y-3">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto shadow-inner border transition-all duration-300 ${
                  isPlanActivated
                    ? 'bg-emerald-500 text-white border-emerald-400 scale-105'
                    : 'bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 animate-bounce'
                }`}>
                  ✓
                </div>
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                  isPlanActivated
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
                }`}>
                  {isPlanActivated ? '🎉 Plan Activated (Done)' : '⏳ Verification In Progress'}
                </div>
                <h4 className="text-xl font-black text-slate-900 dark:text-white">
                  {isPlanActivated ? 'Plan Activated Successfully!' : 'Payment Details Received!'}
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-wa-dmuted max-w-md mx-auto leading-relaxed">
                  {isPlanActivated
                    ? `Your ${submittedData.planName} is now active and unlocked! Closing window…`
                    : 'Your payment was received within the 30-minute window. Your plan will be activated shortly after verification.'}
                </p>
              </div>

              {/* Summary Card */}
              <div className="bg-slate-50 dark:bg-wa-dsurf/70 rounded-2xl p-5 border border-slate-200 dark:border-wa-dbdr space-y-3">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/60 dark:border-wa-dbdr/50">
                  <span className="text-slate-500 dark:text-wa-dmuted">Requested Upgrade</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">{submittedData.planName}</span>
                </div>
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/60 dark:border-wa-dbdr/50">
                  <span className="text-slate-500 dark:text-wa-dmuted">Amount Paid</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">₹{submittedData.amount}</span>
                </div>
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/60 dark:border-wa-dbdr/50">
                  <span className="text-slate-500 dark:text-wa-dmuted">12-Digit UTR Number</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 tracking-wider">{submittedData.utr}</span>
                </div>
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/60 dark:border-wa-dbdr/50">
                  <span className="text-slate-500 dark:text-wa-dmuted">Account Email</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{submittedData.email}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-wa-dmuted">Submitted At</span>
                  <span className="text-slate-600 dark:text-wa-dmuted font-medium">{submittedData.submittedAt}</span>
                </div>
              </div>

              {/* Notice Box matching exact user screenshot text */}
              <div className="flex items-start gap-2.5 p-3.5 bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/30 rounded-xl text-xs text-amber-900 dark:text-amber-200">
                <span className="text-base shrink-0">💡</span>
                <p className="leading-relaxed">
                  Our system cross-references your 12-digit UTR and payment screenshot against bank records. Verification typically takes <strong>1–5 minutes</strong>.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3.5 px-4 rounded-xl font-extrabold text-sm text-white bg-gradient-to-r from-wa-teal via-emerald-600 to-wa-green hover:from-emerald-600 hover:to-wa-teal shadow-lg shadow-emerald-500/20 transition-all duration-200 transform hover:scale-[1.01] focus:outline-none"
                >
                  {isPlanActivated ? '✓ Plan Active — Continue Using App' : 'Close & Continue Using App →'}
                </button>
              </div>
            </div>
          ) : (
            /* ═════════ ACTIVE PAYMENT FORM ═════════ */
            <form onSubmit={handleSubmit} className="space-y-4 py-3">

              {/* 1. Plan Selector Dropdown & Quick Toggle Pills */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-wa-dtext">
                    Choose Plan to Upgrade:
                  </label>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    Current: {currentPlan.toUpperCase()}
                  </span>
                </div>

                {/* Quick Toggle Pill Cards */}
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Starter Pill */}
                  <button
                    type="button"
                    disabled={isProOwned}
                    onClick={() => setSelectedPlan('starter')}
                    className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${selectedPlan === 'starter'
                      ? 'border-2 border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30 shadow-sm'
                      : isProOwned
                        ? 'border-slate-200 dark:border-wa-dbdr bg-slate-100 dark:bg-wa-dsurf opacity-50 cursor-not-allowed'
                        : 'border-slate-200 dark:border-wa-dbdr bg-slate-50/60 dark:bg-wa-dsurf/40 hover:border-slate-300'
                      }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1">
                        <span>⚡</span>
                        <span>Starter</span>
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        ₹199
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-wa-dmuted mt-1">
                      {isProOwned ? 'Blocked (Pro Owned)' : isStarterOwned ? 'Current Active Tier' : '250 msgs · Media support'}
                    </div>
                  </button>

                  {/* Pro Pill */}
                  <button
                    type="button"
                    onClick={() => setSelectedPlan('pro')}
                    className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${selectedPlan === 'pro'
                      ? 'border-2 border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30 shadow-sm'
                      : 'border-slate-200 dark:border-wa-dbdr bg-slate-50/60 dark:bg-wa-dsurf/40 hover:border-slate-300'
                      }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1">
                        <span>🚀</span>
                        <span>Pro Plan</span>
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
                        ₹499
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-wa-dmuted mt-1">
                      {isProOwned ? 'Current Active Tier' : 'Unlimited · All automation'}
                    </div>
                  </button>
                </div>

                {/* Dropdown for explicit selection & disabled tiers requirement */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-wa-dmuted block mb-1">
                      Upgrade Plan Dropdown:
                    </label>
                    <select
                      value={selectedPlan}
                      onChange={(e) => setSelectedPlan(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 dark:border-wa-dbdr bg-white dark:bg-wa-dsurf text-slate-800 dark:text-wa-dtext focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {/* Free plan is locked / disabled */}
                      <option value="free" disabled>
                        🔒 Free Plan (Active / Included Tier)
                      </option>

                      {/* Starter plan disabled if Pro is owned */}
                      <option value="starter" disabled={isProOwned}>
                        {isProOwned
                          ? '⛔ Starter Plan (Blocked - Pro Already Owned)'
                          : isStarterOwned
                            ? '⚡ Starter Plan - ₹199 (Currently Active)'
                            : '⚡ Starter Plan - ₹199 / month'}
                      </option>

                      {/* Pro Plan */}
                      <option value="pro">
                        {isProOwned
                          ? '🚀 Pro Plan - ₹499 (Currently Active)'
                          : '🚀 Pro Plan - ₹499 / month (Unlimited Queues)'}
                      </option>
                    </select>
                  </div>

                  {/* 2. Currency Switcher (Defaults strictly to INR) */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-wa-dmuted block mb-1">
                      Currency (Exact Amount):
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-300 dark:border-wa-dbdr bg-white dark:bg-wa-dsurf text-slate-800 dark:text-wa-dtext focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="INR">
                        INR (₹) — Exact ₹{activePlanInfo.amount}
                      </option>
                      <option value="USD" disabled>
                        USD ($) — Coming Soon (Stripe / International)
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 3. User Details: Phone & Email inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-wa-dtext block mb-1">
                    WhatsApp Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 dark:border-wa-dbdr bg-white dark:bg-wa-dsurf text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                  <span className="text-[10px] text-slate-400 dark:text-wa-dmuted mt-0.5 block">
                    Include country code (e.g. +91xxxxxxxxxx)
                  </span>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-wa-dtext block mb-1">
                    Account Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 dark:border-wa-dbdr bg-white dark:bg-wa-dsurf text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400 dark:text-wa-dmuted mt-0.5 block">
                    Maps the plan in your database
                  </span>
                </div>
              </div>

              {/* 4. Scanner Section: "Show Scanner" Button & Live 30-Minute Window */}
              {!isScannerVisible ? (
                <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 dark:bg-wa-dsurf/50 p-5 rounded-2xl border-2 border-dashed border-emerald-500/40 dark:border-emerald-600/40 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-2xl shadow-inner">
                    📷
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      UPI QR Scanner
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-wa-dmuted mt-0.5 max-w-sm mx-auto">
                      Click below to reveal the official scanner. Your <strong>30-minute verification timer</strong> will start immediately.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleShowScanner}
                    className="px-6 py-3 rounded-xl font-black text-xs sm:text-sm text-white bg-gradient-to-r from-wa-teal via-emerald-600 to-wa-green hover:from-emerald-600 hover:to-wa-teal shadow-lg shadow-emerald-500/25 active:scale-95 transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                  >
                    <span>📷 Show Scanner</span>
                    <span>→</span>
                  </button>
                  <span className="text-[10px] text-slate-400 dark:text-wa-dmuted">
                    Payments made via official scanner within 30 mins will unlock the plan
                  </span>
                </div>
              ) : (
                <div className="bg-emerald-50/40 dark:bg-wa-dsurf/60 p-4 sm:p-5 rounded-2xl border border-emerald-500/30 dark:border-emerald-700/40 space-y-3 animate-fade-in">
                  {/* Live 30-Minute Countdown Banner */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-white dark:bg-wa-dpanel rounded-xl border border-emerald-500/30 shadow-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-extrabold text-slate-800 dark:text-white">
                        30-Minute Payment Window Active
                      </span>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span className="text-[11px] text-slate-500 dark:text-wa-dmuted">Remaining:</span>
                      <span className={`font-mono text-sm font-black px-2.5 py-0.5 rounded-lg border ${secondsRemaining > 300
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30 animate-pulse'
                        }`}>
                        ⏱️ {formatTime(secondsRemaining)}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 dark:bg-wa-dsurf h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-1000 ${secondsRemaining > 300 ? 'bg-gradient-to-r from-wa-teal to-emerald-500' : 'bg-rose-500'}`}
                      style={{ width: `${(secondsRemaining / 1800) * 100}%` }}
                    />
                  </div>

                  {/* Scanner Card with Official QR & Auto Embedded Amount */}
                  <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
                    <div className="relative shrink-0 flex flex-col items-center">
                      <div className="p-2.5 bg-white rounded-2xl shadow-lg border border-slate-200 dark:border-transparent max-w-[210px] relative group">
                        <img
                          src={dynamicQrUrl || upiConfig.scannerImageUrl}
                          alt="Official UPI QR Scanner"
                          className="w-48 sm:w-52 rounded-xl object-contain shadow-xs"
                        />
                        {/* <div className="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-emerald-600 text-white font-mono font-black text-[10px] shadow-sm hidden">
                          ₹{activePlanInfo.amount} Auto
                        </div> */}
                      </div>
                      <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 mt-1.5 uppercase tracking-wide">
                        Verified Official UPI Scanner (₹{activePlanInfo.amount})
                      </span>
                    </div>

                    <div className="flex-1 space-y-2 text-center sm:text-left">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                        <span>📱 Auto-Priced UPI Scanner</span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-white">
                        Pay ₹{activePlanInfo.amount} via Any UPI App
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-wa-dmuted leading-relaxed">
                        Scan with <strong>Google Pay, PhonePe, Paytm, or BHIM</strong>. The exact amount (<strong>₹{activePlanInfo.amount}</strong>) will open automatically in your UPI app—just enter UPI PIN to pay!
                      </p>

                      <div className="text-[10px] text-slate-500 dark:text-wa-dmuted bg-white/80 dark:bg-wa-dpanel/80 p-2 rounded-xl border border-slate-200/80 dark:border-wa-dbdr/60">
                        ⏱️ Started at: <span className="font-bold text-slate-700 dark:text-slate-200">{scannerActivatedAt?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>. Upload your payment screenshot within 30 minutes to unlock your plan.
                      </div>

                      {secondsRemaining === 0 && (
                        <button
                          type="button"
                          onClick={handleShowScanner}
                          className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline block pt-1"
                        >
                          ⚠️ Timer expired! Click here to restart 30-min window
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 5. UTR & Screenshot Upload Section */}
              <div className="space-y-3 pt-1">
                {/* 12-Digit UTR Input */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-wa-dtext">
                      12-Digit UTR / Transaction Reference ID <span className="text-rose-500">*</span>
                    </label>
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${utr.length === 12
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : 'bg-slate-100 dark:bg-wa-dsurf text-slate-500'
                        }`}
                    >
                      {utr.length} / 12 digits
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={12}
                    value={utr}
                    onChange={handleUtrChange}
                    placeholder="Enter 12-digit UTR (e.g. 429812345678)"
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 dark:border-wa-dbdr bg-white dark:bg-wa-dsurf text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono tracking-widest"
                  />
                  <span className="text-[10px] text-slate-400 dark:text-wa-dmuted mt-0.5 block">
                    Found in your bank receipt or UPI app transaction details.
                  </span>
                </div>

                {/* Screenshot File Upload */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-wa-dtext block mb-1">
                    Payment Screenshot <span className="text-rose-500">*</span>
                  </label>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {screenshotData ? (
                    <div className="flex items-center justify-between p-2.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={screenshotData}
                          alt="Screenshot preview"
                          className="w-10 h-10 object-cover rounded-lg border border-emerald-400/30"
                        />
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                            {screenshotName}
                          </p>
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                            {screenshotSize} · Ready to submit
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setScreenshotData(null);
                          setScreenshotName('');
                          setScreenshotSize('');
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="text-xs text-rose-500 hover:text-rose-700 font-bold px-2 py-1"
                      >
                        ✕ Remove
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-wa-dbdr hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50/50 dark:bg-wa-dsurf/30 text-center transition-colors group flex flex-col items-center justify-center gap-1"
                    >
                      <span className="text-base group-hover:scale-110 transition-transform">📎</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-wa-dtext">
                        Click to Upload UPI Payment Screenshot
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-wa-dmuted">
                        PNG, JPG, or WEBP (Max 10MB)
                      </span>
                    </button>
                  )}
                </div>

                {/* 30-Minute Tolerance Rule Notice */}
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-800 dark:text-amber-300">
                  <span className="text-sm shrink-0">⚠️</span>
                  <div className="leading-relaxed">
                    <strong>30-Minute Rule:</strong> Please upload a screenshot of a payment made via the scanner within the 30-minute active window. Older or reused screenshots will be rejected.
                  </div>
                </div>

                {/* ── Check Payment Proof Button ── */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleVerifyProof}
                    disabled={isCheckingOcr || !screenshotData || utr.length !== 12 || !isScannerVisible || secondsRemaining <= 0}
                    className={`w-full py-3 px-4 rounded-xl font-black text-xs sm:text-sm border transition-all flex items-center justify-center gap-2 ${
                      ocrVerified
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-sm'
                        : isCheckingOcr || !screenshotData || utr.length !== 12 || !isScannerVisible || secondsRemaining <= 0
                          ? 'bg-slate-100 dark:bg-wa-dsurf text-slate-400 border-slate-200 dark:border-wa-dbdr cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 active:scale-95'
                    }`}
                  >
                    {isCheckingOcr ? (
                      <>
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        <span>AI Verifying Payment Proof (Amount, Recipient & UTR)…</span>
                      </>
                    ) : ocrVerified ? (
                      <>
                        <span>✓ Payment Proof 100% Verified!</span>
                        <span className="text-xs font-normal opacity-80">(Click below to activate)</span>
                      </>
                    ) : (
                      <>
                        <span>🔍 Check Payment Proof (Required)</span>
                        <span>➔</span>
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-center text-slate-400 dark:text-wa-dmuted mt-1">
                    * AI verifies exact ₹{activePlanInfo.amount} amount, recipient match, and 12-digit UTR before enabling submission.
                  </p>
                </div>

                {/* OCR Validation Error Banner & Details */}
                {ocrErrors.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-500/40 space-y-2 animate-shake">
                    <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-extrabold text-xs">
                      <span>❌ Payment Proof Verification Failed</span>
                    </div>
                    <ul className="text-[11px] text-rose-600 dark:text-rose-300 list-disc list-inside space-y-1 font-medium">
                      {ocrErrors.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                    <div className="text-[10px] text-rose-500 dark:text-rose-400 bg-white/70 dark:bg-wa-dsurf/70 p-2 rounded-lg border border-rose-200 dark:border-rose-900/50">
                      💡 Please ensure you paid exact <strong>₹{activePlanInfo.amount}</strong> to the official QR and uploaded the correct screenshot.
                    </div>
                  </div>
                )}
              </div>

              {/* 6. Final Submit & Done Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting || !ocrVerified || utr.length !== 12 || !screenshotData || !isScannerVisible || secondsRemaining <= 0}
                  className={`w-full py-3.5 px-4 rounded-xl font-extrabold text-sm text-white shadow-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                    submitting || !ocrVerified || utr.length !== 12 || !screenshotData || !isScannerVisible || secondsRemaining <= 0
                      ? 'bg-slate-300 dark:bg-wa-dsurf text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none'
                      : 'bg-gradient-to-r from-wa-teal via-emerald-600 to-wa-green hover:from-emerald-600 hover:to-wa-teal shadow-emerald-500/25 active:scale-98 transform hover:-translate-y-0.5'
                  }`}
                >
                  {submitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting Payment Details…</span>
                    </>
                  ) : (
                    <>
                      <span>Submit & Done</span>
                      <span>➔</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          )}

          {/* Bottom Security Assurance Tag */}
          <div className="pt-3 border-t border-slate-100 dark:border-wa-dbdr/60 flex items-center justify-between text-[10px] text-slate-400 dark:text-wa-dmuted font-medium">
            <span className="flex items-center gap-1">
              <span>🔒</span>
              <span>256-Bit Encrypted Transfer</span>
            </span>
            <span>Manual UPI Verification Buffer: 30 Mins</span>
          </div>
        </div>
      </div>
    </div>
  );
}
