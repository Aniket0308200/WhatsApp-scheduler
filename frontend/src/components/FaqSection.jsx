import React, { useState } from 'react';

const FAQS = [
  {
    q: 'Does my phone need to stay connected to the internet?',
    a: 'Yes, because messages are routed securely through WhatsApp Multi-Device session protocols, your phone should remain connected so messages dispatch seamlessly on schedule.'
  },
  {
    q: 'Is there a free plan available for 1st-time users?',
    a: 'Absolutely! Our Starter plan is 100% free forever for up to 50 scheduled messages per month with Google Contacts integration. No credit card is required to get started.'
  },
  {
    q: 'How does Google Contacts sync work?',
    a: 'You can securely sign in with Google Contacts. The system fetches contact names and mobile phone numbers locally so you can search and pick message recipients effortlessly.'
  },
  {
    q: 'Can I send bulk messages using CSV or Excel files?',
    a: 'Yes! The Pro and Enterprise plans allow uploading bulk recipient lists formatted in CSV with custom variables for personalized mass communication.'
  },
  {
    q: 'Are my WhatsApp messages and private data safe?',
    a: '100% safe. Your authentication session and scheduled messages are encrypted and kept in your local browser/environment. We never store or sell your private conversation content.'
  }
];

export default function FaqSection() {
  const [openIdx, setOpenIdx] = useState(0);

  const toggleFaq = (idx) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-12 sm:py-16 relative">
      <div className="max-w-4xl mx-auto px-2 sm:px-4">
        
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-500/20 border border-emerald-500/20 mb-3">
            <span>❓ Frequently Asked Questions</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Have Questions? We Have <span className="bg-gradient-to-r from-wa-teal to-emerald-500 bg-clip-text text-transparent dark:from-emerald-400 dark:to-wa-green">Answers</span>
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-wa-dmuted">
            Everything you need to know about WhatsApp Scheduler setup, privacy, and plans.
          </p>
        </div>

        {/* Accordion */}
        <div className="space-y-4">
          {FAQS.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="bg-white dark:bg-wa-dpanel rounded-2xl border border-slate-200/80 dark:border-wa-dbdr shadow-sm overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 font-bold text-slate-900 dark:text-white text-base sm:text-lg focus:outline-none hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                >
                  <span>{faq.q}</span>
                  <span className={`w-8 h-8 rounded-full bg-slate-100 dark:bg-wa-dsurf flex items-center justify-center text-sm font-extrabold shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 bg-emerald-500 text-white dark:bg-emerald-500' : 'text-slate-500 dark:text-wa-dmuted'}`}>
                    ↓
                  </span>
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 pt-1 text-xs sm:text-sm text-slate-600 dark:text-wa-dmuted leading-relaxed border-t border-slate-100 dark:border-wa-dbdr/40 animate-fadeIn">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
