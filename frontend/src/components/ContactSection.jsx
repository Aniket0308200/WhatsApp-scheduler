import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { submitContactForm } from '../api';

const TARGET_SUPPORT_EMAIL = 'aniketchouhan243@gmail.com';

export default function ContactSection({ authUser, profile }) {
  const [formData, setFormData] = useState({
    loginName: '',
    loginEmail: '',
    whatsappNumber: '',
    contactEmail: '',
    hasPaid: false,
    payerName: '',
    payerEmail: '',
    payerRef: '',
    subject: 'General Support / Inquiry',
    message: ''
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
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
${formData.hasPaid ? `• Payer Name: ${formData.payerName || 'N/A'}
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
          payerName: formData.payerName.trim(),
          payerEmail: formData.payerEmail.trim(),
          payerRef: formData.payerRef.trim()
        },
        subject: formData.subject,
        message: formData.message.trim()
      };

      // 1. Save to Database
      await submitContactForm(payload);

      // 2. Open User's default Email Client (mailto) addressed to aniketchouhan243@gmail.com
      const mailSubject = encodeURIComponent(`[WA Scheduler Support] ${formData.subject} - ${formData.loginName || formData.contactEmail}`);
      const mailBody = encodeURIComponent(generateEmailBody());
      const mailtoUrl = `mailto:${TARGET_SUPPORT_EMAIL}?subject=${mailSubject}&body=${mailBody}`;

      // Trigger mailto
      window.location.href = mailtoUrl;

      setSubmitted(true);
      toast.success('Message sent & recorded! Opening your email app...');
    } catch (err) {
      console.warn('Backend contact save error, opening mailto directly:', err);
      // Even if backend fails, still open mailto to ensure user reaches the admin!
      const mailSubject = encodeURIComponent(`[WA Scheduler Support] ${formData.subject} - ${formData.contactEmail}`);
      const mailBody = encodeURIComponent(generateEmailBody());
      window.location.href = `mailto:${TARGET_SUPPORT_EMAIL}?subject=${mailSubject}&body=${mailBody}`;
      setSubmitted(true);
      toast.success('Opening your email app to send details directly!');
    } finally {
      setLoading(false);
    }
  };

  const gmailWebUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(TARGET_SUPPORT_EMAIL)}&su=${encodeURIComponent(`[WA Scheduler Support] ${formData.subject}`)}&body=${encodeURIComponent(generateEmailBody())}`;

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
            <div className="max-w-xl mx-auto p-6 sm:p-8 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-500 text-white rounded-full flex items-center justify-center text-2xl mx-auto shadow-md">
                ✓
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Thank You! Your Inquiry is Ready to Send
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Your details have been saved. If your email application didn't open automatically, you can open Gmail Web or copy the formatted text below.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <a
                  href={gmailWebUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all flex items-center gap-1.5"
                >
                  <span>✉️</span>
                  <span>Open in Gmail Web</span>
                </a>
                <button
                  type="button"
                  onClick={handleCopyFormattedBody}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-200 dark:bg-wa-dsurf text-slate-800 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5"
                >
                  <span>📋</span>
                  <span>Copy Details</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                >
                  Send Another Message
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
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-wa-dsurf/60 border border-slate-200 dark:border-wa-dbdr space-y-3">
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
                  <div className="pt-2 border-t border-slate-200 dark:border-wa-dbdr space-y-3 animate-fadeIn">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Please provide payment details so we can verify and activate your Pro / Starter plan immediately:
                    </p>
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
                  <span>{loading ? 'Submitting...' : 'Send Message & Email to Support'}</span>
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
