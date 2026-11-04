import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { submitContactForm } from '../api';

const TARGET_SUPPORT_EMAIL = 'aniketchouhan243@gmail.com';

export const PAYMENT_METHODS = [
  'Google Pay',
  'PhonePe',
  'Paytm',
  'BHIM UPI',
  'Amazon Pay UPI',
  'WhatsApp Pay',
  'FamApp (FamPay)',
  'CRED UPI',
  'Alipay',
  'WeChat Pay',
  'UnionPay QR',
  'Pix',
  'PicPay',
  'Mercado Pago',
  'PayNow',
  'GrabPay',
  'DBS PayLah!',
  'GoPay',
  'OVO',
  'DANA',
  'ShopeePay',
  'QRIS',
  'Touch \'n Go eWallet',
  'DuitNow QR',
  'Boost',
  'PromptPay',
  'TrueMoney',
  'GCash',
  'Maya',
  'QR Ph',
  'bKash',
  'Nagad',
  'Rocket',
  'Easypaisa',
  'JazzCash',
  'Raast',
  'PayPay',
  'Rakuten Pay',
  'KakaoPay',
  'Naver Pay',
  'Toss Pay',
  'mada',
  'e& money',
  'Careem Pay',
  'PayBy',
  'M-Pesa',
  'Airtel Money',
  'Bizum',
  'Swish',
  'Vipps',
  'MobilePay',
  'BLIK',
  'TWINT',
  'MB WAY',
  'Satispay',
  'Bancomat Pay',
  'Payconiq'
];

