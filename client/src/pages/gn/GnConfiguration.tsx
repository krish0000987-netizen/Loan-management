import { PageHeader, Card } from "../../components/ui";
import { Link } from "react-router-dom";
import { Facebook, Phone, MessageCircle, Mail, Globe, Settings2, Database, Zap, CreditCard, LayoutGrid, UserCheck, ShieldAlert, Search, Smartphone, Tag, Briefcase, Bell, FileText } from "lucide-react";

const INTEGRATIONS: { icon: any; name: string; status: string; tone: "done" | "pending" | "purchase"; desc: string }[] = [
  { icon: Facebook, name: "Meta / Facebook", status: "PENDING", tone: "pending", desc: "Connect Facebook Lead Ads & pages." },
  { icon: Phone, name: "IVR", status: "PENDING", tone: "pending", desc: "Call routing & IVR provider." },
  { icon: MessageCircle, name: "WhatsApp", status: "PURCHASE", tone: "purchase", desc: "Purchase to unlock WhatsApp Business API & drip." },
  { icon: Mail, name: "Email / SMTP", status: "PENDING", tone: "pending", desc: "Outbound email server settings." },
  { icon: Globe, name: "Website", status: "DONE", tone: "done", desc: "Your public lead-capture website & pages." },
  { icon: Settings2, name: "Field Customisation", status: "PENDING", tone: "pending", desc: "Custom fields per entity." },
  { icon: Database, name: "Lead Service", status: "PENDING", tone: "pending", desc: "Buy leads & product — we run the ads for your city." },
  { icon: Zap, name: "Integrations", status: "PENDING", tone: "pending", desc: "Connect external tools & third-party apps." },
  { icon: CreditCard, name: "Razorpay", status: "PENDING", tone: "pending", desc: "Payment gateway for collections." },
  { icon: LayoutGrid, name: "Custom Status", status: "DONE", tone: "done", desc: "Lead & loan statuses and view rules." },
  { icon: UserCheck, name: "Assignment Rules", status: "PENDING", tone: "pending", desc: "Auto-assign leads to your team." },
  { icon: ShieldAlert, name: "Credit Report Policy", status: "PENDING", tone: "pending", desc: "Require a collected payment before a lead's CIBIL / Experian pull." },
  { icon: Search, name: "Google Ads", status: "PENDING", tone: "pending", desc: "Track ad spend, leads & ROAS from Google Ads." },
  { icon: Smartphone, name: "PhonePe", status: "PENDING", tone: "pending", desc: "PhonePe gateway for collections." },
  { icon: Tag, name: "Lead Sources", status: "PENDING", tone: "pending", desc: "Where your leads come from." },
  { icon: Briefcase, name: "Product Verticals", status: "DONE", tone: "done", desc: "Enable loan / MF / insurance / stocks." },
  { icon: Bell, name: "PDD Alerts", status: "PENDING", tone: "pending", desc: "Who gets emailed when RC / Insurance is cleared on a loan." },
  { icon: FileText, name: "Invoice Format", status: "PENDING", tone: "pending", desc: "Choose your invoice layout + collection bank details." }
];

export function GnConfiguration() {
  return (
    <div className="space-y-5">
      <PageHeader title="Configuration" sub="Connect your channels & integrations — pick one to configure it" breadcrumb="Growth Nations / Configuration" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {INTEGRATIONS.map((i) => (
          <div key={i.name} className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-brand-300 transition-colors cursor-pointer">
            <div className="flex items-start justify-between">
              <div className="w-8 h-8 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center"><i.icon className="w-4 h-4 text-zinc-600" /></div>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${i.tone === "done" ? "bg-emerald-50 text-emerald-600" : i.tone === "purchase" ? "bg-violet-50 text-violet-600" : "bg-amber-50 text-amber-700"}`}>{i.status}</span>
            </div>
            <div className="text-[13px] font-semibold text-zinc-800 mt-2.5">{i.name}</div>
            <div className="text-[11px] text-zinc-400 mt-0.5">{i.desc}</div>
            {i.tone === "purchase" && <button className="btn btn-primary text-[11px] mt-3">Purchase</button>}
          </div>
        ))}
      </div>
      <div className="text-[10.5px] text-zinc-400">Statuses are demo configuration states. <Link to="/gn/apis" className="text-brand-600 font-semibold">Verification APIs</Link> run in sandbox mode until credentials are added.</div>
    </div>
  );
}
