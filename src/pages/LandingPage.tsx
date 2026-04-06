import { motion, useScroll, useSpring } from 'framer-motion';
import { ArrowRight, Github, ShieldCheck, Database, Workflow, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const container = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const marqueeItems = [
  'Cryptographic Sanitization',
  'High-Load Routing',
  'Offline-First Ingestion',
  'RBAC Security',
  'Zero-Downtime Architecture',
  'Data Sovereignty'
];

const GITHUB_REPO_URL = 'https://github.com/sagegottrill/sahel-admin-module';

export default function LandingPage() {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 20, mass: 0.2 });

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Scroll progress */}
      <motion.div
        style={{ scaleX: progress }}
        className="fixed left-0 top-0 h-[2px] w-full origin-left bg-gradient-to-r from-cyan-600 via-cyan-500 to-yellow-400 z-[60]"
      />

      {/* Top nav */}
      <div className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/75 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="text-xs tracking-wide text-slate-600">
            Open-source ingestion infrastructure · Sahel Resilience Stack · <span className="text-cyan-700">Borno State, Nigeria</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-700">
            <a href="#challenge" className="hover:text-slate-900 transition-colors">Challenge</a>
            <a href="#architecture" className="hover:text-slate-900 transition-colors">Architecture</a>
            <a href="#capabilities" className="hover:text-slate-900 transition-colors">Capabilities</a>
            <a href="#get-started" className="hover:text-slate-900 transition-colors">Get started</a>
          </nav>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-cyan-500/12 blur-3xl" />
          <div className="absolute -bottom-40 -right-40 h-[520px] w-[520px] rounded-full bg-yellow-500/12 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-10">
          <motion.div variants={container} initial="hidden" animate="show" className="max-w-3xl">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 shadow-sm">
              <ShieldCheck className="h-3.5 w-3.5 text-cyan-700" />
              Secure Ingestion & Clearance Engine
            </motion.div>

            <motion.h1 variants={fadeUp} className="mt-6 text-4xl md:text-6xl font-semibold leading-tight">
              The Engine for <span className="text-cyan-700">High-Load</span> Civic Infrastructure.
            </motion.h1>

            <motion.p variants={fadeUp} className="mt-5 text-base md:text-lg text-slate-600 leading-relaxed">
              A secure, offline-capable administrative ingestion and clearance blueprint. Built to process thousands of records
              in infrastructure deserts without dropping a single packet.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-8 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-700 px-5 py-3 font-semibold text-white hover:bg-cyan-600 transition-colors shadow-sm"
              >
                Access live demo <ArrowRight className="h-4 w-4" />
              </button>
              <a
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-800 hover:bg-slate-50 transition-colors shadow-sm"
              >
                <Github className="h-4 w-4" /> View GitHub
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="capabilities" className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: 'Live demo', desc: 'Clearance Dashboard UI (static, deployable).', icon: Workflow },
            { title: 'Repository', desc: 'Core schema, policies, and open-source engine.', icon: Database },
            { title: 'Architecture', desc: 'Cryptographic pipeline patterns for edge integrity.', icon: ShieldCheck },
            { title: 'Admin access', desc: 'Secure operator login (demo + real backends supported).', icon: KeyRound }
          ].map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.title} className="rounded-2xl border border-slate-200 bg-white p-5 hover:bg-slate-50 transition-colors shadow-sm">
                <div className="h-10 w-10 rounded-xl bg-cyan-600/10 flex items-center justify-center border border-cyan-600/15">
                  <Icon className="h-5 w-5 text-cyan-700" />
                </div>
                <div className="mt-4 font-semibold">{c.title}</div>
                <div className="mt-1 text-sm text-slate-600 leading-relaxed">{c.desc}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Marquee */}
      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-4 overflow-hidden">
          <div className="relative">
            <div className="flex gap-6 whitespace-nowrap animate-[marquee_22s_linear_infinite]">
              {[...marqueeItems, ...marqueeItems].map((t, i) => (
                <div key={`${t}-${i}`} className="text-sm text-slate-600">
                  <span className="text-cyan-700">◆</span> {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats row */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { k: '5,241', v: 'Simulated Submissions' },
            { k: '100%', v: 'Cryptographic Integrity' },
            { k: '< 10ms', v: 'Query Latency (Simulated)' }
          ].map((s) => (
            <div key={s.v} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-3xl font-semibold text-slate-900">{s.k}</div>
              <div className="mt-1 text-sm text-slate-600">{s.v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Challenge */}
      <section id="challenge" className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <div className="text-cyan-700 text-xs font-semibold tracking-wider uppercase">Context & Challenge</div>
            <h2 className="mt-3 text-3xl md:text-4xl font-semibold leading-tight">
              Mass intake breaks traditional portals.
            </h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              When connectivity drops, power is intermittent, and thousands attempt to submit at once, most systems fail silently.
              This engine is designed for clearance workflows under fragile infrastructure constraints.
            </p>
          </div>

          <div className="lg:col-span-7 space-y-4">
            {[
              { m: '5,000+ Bottlenecks', d: 'Peak load bursts crash conventional cloud portals.' },
              { m: 'Zero Offline Resilience', d: 'Forms fail when telecom drops; users abandon.' },
              { m: 'Data Vulnerability', d: 'Weak sanitization exposes sensitive citizen/ops data.' },
              { m: 'Operational Blind Spots', d: 'No clearance queue, no audit trail, no visibility at the edge.' }
            ].map((x) => (
              <motion.div
                key={x.m}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.35 }}
                className="rounded-2xl border border-slate-200 bg-white p-5 hover:bg-slate-50 transition-colors shadow-sm"
              >
                <div className="font-semibold text-yellow-700">{x.m}</div>
                <div className="mt-1 text-sm text-slate-600">{x.d}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section id="architecture" className="mx-auto max-w-7xl px-6 pb-16">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="text-cyan-700 text-xs font-semibold tracking-wider uppercase">Technical Architecture</div>
          <h2 className="mt-3 text-3xl font-semibold">Three-step clearance pipeline</h2>
          <div className="mt-2 text-sm text-slate-600">Edge-optimized processing designed for zero-downtime.</div>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-4 lg:sticky lg:top-24">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="mt-4 space-y-2">
                  {['Asynchronous Ingestion', 'Cryptographic Sanitization', 'Clearance & Verification'].map((t) => (
                    <div key={t} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2">
                      <span className="h-2 w-2 rounded-full bg-cyan-700" />
                      <span className="text-sm text-slate-800">{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-4">
              {[
                {
                  n: '01',
                  t: 'Asynchronous Ingestion',
                  d: 'Frontend handles dynamic data entry without refresh and can be extended to queue offline-first sync.'
                },
                {
                  n: '02',
                  t: 'Cryptographic Sanitization',
                  d: 'Blueprint supports strict sanitization patterns to mitigate injection and XSS at the edge.'
                },
                {
                  n: '03',
                  t: 'Clearance & Verification',
                  d: 'RBAC partitions access; admins clear records as Approved/Rejected with audit metadata.'
                }
              ].map((s) => (
                <motion.div
                  key={s.n}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.35 }}
                  className="rounded-2xl border border-slate-200 bg-white p-6 hover:bg-slate-50 transition-colors shadow-sm"
                >
                  <div className="text-cyan-700 font-mono text-sm">{s.n}</div>
                  <div className="mt-2 font-semibold text-lg">{s.t}</div>
                  <div className="mt-2 text-sm text-slate-600 leading-relaxed">{s.d}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Get started */}
      <section id="get-started" className="mx-auto max-w-7xl px-6 pb-20">
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-r from-cyan-500/10 to-yellow-500/10 p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="text-sm text-slate-600">Ready to see the clearance engine?</div>
            <div className="mt-1 text-2xl md:text-3xl font-semibold">Launch the live demo dashboard.</div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white transition-colors hover:bg-slate-800"
            >
              Access live demo <ArrowRight className="h-4 w-4" />
            </button>
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-800 shadow-sm transition-colors hover:bg-slate-50"
            >
              <Github className="h-4 w-4" /> View on GitHub
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

