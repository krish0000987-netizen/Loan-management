import React from 'react';
import { motion } from 'motion/react';
import { Smartphone, CheckCircle2, Download, CreditCard, Bell } from 'lucide-react';

export const CustomerPortalSection: React.FC = () => {
  return (
    <section id="customer-portal" className="py-24 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text Description */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-6 space-y-6"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider">
              <Smartphone className="w-3.5 h-3.5 text-blue-600" />
              <span>BORROWER MOBILE & WEB PORTAL</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight leading-tight">
              A BETTER BORROWER EXPERIENCE STARTS HERE.
            </h2>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Empower your borrowers with a white-labeled mobile web portal to track application stages, download RBI Key Fact Statements (KFS), pay EMIs via UPI, and access support.
            </p>

            <div className="space-y-3 pt-2 text-sm font-semibold text-slate-800">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Instant KFS & Loan Agreement Aadhaar eSign</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>One-Click UPI & eNACH Recurring EMI Payments</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Real-time Application Status Timeline & NOC Download</span>
              </div>
            </div>
          </motion.div>

          {/* Right Animated Mobile Device Frame */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-6 flex justify-center"
          >
            <div className="w-80 rounded-[40px] bg-slate-900 p-4 border-4 border-slate-800 shadow-2xl space-y-4 text-white font-mono text-xs relative">
              
              {/* Floating Badge */}
              <motion.div 
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-4 -right-4 bg-emerald-500 text-slate-950 font-extrabold text-[10px] px-3 py-1.5 rounded-full shadow-lg z-20 border border-emerald-400"
              >
                100% RBI COMPLIANT
              </motion.div>

              {/* Phone Notch */}
              <div className="w-28 h-4 bg-slate-950 mx-auto rounded-b-xl flex items-center justify-center">
                <div className="w-10 h-1 bg-slate-800 rounded-full" />
              </div>

              {/* Phone App Content */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between px-1">
                  <div>
                    <span className="text-[10px] text-slate-400">WELCOME BACK</span>
                    <div className="font-bold text-white text-sm">Rahul Sharma</div>
                  </div>
                  <Bell className="w-4 h-4 text-slate-400" />
                </div>

                {/* Active Loan Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 space-y-2 shadow-lg relative overflow-hidden">
                  <span className="text-[10px] uppercase text-blue-200 font-bold">Active Business Loan</span>
                  <div className="text-xl font-bold text-white">₹25,00,000</div>
                  <div className="flex items-center justify-between text-[10px] text-blue-100 pt-1 border-t border-blue-500/40">
                    <span>Next EMI: 05 Aug</span>
                    <span className="font-bold">₹51,000</span>
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <button className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-center font-bold text-blue-300 flex items-center justify-center gap-1 cursor-pointer transition-colors">
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Pay EMI</span>
                  </button>
                  <button className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-center font-bold text-emerald-300 flex items-center justify-center gap-1 cursor-pointer transition-colors">
                    <Download className="w-3.5 h-3.5" />
                    <span>KFS PDF</span>
                  </button>
                </div>

                {/* App Status Tracker */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Application #NX-10482</span>
                  <div className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Sanctioned & Disbursement Ready</span>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>

        </div>

      </div>
    </section>
  );
};
