import React from 'react';
import { Smartphone, MapPin, CheckCircle2, Clock, Navigation } from 'lucide-react';

export const FieldSalesSection: React.FC = () => {
  return (
    <section id="field-sales" className="py-24 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-sky-700 text-xs font-bold uppercase tracking-wider">
              <Smartphone className="w-3.5 h-3.5 text-sky-600" />
              <span>FIELD SALES & TELECALLING ENGINE</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight leading-tight">
              CONNECT FIELD TEAMS TO THE LENDING ENGINE.
            </h2>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Equip doorstep verification agents and field collection executives with mobile apps that capture geo-tagged documents, offline photo proof, and instant customer sign-offs.
            </p>

            <div className="space-y-3 pt-2 text-sm font-semibold text-slate-800">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>GPS Geo-tagged Property & Business Residence Verification</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Offline Mobile Mode for Low-Connectivity Rural Branches</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Real-Time Route Optimization for Field Collection Agents</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-white">Agent App: Ramesh Kumar (Field Officer #402)</span>
              </div>
              <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded">
                GPS SYNCED
              </span>
            </div>

            <div className="space-y-2">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-white font-bold">
                  <span>Visit #1: Ananya Corp (Site Inspection)</span>
                  <span className="text-emerald-400">COMPLETED</span>
                </div>
                <p className="text-slate-400">Geo-tag: 19.0760° N, 72.8777° E • Photos: 4 Captured</p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-white font-bold">
                  <span>Visit #2: Karan Traders (Collection PTP)</span>
                  <span className="text-amber-400">EN ROUTE</span>
                </div>
                <p className="text-slate-400">Distance: 2.4 km • Target EMI Collection: ₹48,200</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
