'use client';
import { ArrowDown, Zap, Shield, Globe, Code } from 'lucide-react';
import ConfigForm from '@/components/generator/ConfigForm';
import ConfigPreview from '@/components/generator/ConfigPreview';
import DeploySection from '@/components/generator/DeploySection';
import AdSlot from '@/components/ui/AdSlot';
import { useState } from 'react';
import { useUIStore } from '@/stores/uiStore';

function HeroImportButton() {
  const { openImportModal } = useUIStore();
  return (
    <button
      onClick={openImportModal}
      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl border border-dark-600 text-dark-300 font-semibold text-sm hover:bg-dark-800 transition-colors"
    >
      Import Config
    </button>
  );
}

const features = [
  { icon: <Zap className="w-5 h-5" />, title: 'Instant Generation', desc: 'Config updates in real-time as you change settings' },
  { icon: <Shield className="w-5 h-5" />, title: '100% Client-Side', desc: 'No data leaves your browser — ever' },
  { icon: <Globe className="w-5 h-5" />, title: 'Production Ready', desc: 'Best-practice configs with helpful comments' },
  { icon: <Code className="w-5 h-5" />, title: 'Open Source', desc: 'Free to use, modify, and contribute to' },
];

const faqs = [
  {
    q: 'What is Nginx?',
    a: 'Nginx (pronounced "engine-x") is a high-performance HTTP server, reverse proxy, and load balancer. It\'s used by millions of websites worldwide, including Netflix, Airbnb, and GitHub.',
  },
  {
    q: 'How do I install this config?',
    a: 'Download the generated nginx.conf file and place it in your Nginx configuration directory (usually /etc/nginx/). Then run "sudo nginx -t" to test the configuration and "sudo systemctl reload nginx" to apply it.',
  },
  {
    q: 'Is this tool free?',
    a: 'Yes! This tool is 100% free and open-source. No signup, no limits, no hidden costs.',
  },
  {
    q: 'Do you store my data?',
    a: 'No. Everything runs entirely in your browser. No data is sent to any server. Your configuration never leaves your machine.',
  },
  {
    q: 'Can I use the generated config in production?',
    a: 'Yes. The generated configurations follow Nginx best practices and include helpful comments. However, always test your config with "nginx -t" before deploying to production.',
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-dark-700 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left"
      >
        <span className="text-sm font-medium text-dark-300">{q}</span>
        <ArrowDown className={`w-4 h-4 text-dark-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="pb-4 text-sm text-dark-400 animate-fade-in-up">
          {a}
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      {/* ─── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent-500/10 via-transparent to-dark-950 pointer-events-none" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-accent-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-500/10 border border-accent-500/20 mb-6">
              <span className="w-2 h-2 rounded-full bg-accent-400 animate-pulse" />
              <span className="text-xs font-medium text-accent-400">Free &amp; Open Source</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-4">
              <span className="text-dark-200">Server configs,</span>
              <br />
              <span className="bg-gradient-to-r from-accent-400 to-accent-600 bg-clip-text text-transparent">
                without the headache.
              </span>
            </h1>

            <p className="mt-6 text-lg text-dark-400 max-w-2xl mx-auto leading-relaxed">
              Generate, import &amp; lint production-ready server configurations visually.
              <br className="hidden sm:block" />
              100% client-side. No data leaves your browser.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="#generator"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-accent-500 text-white font-semibold text-sm hover:bg-accent-600 transition-all shadow-lg shadow-accent-500/25 hover:shadow-accent-500/40 glow-pulse"
              >
                Start Generating <ArrowDown className="w-4 h-4" />
              </a>

              <HeroImportButton />
            </div>
          </div>

          {/* Feature cards */}
          <div className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <div
                key={i}
                className="p-4 rounded-xl border border-dark-700 bg-surface-raised/50 backdrop-blur-sm text-center"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-accent-500/10 text-accent-400 mb-3">
                  {f.icon}
                </div>
                <h3 className="text-sm font-semibold text-dark-300">{f.title}</h3>
                <p className="text-xs text-dark-500 mt-1">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <AdSlot position="header" />

      {/* ─── Generator ────────────────────────────────────── */}
      <section id="generator" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-dark-300">Configure Your Server</h2>
          <p className="text-sm text-dark-500 mt-1">Adjust settings on the left, see your config update live on the right</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left — Form */}
          <div className="lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:pr-3 space-y-3">
            <ConfigForm />
          </div>

          {/* Right — Preview */}
          <div className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)]">
            <ConfigPreview />
          </div>
        </div>
      </section>

      {/* ─── Deploy ──────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <DeploySection />
      </div>

      <AdSlot position="inline" />

      {/* ─── FAQ ──────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-dark-300 text-center mb-8">Frequently Asked Questions</h2>
        <div className="border border-dark-700 rounded-xl overflow-hidden bg-surface-raised p-6">
          {faqs.map((faq, i) => (
            <FAQItem key={i} {...faq} />
          ))}
        </div>
      </section>
    </>
  );
}
