import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AdminSidebar from '../components/AdminSidebar';
import { Search } from 'lucide-react';
import type { Submission } from '../types';
import { dataClient } from '../lib/dataClient';

type ClearStatus = 'Approved' | 'Rejected';

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
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.email) return;

    const fetch = async () => {
      setLoading(true);
      try {
        const all = await dataClient.submissionsForAdmin(user.email);
        setSubmissions(all || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetch();
    return;
  }, [user?.email]);

  const stats = useMemo(() => {
    const total = submissions.length;
    const pending = submissions.filter((s) => !s.status || s.status === 'Pending').length;
    const approved = submissions.filter((s) => s.status === 'Approved').length;
    const rejected = submissions.filter((s) => s.status === 'Rejected').length;
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

  const clearOne = async (id: string, status: ClearStatus) => {
    if (!user?.email) return;
    setUpdatingId(id);
    try {
      await dataClient.clear([id], status, user.email);

      setSubmissions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status, cleared_at: new Date().toISOString(), cleared_by_email: user.email } : s))
      );
      if (selectedSubmission?.id === id) {
        setSelectedSubmission((prev) => (prev ? { ...prev, status } : prev));
      }
    } catch (e) {
      console.error(e);
      alert('Failed to update submission status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const clearBulk = async (status: ClearStatus) => {
    if (!user?.email) return;
    if (selectedIds.length === 0) return;
    if (!confirm(`Clear ${selectedIds.length} submissions as ${status}?`)) return;

    setUpdatingId('bulk');
    try {
      await dataClient.clear(selectedIds, status, user.email);

      setSubmissions((prev) => prev.map((s) => (selectedIds.includes(s.id) ? { ...s, status } : s)));
      setSelectedIds([]);
    } catch (e) {
      console.error(e);
      alert('Bulk clear failed.');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-teal"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={(t) => setActiveTab(t as any)}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      <div className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? 'ml-20' : 'ml-0 md:ml-64'}`}>
        <div className="p-8 max-w-[1600px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#1e3a5f]">Submission Review</h1>
              <p className="text-gray-500 text-sm mt-1">
                High-volume review queue: approve/reject (“clear”) incoming submissions.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-5 rounded-xl border border-gray-100">
              <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Total</div>
              <div className="text-2xl font-bold text-[#1e3a5f] mt-1">{stats.total}</div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-100">
              <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Pending</div>
              <div className="text-2xl font-bold text-[#1e3a5f] mt-1">{stats.pending}</div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-100">
              <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Approved</div>
              <div className="text-2xl font-bold text-[#1e3a5f] mt-1">{stats.approved}</div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-100">
              <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Rejected</div>
              <div className="text-2xl font-bold text-[#1e3a5f] mt-1">{stats.rejected}</div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
              <div className="flex-1 flex items-center gap-3">
                <div className="relative w-full max-w-xl">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by submission id, form id, or email…"
                    className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-transparent"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-3 py-2 border border-gray-200 rounded-lg"
                >
                  <option value="All">All</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                {selectedIds.length > 0 ? (
                  <>
                    <span className="text-sm text-gray-600">{selectedIds.length} selected</span>
                    <button
                      onClick={() => clearBulk('Approved')}
                      disabled={updatingId === 'bulk'}
                      className="px-4 py-2 bg-brand-teal text-white rounded-lg font-semibold hover:bg-[#3d8568] disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => clearBulk('Rejected')}
                      disabled={updatingId === 'bulk'}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </>
                ) : null}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      <input
                        type="checkbox"
                        checked={selectedIds.length > 0 && selectedIds.length === filtered.length}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Submission</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Form</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Submitted</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Clear</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selectedIds.includes(s.id)} onChange={() => toggleSelect(s.id)} />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedSubmission(s)}
                          className="font-mono text-sm text-brand-blue hover:underline"
                        >
                          {s.id}
                        </button>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-700">{s.form_id}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{s.submitter_email}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                          {s.status || 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{new Date(s.created_at).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => clearOne(s.id, 'Approved')}
                            disabled={updatingId === s.id}
                            className="px-3 py-1.5 rounded-lg bg-brand-teal text-white text-sm font-semibold hover:bg-[#3d8568] disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => clearOne(s.id, 'Rejected')}
                            disabled={updatingId === s.id}
                            className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                        No submissions found.
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
        <div className="fixed inset-0 bg-black/50 z-[80] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-500">Submission</div>
                <div className="font-mono text-sm text-[#1e3a5f] break-all">{selectedSubmission.id}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {selectedSubmission.submitter_email} • {new Date(selectedSubmission.created_at).toLocaleString()}
                </div>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
            <div className="p-5">
              <div className="text-sm font-semibold text-gray-700 mb-2">Payload</div>
              <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs overflow-auto max-h-[60vh]">
                {JSON.stringify(selectedSubmission.payload, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

