import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { CheckCircle2, ShieldCheck, XCircle } from 'lucide-react';

export default function DashboardPage() {
  const navigate = useNavigate();

  const [rows, setRows] = useState(() => {
    const now = Date.now();
    return Array.from({ length: 8 }).map((_, i) => ({
      id: `Entity-${Math.random().toString(16).slice(2, 6).toUpperCase()}${i}`,
      ts: new Date(now - i * 1000 * 60 * 13).toISOString(),
      encryption: 'Verified' as const,
      status: (i % 5 === 0 ? 'Approved' : i % 7 === 0 ? 'Rejected' : 'Pending') as 'Pending' | 'Approved' | 'Rejected'
    }));
  });

  const stats = useMemo(() => {
    const total = 5241;
    const pending = rows.filter((r) => r.status === 'Pending').length + 134;
    return { total, pending };
  }, [rows]);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Top nav */}
      <div className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/75 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-slate-700">
            Total Submissions: <span className="text-slate-900 font-semibold">{stats.total.toLocaleString()}</span>
            <span className="mx-3 text-slate-300">·</span>
            Pending Clearance: <span className="text-yellow-700 font-semibold">{stats.pending.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm"
            >
              Back to landing
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex items-end justify-between gap-6">
          <div>
            <div className="text-cyan-700 text-xs font-semibold tracking-wider uppercase">Demo Dashboard</div>
            <h1 className="mt-2 text-3xl md:text-4xl font-semibold">Clearance Engine</h1>
            <p className="mt-3 text-slate-600 max-w-2xl">
              Static, deployable demo. No backend. Click actions to clear or reject records and watch the queue update.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4 text-cyan-700" />
            Encryption pipeline: <span className="text-slate-700 font-semibold">Verified</span>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Record ID</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Ingestion Timestamp</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Encryption</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Clearance</th>
                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 font-mono text-sm text-cyan-800">{r.id}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{new Date(r.ts).toLocaleString()}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-2 rounded-full bg-cyan-600/10 border border-cyan-600/15 px-3 py-1 text-xs font-semibold text-cyan-800">
                        <ShieldCheck className="h-3.5 w-3.5" /> Verified
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {r.status === 'Pending' ? (
                        <span className="inline-flex items-center gap-2 rounded-full bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 text-xs font-semibold text-yellow-800">
                          Pending
                        </span>
                      ) : r.status === 'Approved' ? (
                        <span className="inline-flex items-center gap-2 rounded-full bg-cyan-600/10 border border-cyan-600/15 px-3 py-1 text-xs font-semibold text-cyan-800">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 rounded-full bg-red-500/10 border border-red-500/20 px-3 py-1 text-xs font-semibold text-red-700">
                          <XCircle className="h-3.5 w-3.5" /> Rejected
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: 'Approved' } : x)));
                            toast.success('Record Cryptographically Cleared');
                          }}
                          className="rounded-xl bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-600 transition-colors shadow-sm"
                        >
                          Clear
                        </button>
                        <button
                          onClick={() => {
                            setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: 'Rejected' } : x)));
                            toast.error('Record Rejected');
                          }}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