export default function ContactSection({ authUser, profile }) {
  const [formData, setFormData] = useState({
    loginName: '',
    loginEmail: '',
    whatsappNumber: '',
    contactEmail: '',
    hasPaid: false,
    amountPaid: '199', // '199' | '499' | 'other'
    customAmount: '',
    paymentMethod: 'Google Pay',
    customPaymentMethod: '',
    payerName: '',
    payerEmail: '',
    payerRef: '',
    subject: 'General Support / Inquiry',
    message: ''
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Searchable Payment Method Dropdown States
  const [methodDropdownOpen, setMethodDropdownOpen] = useState(false);
  const [methodSearch, setMethodSearch] = useState('');
  const [isCustomMethod, setIsCustomMethod] = useState(false);
  const dropdownRef = useRef(null);

  // Auto-prefill authenticated user details & connected whatsapp phone
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      loginName: authUser?.name || prev.loginName || '',
      loginEmail: authUser?.email || prev.loginEmail || '',
      contactEmail: authUser?.email || prev.contactEmail || '',
      whatsappNumber: profile?.phone ? `+${profile.phone}` : prev.whatsappNumber || ''
    }));
  }, [authUser, profile]);

  // Click outside listener for searchable payment method dropdown
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMethodDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const getEffectiveAmount = () => {
    if (!formData.hasPaid) return 'N/A';
    if (formData.amountPaid === '199') return '₹199 (Starter Plan)';
    if (formData.amountPaid === '499') return '₹499 (Pro Plan)';
    return formData.customAmount.trim() ? `₹${formData.customAmount.trim()}` : 'Custom / Other';
  };

  const getEffectiveMethod = () => {
    if (!formData.hasPaid) return 'N/A';
    if (isCustomMethod || formData.paymentMethod === 'other') {
      return formData.customPaymentMethod.trim() || 'Other Payment Method';
    }
    return formData.paymentMethod || 'Google Pay';
  };

  const generateEmailBody = () => {
    return `══════════════════════════════════════════════════════════════════
📩 SUPPORT INQUIRY - WA SCHEDULER
══════════════════════════════════════════════════════════════════

👤 ACCOUNT LOGIN DETAILS:
• Login Name: ${formData.loginName || 'Not specified / Guest'}
• Login Email ID: ${formData.loginEmail || 'Not specified / Guest'}

📱 WHATSAPP CONNECTION:
• Connected WhatsApp Number: ${formData.whatsappNumber || 'Not connected / NA'}

✉️ CONTACT / REPLY EMAIL:
• Email Address: ${formData.contactEmail}

💳 PAYMENT DETAILS (IF APPLICABLE):
• Payment Made: ${formData.hasPaid ? 'YES' : 'NO (Empty/Free)'}
${formData.hasPaid ? `• Amount Paid: ${getEffectiveAmount()}
• Payment Method / UPI App: ${getEffectiveMethod()}
• Payer Name: ${formData.payerName || 'N/A'}
• Payer Email: ${formData.payerEmail || 'N/A'}
• UPI Ref / Phone / UTR No: ${formData.payerRef || 'N/A'}` : '• No payment details needed.'}

📋 SUBJECT / CATEGORY:
${formData.subject}

💬 USER MESSAGE / DESCRIPTION:
${formData.message}

══════════════════════════════════════════════════════════════════
Sent via WA Scheduler Contact Form`;
  };

  const handleCopyEmailAddress = () => {
    navigator.clipboard.writeText(TARGET_SUPPORT_EMAIL);
    setCopiedEmail(true);
    toast.success('Support email address copied to clipboard!');
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const handleCopyFormattedBody = () => {
    const body = generateEmailBody();
    navigator.clipboard.writeText(body);
    toast.success('Inquiry details copied! You can paste it into any email client.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.contactEmail.trim()) {
      toast.error('Please enter your contact/reply email address.');
      return;
    }
    if (!formData.message.trim()) {
      toast.error('Please describe your query or message in the box.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        loginName: formData.loginName.trim(),
        loginEmail: formData.loginEmail.trim(),
        whatsappNumber: formData.whatsappNumber.trim(),
        contactEmail: formData.contactEmail.trim(),
        paymentDetails: {
          hasPaid: formData.hasPaid,
          amountPaid: getEffectiveAmount(),
          paymentMethod: getEffectiveMethod(),
          payerName: formData.payerName.trim(),
          payerEmail: formData.payerEmail.trim(),
          payerRef: formData.payerRef.trim()
        },
        subject: formData.subject,
        message: formData.message.trim()
      };

      // 1. Send directly via backend API (which automatically dispatches email to aniketchouhan243@gmail.com)
      await submitContactForm(payload);

      setSubmitted(true);
      toast.success('Your message has been sent directly to support! We will reply to your email shortly.', { duration: 5000 });
    } catch (err) {
      console.error('Contact form submission error:', err);
      toast.error('Failed to send message: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Filter payment methods based on search input
  const filteredPaymentMethods = PAYMENT_METHODS.filter(method =>
    method.toLowerCase().includes(methodSearch.toLowerCase().trim())
  );

  return (
    <section id="contact" className="relative max-w-5xl mx-auto px-2 sm:px-4 py-8">
      {/* Background container */}
      <div className="relative bg-white/90 dark:bg-wa-dpanel/90 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-white/10 p-6 sm:p-10 shadow-xl overflow-hidden transition-colors">

        {/* Glow ambient background graphics */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/10 dark:bg-emerald-500/5 blur-3xl pointer-events-none rounded-full" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-wa-teal/10 dark:bg-wa-teal/5 blur-3xl pointer-events-none rounded-full" />

        <div className="relative z-10 space-y-6">

          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Contact Us & Priority Support</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Have Questions or Need Help? <br />
              <span className="bg-gradient-to-r from-wa-teal to-emerald-500 bg-clip-text text-transparent">
                We're Here for You
              </span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Fill in your details below to send an email directly to our team. All account and payment details will be automatically structured so we can resolve your request instantly.
            </p>

            {/* Support Email Card */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-100 dark:bg-wa-dsurf border border-slate-200 dark:border-wa-dbdr shadow-xs">
              <span className="text-base">✉️</span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Direct Support Email:</span>
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 select-all">{TARGET_SUPPORT_EMAIL}</span>
              <button
                type="button"
                onClick={handleCopyEmailAddress}
                className="ml-2 text-xs text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 font-bold transition-colors"
                title="Copy Email"
              >
                {copiedEmail ? '✓ Copied' : '📋 Copy'}
              </button>
            </div>
          </div>

          {submitted ? (
            <div className="max-w-xl mx-auto p-6 sm:p-8 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-3xl text-center space-y-4 shadow-lg animate-fadeIn">
              <div className="w-16 h-16 bg-gradient-to-tr from-wa-teal to-emerald-500 text-white rounded-full flex items-center justify-center text-3xl mx-auto shadow-md">
                ✓
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Message Sent Directly to Support!
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Your message has been delivered directly to <strong>{TARGET_SUPPORT_EMAIL}</strong>.
                Our team will review your inquiry & payment details and respond to your email (<strong>{formData.contactEmail}</strong>) shortly.
              </p>

              {/* Inquiry Receipt Card */}
              <div className="p-4 rounded-2xl bg-white dark:bg-wa-dsurf border border-slate-200 dark:border-wa-dbdr text-left text-xs space-y-1.5 text-slate-700 dark:text-slate-300">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-wa-dbdr/50">
                  <span className="text-slate-500">Contact Email:</span>
                  <span className="font-semibold">{formData.contactEmail}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-wa-dbdr/50">
                  <span className="text-slate-500">Topic:</span>
                  <span className="font-semibold truncate max-w-[240px]">{formData.subject}</span>
                </div>
                {formData.hasPaid && (
                  <>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-wa-dbdr/50">
                      <span className="text-slate-500">Amount Paid:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{getEffectiveAmount()}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-wa-dbdr/50">
                      <span className="text-slate-500">Payment App:</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">{getEffectiveMethod()}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">Delivered & Queued ✓</span>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setFormData(prev => ({
                      ...prev,
                      hasPaid: false,
                      customAmount: '',
                      customPaymentMethod: '',
                      payerName: '',
                      payerEmail: '',
                      payerRef: '',
                      message: ''
                    }));
                  }}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow"
                >
                  Send Another Message
                </button>
                <a
                  href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(TARGET_SUPPORT_EMAIL)}&su=${encodeURIComponent(`[WA Scheduler Support] ${formData.subject}`)}&body=${encodeURIComponent(generateEmailBody())}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30 transition-all flex items-center gap-1.5"
                >
                  <span>✉️</span>
                  <span>Open Gmail (Send Backup Copy) ↗</span>
                </a>
                <button
                  type="button"
                  onClick={handleCopyFormattedBody}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                >
                  📋 Copy Details
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-5">

              {/* Row 1: Login Account Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Login Name <span className="text-slate-400 font-normal">(Name used to log in)</span>
                  </label>
                  <input
                    type="text"
                    name="loginName"
                    value={formData.loginName}
                    onChange={handleChange}
                    placeholder="e.g. Arjun Kapoor"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-white dark:bg-wa-dsurf border border-slate-200 dark:border-wa-dbdr text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-wa-teal transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Login Email ID <span className="text-slate-400 font-normal">(Email used for account)</span>
                  </label>
                  <input
                    type="email"
                    name="loginEmail"
                    value={formData.loginEmail}
                    onChange={handleChange}
                    placeholder="e.g. arjun@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-white dark:bg-wa-dsurf border border-slate-200 dark:border-wa-dbdr text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-wa-teal transition-all"
                  />
                </div>
              </div>

              {/* Row 2: WhatsApp Number & Reply Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Connected WhatsApp Number <span className="text-slate-400 font-normal">(If connected)</span>
                  </label>
                  <input
                    type="text"
                    name="whatsappNumber"
                    value={formData.whatsappNumber}
                    onChange={handleChange}
                    placeholder="e.g. +91 9876543210 (or leave empty if not connected)"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-white dark:bg-wa-dsurf border border-slate-200 dark:border-wa-dbdr text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-wa-teal transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Contact / Reply Email <span className="text-rose-500">*</span> <span className="text-slate-400 font-normal">(Where we should reply)</span>
                  </label>
                  <input
                    type="email"
                    name="contactEmail"
                    required
                    value={formData.contactEmail}
                    onChange={handleChange}
                    placeholder="your-email@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-white dark:bg-wa-dsurf border border-slate-200 dark:border-wa-dbdr text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-wa-teal transition-all"
                  />
                </div>
              </div>

              {/* Row 3: Category / Subject */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Topic / Query Category
                </label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-white dark:bg-wa-dsurf border border-slate-200 dark:border-wa-dbdr text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-wa-teal transition-all"
                >
                  <option value="General Support / Inquiry">General Support / Inquiry</option>
                  <option value="Payment & Plan Upgrade Verification">Payment & Plan Upgrade Verification</option>
                  <option value="WhatsApp Connection / Disconnect Issue">WhatsApp Connection / Disconnect Issue</option>
                  <option value="Google Contacts Sync Question">Google Contacts Sync Question</option>
                  <option value="Feature Request & Suggestions">Feature Request & Suggestions</option>
                  <option value="Bug / Error Report">Bug / Error Report</option>
                  <option value="Other Assistance">Other Assistance</option>
                </select>
              </div>

              {/* Payment Details Accordion/Checkbox */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-wa-dsurf/60 border border-slate-200 dark:border-wa-dbdr space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="hasPaid"
                    name="hasPaid"
                    checked={formData.hasPaid}
                    onChange={handleChange}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="hasPaid" className="text-xs font-bold text-slate-800 dark:text-white cursor-pointer select-none">
                    I made a payment / plan upgrade (Fill this if you made a payment)
                  </label>
                </div>

                {formData.hasPaid && (
                  <div className="pt-3 border-t border-slate-200 dark:border-wa-dbdr space-y-4 animate-fadeIn">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Please provide payment details so we can verify and activate your Pro / Starter plan immediately:
                    </p>

                    {/* Row A: Amount Paid & Payment Method Dropdowns */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                      {/* Option 1: Amount Paid Dropdown */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Amount Paid (Kitna pay kara he) <span className="text-rose-500">*</span>
                        </label>
                        <select
                          name="amountPaid"
                          value={formData.amountPaid}
                          onChange={handleChange}
                          className="w-full px-3 py-2.5 rounded-xl text-xs bg-white dark:bg-wa-dsurf border border-slate-200 dark:border-wa-dbdr text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-wa-teal"
                        >
                          <option value="199">₹199 - Starter Plan (500 Messages/Month)</option>
                          <option value="499">₹499 - Pro Plan (Unlimited Messages)</option>
                          <option value="other">Other / Custom Amount</option>
                        </select>

                        {formData.amountPaid === 'other' && (
                          <input
                            type="text"
                            name="customAmount"
                            value={formData.customAmount}
                            onChange={handleChange}
                            placeholder="Enter exact amount (e.g. 299)"
                            className="mt-2 w-full px-3 py-2 rounded-lg text-xs bg-white dark:bg-wa-dsurf border border-slate-200 dark:border-wa-dbdr text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-wa-teal"
                          />
                        )}
                      </div>

                      {/* Option 2: Searchable Payment Method Dropdown with ADD custom option */}
                      <div className="relative" ref={dropdownRef}>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                            Payment Method / UPI App <span className="text-rose-500">*</span>
                          </label>
                          {isCustomMethod && (
                            <button
                              type="button"
                              onClick={() => {
                                setIsCustomMethod(false);
                                setFormData(prev => ({ ...prev, paymentMethod: 'Google Pay' }));
                              }}
                              className="text-[10px] text-wa-teal hover:underline font-bold"
                            >
                              Pick from list
                            </button>
                          )}
                        </div>

                        {!isCustomMethod ? (
                          <>
                            {/* Selector Trigger Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setMethodDropdownOpen(prev => !prev);
                                setMethodSearch('');
                              }}
                              className="w-full px-3 py-2.5 rounded-xl text-xs bg-white dark:bg-wa-dsurf border border-slate-200 dark:border-wa-dbdr text-slate-800 dark:text-white flex items-center justify-between hover:border-wa-teal focus:outline-none focus:ring-2 focus:ring-wa-teal transition-all text-left"
                            >
                              <span className="truncate font-medium">{formData.paymentMethod || 'Select Payment Method'}</span>
                              <span className="text-[10px] text-slate-400 ml-2">▼</span>
                            </button>

                            {/* Dropdown Menu Popup with Search */}
                            {methodDropdownOpen && (
                              <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white dark:bg-wa-dpanel border border-slate-200 dark:border-wa-dbdr rounded-2xl shadow-2xl p-2 space-y-2 animate-fadeIn max-h-72 flex flex-col">

                                {/* Search Filter Input */}
                                <div className="relative">
                                  <span className="absolute left-2.5 top-2.5 text-xs text-slate-400">🔍</span>
                                  <input
                                    type="text"
                                    autoFocus
                                    placeholder="Search payment app (e.g. PhonePe, Paytm, Pix)..."
                                    value={methodSearch}
                                    onChange={(e) => setMethodSearch(e.target.value)}
                                    className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-wa-dsurf border border-slate-200 dark:border-wa-dbdr text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-wa-teal"
                                  />
                                </div>

                                {/* Methods Scroll List */}
                                <div className="overflow-y-auto max-h-48 divide-y divide-slate-100 dark:divide-wa-dbdr/50 pr-1">
                                  {filteredPaymentMethods.length > 0 ? (
                                    filteredPaymentMethods.map((method) => (
                                      <button
                                        key={method}
                                        type="button"
                                        onClick={() => {
                                          setFormData(prev => ({ ...prev, paymentMethod: method }));
                                          setIsCustomMethod(false);
                                          setMethodDropdownOpen(false);
                                        }}
                                        className={`w-full px-3 py-2 text-left text-xs rounded-lg transition-colors flex items-center justify-between ${formData.paymentMethod === method
                                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold'
                                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-wa-dsurf'
                                          }`}
                                      >
                                        <span>{method}</span>
                                        {formData.paymentMethod === method && (
                                          <span className="text-emerald-500 text-xs">✓</span>
                                        )}
                                      </button>
                                    ))
                                  ) : (
                                    <div className="p-3 text-center text-xs text-slate-400">
                                      No matching payment method found.
                                    </div>
                                  )}
                                </div>

                                {/* Add Custom Payment Method Button at bottom */}
                                <div className="pt-2 border-t border-slate-100 dark:border-wa-dbdr/80">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsCustomMethod(true);
                                      setFormData(prev => ({
                                        ...prev,
                                        paymentMethod: 'other',
                                        customPaymentMethod: methodSearch.trim() || ''
                                      }));
                                      setMethodDropdownOpen(false);
                                    }}
                                    className="w-full px-3 py-2 rounded-xl text-xs font-bold text-wa-teal hover:bg-wa-teal/10 dark:hover:bg-wa-teal/20 transition-colors flex items-center justify-center gap-1.5"
                                  >
                                    <span>➕ Add Custom / Other Method</span>
                                    {methodSearch.trim() && <span className="font-normal italic">("{methodSearch.trim()}")</span>}
                                  </button>
                                </div>

                              </div>
                            )}
                          </>
                        ) : (
                          /* Custom Payment Method Text Input */
                          <div className="space-y-1">
                            <input
                              type="text"
                              autoFocus
                              placeholder="Type your payment method / UPI app name..."
                              value={formData.customPaymentMethod}
                              onChange={(e) => setFormData(prev => ({ ...prev, customPaymentMethod: e.target.value }))}
                              className="w-full px-3 py-2.5 rounded-xl text-xs bg-white dark:bg-wa-dsurf border border-wa-teal text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-wa-teal"
                            />
                            <p className="text-[10px] text-slate-400">
                              Custom method entered. Click 'Pick from list' above to choose from predefined methods.
                            </p>
                          </div>
                        )}
                      </div>

                    </div>

                    {/* Row B: Payer Name, Payer Email, UPI Ref */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Payer Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="payerName"
                          value={formData.payerName}
                          onChange={handleChange}
                          placeholder="Name on bank / UPI"
                          className="w-full px-3 py-2 rounded-lg text-xs bg-white dark:bg-wa-dsurf border border-slate-200 dark:border-wa-dbdr text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-wa-teal"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Payer Email <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="email"
                          name="payerEmail"
                          value={formData.payerEmail}
                          onChange={handleChange}
                          placeholder="Email used for payment"
                          className="w-full px-3 py-2 rounded-lg text-xs bg-white dark:bg-wa-dsurf border border-slate-200 dark:border-wa-dbdr text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-wa-teal"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          UPI Ref / Phone / UTR No <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="payerRef"
                          value={formData.payerRef}
                          onChange={handleChange}
                          placeholder="e.g. 12-digit UTR or Phone"
                          className="w-full px-3 py-2 rounded-lg text-xs bg-white dark:bg-wa-dsurf border border-slate-200 dark:border-wa-dbdr text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-wa-teal"
                        />
                      </div>
                    </div>

                  </div>
                )}
              </div>

              {/* Message / Inbox Box */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Message / Issue Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  name="message"
                  required
                  rows={4}
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Describe your issue, question, or payment details in detail here..."
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-white dark:bg-wa-dsurf border border-slate-200 dark:border-wa-dbdr text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-wa-teal transition-all resize-y min-h-[100px]"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-wa-teal via-emerald-600 to-wa-green hover:from-emerald-600 hover:to-wa-teal shadow-lg shadow-emerald-500/25 border border-emerald-400/20 transition-all transform hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <span>{loading ? 'Sending Directly...' : 'Send Message to Support'}</span>
                  <span>✈️</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyFormattedBody}
                  className="w-full sm:w-auto px-5 py-3.5 rounded-xl font-semibold text-xs text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-wa-dsurf dark:hover:bg-slate-700 border border-slate-200 dark:border-wa-dbdr transition-all flex items-center justify-center gap-1.5"
                >
                  <span>📋</span>
                  <span>Copy Formatted Details</span>
                </button>
              </div>

            </form>
          )}

        </div>
      </div>
    </section>
  );
}
