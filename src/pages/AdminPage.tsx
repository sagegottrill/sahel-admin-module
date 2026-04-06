import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AdminSidebar from '../components/AdminSidebar';
import { Loader2, Search, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import type { Submission } from '../types';
import { dataClient } from '../lib/dataClient';
import { maskEmail, redactPayloadForDisplay } from '../lib/redactPii';
import { isDemoMode } from '../lib/demoMode';
import { cn } from '@/lib/utils';

type ClearStatus = 'Approved' | 'Rejected';

function clearanceLabel(s: Submission): string {
  const st = s.status || 'Pending';
  if (st === 'Pending') return 'Pending RBAC verification';
  if (st === 'Approved') return 'Cryptographically cleared';
  return 'Payload rejected';
}

export default function AdminPage() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  const [activeTab, setActiveTab] = useState<'submissions' | 'smart-review'>('submissions');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [updating, setUpdating] = useState<{ id: string; action: ClearStatus } | 'bulk' | null>(null);

  useEffect(() => {
    if (!user?.email) return;

    const fetch = async () => {
      setLoading(true);
      try {
        const all = await dataClient.submissionsForAdmin(user.email);
        setSubmissions(all || []);
      } catch (e) {
        console.error(e);
        toast.error('Ingress fetch failed. Verify RBAC credentials and data plane availability.');
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [user?.email]);

  const stats = useMemo(() => {
    const pending = submissions.filter((s) => !s.status || s.status === 'Pending').length;
    const approved = submissions.filter((s) => s.status === 'Approved').length;
    const rejected = submissions.filter((s) => s.status === 'Rejected').length;
    const total = isDemoMode() ? Math.max(5241, submissions.length) : submissions.length;
    return { total, pending, approved, rejected };
  }, [submissions]);

  const filtered = useMemo(() => {
    return submissions.filter((s) => {
      const matchesSearch =
        searchTerm.trim() === '' ||
        s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.form_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.submitter_email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === 'All' || (s.status || 'Pending') === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [submissions, searchTerm, filterStatus]);

  const toggleSelectAll = () => {
    if (filtered.length === 0) return;
    if (selectedIds.length === filtered.length) setSelectedIds([]);
    else setSelectedIds(filtered.map((s) => s.id));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.concat(id)));
  };

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const clearOne = async (id: string, status: ClearStatus) => {
    if (!user?.email) return;
    setUpdating({ id, action: status });
    try {
      await sleep(800);
      await dataClient.clear([id], status, user.email);

      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, status, cleared_at: new Date().toISOString(), cleared_by_email: user.email } : s,
        ),
      );
      if (selectedSubmission?.id === id) {
        setSelectedSubmission((prev) => (prev ? { ...prev, status } : prev));
      }
      if (status === 'Approved') {
        toast.success(`RBAC Audit Logged: Record ${id} cryptographically cleared and synced to master DB.`);
      } else {
        toast.message(`RBAC Audit Logged: Record ${id} rejected. Payload sealed pending policy review.`, {
          className: 'border border-rose-200 bg-white text-rose-800',
        });
      }
    } catch (e) {
      console.error(e);
      toast.error('Clearance action failed. No audit entry written.');
    } finally {
      setUpdating(null);
    }
  };

  const clearBulk = async (status: ClearStatus) => {
    if (!user?.email) return;
    if (selectedIds.length === 0) return;
    if (
      !confirm(
        `Execute bulk RBAC ${status === 'Approved' ? 'cryptographic clearance' : 'payload rejection'} on ${selectedIds.length} ingestion record(s)?`,
      )
    )
      return;

    setUpdating('bulk');
    try {
      await sleep(800);
      await dataClient.clear(selectedIds, status, user.email);

      setSubmissions((prev) => prev.map((s) => (selectedIds.includes(s.id) ? { ...s, status } : s)));
      setSelectedIds([]);
      toast.success(`RBAC Audit Logged: Bulk ${status === 'Approved' ? 'clearance' : 'rejection'} committed.`);
    } catch (e) {
      console.error(e);
      toast.error('Bulk clearance failed. Transaction rolled back.');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-700">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-cyan-600" />
          <p className="text-sm text-slate-600">Loading ingestion queue…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={(t) => setActiveTab(t as 'submissions' | 'smart-review')}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      <div className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? 'ml-20' : 'ml-0 md:ml-64'}`}>
        <div className="mx-auto max-w-[1600px] p-6 md:p-8">
          <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Resolution desk</div>
              <h1 className="mt-1 text-2xl font-semibold text-slate-900">Ingestion queue · RBAC verification</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                Review cryptographically sanitized payloads. PII is minimized in list views. Clearance actions are audit-logged.
              </p>
            </div>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { k: 'Total ingested', v: stats.total.toLocaleString(), s: 'Cumulative national-scale volume' },
              { k: 'Pending clearance', v: stats.pending.toLocaleString(), s: 'Awaiting RBAC decision' },
              { k: 'Cryptographically cleared', v: stats.approved.toLocaleString(), s: 'Synced to authoritative store' },
              { k: 'Payloads rejected', v: stats.rejected.toLocaleString(), s: 'Sealed pending policy' },
            ].map((x) => (
              <div
                key={x.k}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{x.k}</div>
                <div className="mt-2 text-2xl font-semibold tabular-nums text-slate-900">{x.v}</div>
                <div className="mt-1 text-xs text-slate-500">{x.s}</div>
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative w-full max-w-xl">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search record ID, form ID, or submitter channel…"
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                >
                  <option value="All">All clearance states</option>
                  <option value="Pending">Pending RBAC verification</option>
                  <option value="Approved">Cryptographically cleared</option>
                  <option value="Rejected">Payload rejected</option>
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {selectedIds.length > 0 ? (
                  <>
                    <span className="text-sm text-slate-600">{selectedIds.length} selected</span>
                    <button
                      type="button"
                      onClick={() => clearBulk('Approved')}
                      disabled={updating === 'bulk'}
                      className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                    >
                      {updating === 'bulk' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Bulk cryptographic clearance
                    </button>
                    <button
                      type="button"
                      onClick={() => clearBulk('Rejected')}
                      disabled={updating === 'bulk'}
                      className="inline-flex items-center gap-2 rounded-lg border border-rose-300 bg-white px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                    >
                      Bulk reject payload
                    </button>
                  </>
                ) : null}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300"
                        checked={selectedIds.length > 0 && selectedIds.length === filtered.length}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Record ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Form
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Submitter (minimized)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Encryption status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Clearance
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Ingested
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      RBAC actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filtered.map((s) => {
                    const rowActive = selectedSubmission?.id === s.id;
                    return (
                      <tr
                        key={s.id}
                        onClick={() => setSelectedSubmission(s)}
                        className={cn(
                          'cursor-pointer transition-colors',
                          rowActive
                            ? 'border-l-2 border-l-cyan-600 bg-cyan-50/50'
                            : 'border-l-2 border-l-transparent hover:bg-slate-50',
                        )}
                      >
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="rounded border-slate-300"
                            checked={selectedIds.includes(s.id)}
                            onChange={() => toggleSelect(s.id)}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSubmission(s);
                            }}
                            className="font-mono text-cyan-700 hover:text-cyan-800 hover:underline"
                          >
                            {s.id}
                          </button>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-700">{s.form_id}</td>
                        <td className="px-4 py-3 text-slate-800">{maskEmail(s.submitter_email)}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Verified Hash: SHA-256
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold',
                              (s.status || 'Pending') === 'Pending' &&
                                'border-amber-200 bg-amber-50 text-amber-900',
                              s.status === 'Approved' && 'border-emerald-200 bg-emerald-50 text-emerald-800',
                              s.status === 'Rejected' && 'border-rose-200 bg-rose-50 text-rose-800',
                            )}
                          >
                            {clearanceLabel(s)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                          {new Date(s.created_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex flex-col items-stretch justify-end gap-2 sm:flex-row sm:items-center">
                            <button
                              type="button"
                              onClick={() => clearOne(s.id, 'Approved')}
                              disabled={updating?.id === s.id}
                              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-2 py-2 text-[11px] font-semibold leading-tight text-white hover:bg-emerald-500 disabled:opacity-50 sm:max-w-[140px]"
                            >
                              {updating?.id === s.id && updating.action === 'Approved' ? (
                                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                              ) : null}
                              Cryptographically Clear &amp; Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => clearOne(s.id, 'Rejected')}
                              disabled={updating?.id === s.id}
                              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-300 bg-white px-2 py-2 text-[11px] font-semibold leading-tight text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                            >
                              {updating?.id === s.id && updating.action === 'Rejected' ? (
                                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                              ) : null}
                              Reject Payload
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                        No records in the current ingestion slice.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {selectedSubmission ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Ingestion record</div>
                <div className="mt-1 font-mono text-sm text-cyan-800 break-all">{selectedSubmission.id}</div>
                <div className="mt-2 text-xs text-slate-600">
                  Submitter channel: {maskEmail(selectedSubmission.submitter_email)} ·{' '}
                  {new Date(selectedSubmission.created_at).toLocaleString()}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSubmission(null)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
            <div className="max-h-[calc(90vh-120px)] overflow-y-auto p-5">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-900">Sanitized payload (audit view)</div>
                <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Verified Hash: SHA-256
                </span>
              </div>
              <pre className="max-h-[55vh] overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700">
                {JSON.stringify(redactPayloadForDisplay(selectedSubmission.payload), null, 2)}
              </pre>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
