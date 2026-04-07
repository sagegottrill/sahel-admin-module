import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  Activity,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  DatabaseZap,
  FileCheck,
  FileText,
  Gauge,
  Loader2,
  ShieldCheck,
  UserRound,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

const TOTAL_INGESTED = 5241;
const INITIAL_PENDING = 142;
const PAGE_SIZE = 5;

const TENANTS = [
  'Ministry of Health',
  'NGO Coalition',
  'State Emergency Management Agency',
  'Border Security Directorate',
  'Regional PHC Authority',
  'Civic Data Trust',
] as const;

const ROLES = [
  'Field Officer',
  'Regional Dispatcher',
  'Data Scout',
  'Clinical Liaison',
  'Logistics Coordinator',
  'Incident Registrar',
] as const;

const DOC_TEMPLATES = [
  { name: 'National ID', states: ['verified', 'verified', 'attached'] as const },
  { name: 'Clearance Form', states: ['attached', 'verified', 'verified'] as const },
  { name: 'Duty Assignment', states: ['verified', 'attached', 'verified'] as const },
] as const;

const NAME_MASKS = [
  'A**** M*******',
  'S**** I******',
  'M**** A*******',
  'H**** U******',
  'K**** B******',
  'J**** N*******',
  'R**** T*******',
  'L**** D*******',
];

type DocumentItem = { name: string; state: 'verified' | 'attached' };

type QueueRow = {
  id: string;
  registrantMasked: string;
  ingestedAtLabel: string;
  encryption: {
    label: 'Verified Hash';
    algorithm: 'SHA-256';
    cipher: 'AES-256';
  };
  clearance: 'Pending Approval';
  sanitized: {
    maskedName: string;
    maskedPhone: string;
    origin: string;
    submissionType: string;
  };
  tenant: string;
  requestedRole: string;
  documents: DocumentItem[];
};

function buildQueueRow(index: number): QueueRow {
  const id = `USR-${String(index).padStart(4, '0')}`;
  const mins = (index * 7 + 2) % 59;
  const ingestedAtLabel = mins === 0 ? 'just now' : `${mins} mins ago`;
  return {
    id,
    registrantMasked: NAME_MASKS[index % NAME_MASKS.length],
    ingestedAtLabel,
    encryption: { label: 'Verified Hash', algorithm: 'SHA-256', cipher: 'AES-256' },
    clearance: 'Pending Approval',
    sanitized: {
      maskedName: NAME_MASKS[index % NAME_MASKS.length],
      maskedPhone: `+234 *** *** ${String(1000 + (index % 9000)).slice(-4)}`,
      origin: `Region: ${['Lake Chad Basin', 'NE Corridor', 'Border Ward', 'State Hub', 'Cross-border point'][index % 5]}`,
      submissionType: `Intake: ${['Mass registration', 'Credential update', 'Incident report', 'Operator enrollment', 'Field verification'][index % 5]}`,
    },
    tenant: TENANTS[index % TENANTS.length],
    requestedRole: ROLES[index % ROLES.length],
    documents: DOC_TEMPLATES.map((t, di) => ({
      name: t.name,
      state: t.states[(index + di) % 3],
    })),
  };
}

function createInitialQueue(): QueueRow[] {
  return Array.from({ length: INITIAL_PENDING }, (_, i) => buildQueueRow(i));
}

function useIsLargeScreen() {
  const [lg, setLg] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const sync = () => setLg(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  return lg;
}

function MetricCard(props: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  subtle?: string;
}) {
  return (
    <Card className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium uppercase tracking-wider text-slate-500">{props.label}</div>
          <div className="mt-2 text-2xl font-semibold tabular-nums text-slate-900">{props.value}</div>
          {props.subtle ? <div className="mt-1 text-xs text-slate-500">{props.subtle}</div> : null}
        </div>
        <div className="shrink-0 rounded-xl border border-slate-200 bg-slate-50 p-2 text-cyan-700">{props.icon}</div>
      </div>
    </Card>
  );
}

type ReviewPanelProps = {
  selectedPayload: QueueRow | null;
  approvingId: string | null;
  rejectingId: string | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
};

function ReviewPanelBody({ selectedPayload: selected, approvingId, rejectingId, onApprove, onReject }: ReviewPanelProps) {
  if (!selected) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-16 text-center">
        <div className="rounded-full border border-dashed border-slate-300 bg-slate-50 p-4">
          <ShieldCheck className="h-8 w-8 text-slate-400" />
        </div>
        <p className="max-w-[280px] text-sm font-medium text-slate-700">
          Awaiting payload selection for cryptographic review.
        </p>
        <p className="max-w-xs text-xs text-slate-500">
          Select a row from the ingestion queue to load tenant context, document verification, and RBAC clearance
          actions.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-5 overflow-y-auto pb-4">
      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-slate-500">System ID</div>
            <div className="mt-1 font-mono text-lg font-semibold text-slate-900">{selected.id}</div>
          </div>
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800">
            Verified Hash · {selected.encryption.algorithm}
          </Badge>
        </div>

        <div className="mt-4 space-y-2 text-sm">
          <div className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-slate-500">Deploying tenant / organization</span>
            <span className="font-medium text-slate-900">{selected.tenant}</span>
          </div>
          <div className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-slate-500">Requested role</span>
            <span className="font-medium text-slate-900">{selected.requestedRole}</span>
          </div>
          <div className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-slate-500">Ingress time</span>
            <span className="font-medium text-slate-900">{selected.ingestedAtLabel}</span>
          </div>
          <div className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-slate-500">Cipher suite</span>
            <span className="font-medium text-emerald-700">{selected.encryption.cipher}</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="text-xs font-medium uppercase tracking-wider text-slate-500">Document verification</div>
        <p className="mt-1 text-xs text-slate-500">Simulated credential objects attached to this payload.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {selected.documents.map((d) =>
            d.state === 'verified' ? (
              <span
                key={d.name}
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800"
              >
                <FileCheck className="h-3.5 w-3.5" />
                {d.name}: Verified
              </span>
            ) : (
              <span
                key={d.name}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"
              >
                <FileText className="h-3.5 w-3.5 text-slate-500" />
                {d.name}: Attached
              </span>
            ),
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium uppercase tracking-wider text-slate-500">PII-minimized registrant</div>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <UserRound className="h-3.5 w-3.5" />
            Redacted
          </div>
        </div>
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
            <span className="text-slate-500">Name</span>
            <span className="font-medium text-slate-900">{selected.sanitized.maskedName}</span>
          </div>
          <div className="flex justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
            <span className="text-slate-500">Contact</span>
            <span className="font-medium text-slate-900">{selected.sanitized.maskedPhone}</span>
          </div>
          <div className="flex justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
            <span className="text-slate-500">Origin</span>
            <span className="text-right font-medium text-slate-900">{selected.sanitized.origin}</span>
          </div>
        </div>
      </div>

      <div className="mt-auto space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-slate-500">Cryptographic clearance</div>
            <p className="mt-1 text-xs text-slate-600">
              Signing simulation (800ms) then RBAC audit log and queue removal.
            </p>
          </div>
          <Badge variant="outline" className="shrink-0 border-slate-200 bg-slate-50 text-slate-700">
            RBAC
          </Badge>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button
            variant="outline"
            className="h-11 w-full border-rose-300 bg-white text-rose-700 hover:bg-rose-50 hover:text-rose-800"
            disabled={approvingId === selected.id || rejectingId === selected.id}
            onClick={() => onReject(selected.id)}
          >
            {rejectingId === selected.id ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="mr-2 h-4 w-4" />
            )}
            Reject Payload
          </Button>
          <Button
            className="h-11 w-full bg-emerald-600 text-emerald-50 hover:bg-emerald-500 disabled:opacity-70"
            disabled={approvingId === selected.id || rejectingId === selected.id}
            onClick={() => onApprove(selected.id)}
          >
            {approvingId === selected.id ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <BadgeCheck className="mr-2 h-4 w-4" />
            )}
            Cryptographically Sign &amp; Approve
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardDemoPage() {
  const isLg = useIsLargeScreen();
  const [queue, setQueue] = useState<QueueRow[]>(() => createInitialQueue());
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedPayload, setSelectedPayload] = useState<QueueRow | null>(null);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [telemetry, setTelemetry] = useState({ latencyMs: 12, ingestionRps: 27 });

  const totalPages = Math.max(1, Math.ceil(queue.length / PAGE_SIZE));
  const safePage = Math.min(pageIndex, totalPages - 1);
  const pageStart = safePage * PAGE_SIZE;
  const visibleRows = queue.slice(pageStart, pageStart + PAGE_SIZE);

  useEffect(() => {
    if (pageIndex > totalPages - 1) setPageIndex(Math.max(0, totalPages - 1));
  }, [pageIndex, totalPages]);

  useEffect(() => {
    setSelectedPayload((prev) => {
      if (!prev) return null;
      return queue.some((r) => r.id === prev.id) ? prev : null;
    });
  }, [queue]);

  useEffect(() => {
    const tick = () => {
      setTelemetry({
        latencyMs: 12 + Math.floor(Math.random() * 7),
        ingestionRps: 24 + Math.floor(Math.random() * 8),
      });
    };
    tick();
    const id = window.setInterval(tick, 2800);
    return () => window.clearInterval(id);
  }, []);

  const pendingCount = queue.length;

  const finalizeApprove = useCallback((id: string) => {
    toast.success(`RBAC Audit Logged: Payload ${id} cryptographically cleared.`);
    setQueue((prev) => prev.filter((r) => r.id !== id));
    setSelectedPayload(null);
    setMobileSheetOpen(false);
  }, []);

  const finalizeReject = useCallback((id: string) => {
    toast.message(`RBAC Audit Logged: Record ${id} rejected. Payload sealed pending policy review.`, {
      className: 'border border-rose-200 bg-white text-rose-800',
    });
    setQueue((prev) => prev.filter((r) => r.id !== id));
    setSelectedPayload(null);
    setMobileSheetOpen(false);
  }, []);

  const approve = async (id: string) => {
    setApprovingId(id);
    await new Promise((r) => setTimeout(r, 800));
    setApprovingId(null);
    finalizeApprove(id);
  };

  const reject = async (id: string) => {
    setRejectingId(id);
    await new Promise((r) => setTimeout(r, 800));
    setRejectingId(null);
    finalizeReject(id);
  };

  const onRowActivate = (row: QueueRow) => {
    setSelectedPayload(row);
    if (!isLg) setMobileSheetOpen(true);
  };

  const goPrev = () => setPageIndex((p) => Math.max(0, p - 1));
  const goNext = () => setPageIndex((p) => Math.min(totalPages - 1, p + 1));

  const rangeLabel =
    queue.length === 0
      ? '0–0'
      : `${pageStart + 1}–${Math.min(pageStart + PAGE_SIZE, queue.length)}`;

  const panelProps: ReviewPanelProps = {
    selectedPayload,
    approvingId,
    rejectingId,
    onApprove: approve,
    onReject: reject,
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Operational telemetry
              </div>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                Sahel Admin Core: Clearance Engine
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Payload sanitization: <span className="font-semibold text-slate-900">ACTIVE</span>
              <span className="mx-2 text-slate-300">·</span>
              RBAC role: <span className="font-semibold text-slate-900">System Administrator</span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard
              icon={<DatabaseZap className="h-5 w-5" />}
              label="Total Ingested"
              value={TOTAL_INGESTED.toLocaleString()}
              subtle="National-scale intake volume"
            />
            <MetricCard
              icon={<Activity className="h-5 w-5 text-amber-600" />}
              label="Pending Clearance"
              value={
                <motion.span
                  key={pendingCount}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                  className="tabular-nums"
                >
                  {pendingCount.toLocaleString()}
                </motion.span>
              }
              subtle="RBAC verification queue"
            />
            <MetricCard
              icon={<BadgeCheck className="h-5 w-5 text-emerald-600" />}
              label="Edge Sanitization"
              value={
                <span className="text-lg sm:text-2xl">
                  Active <span className="text-emerald-700">(AES-256)</span>
                </span>
              }
              subtle="At-rest encryption + ingress validation"
            />
            <MetricCard
              icon={<Gauge className="h-5 w-5" />}
              label="Query Latency"
              value={
                <motion.span
                  key={telemetry.latencyMs}
                  initial={{ opacity: 0.5 }}
                  animate={{ opacity: 1 }}
                  className="tabular-nums"
                >
                  &lt;{telemetry.latencyMs}ms
                </motion.span>
              }
              subtle="Edge node operator console"
            />
            <MetricCard
              icon={<Activity className="h-5 w-5 text-cyan-600" />}
              label="Ingestion Throughput"
              value={
                <motion.span
                  key={telemetry.ingestionRps}
                  initial={{ opacity: 0.5 }}
                  animate={{ opacity: 1 }}
                  className="tabular-nums"
                >
                  {telemetry.ingestionRps} req/s
                </motion.span>
              }
              subtle="Sustained ingress channel"
            />
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-slate-500">Resolution desk</div>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">Cryptographic ingestion queue</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
              Master-detail binding: select a registrant to open the review panel (split view on large screens, slide-over
              on mobile). PII remains minimized; tenant and document context support RBAC decisions.
            </p>
          </div>
          <div className="lg:hidden">
            <Badge variant="outline" className="border-cyan-200 bg-cyan-50 text-cyan-900">
              Tap a row to open the review panel
            </Badge>
          </div>
          <div className="hidden flex-wrap items-center gap-2 lg:flex">
            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800">
              Verified Hash · SHA-256
            </Badge>
            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-900">
              Pending RBAC verification
            </Badge>
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
          <div className="min-w-0 flex-1 space-y-4">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Record ID
                      </th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Registrant (PII minimized)
                      </th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Tenant
                      </th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Role requested
                      </th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Ingestion
                      </th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Encryption
                      </th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Clearance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {visibleRows.map((r) => {
                      const active = selectedPayload?.id === r.id;
                      return (
                        <tr
                          key={r.id}
                          role="button"
                          tabIndex={0}
                          aria-selected={active}
                          aria-label={`Select payload ${r.id}`}
                          onClick={() => onRowActivate(r)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              onRowActivate(r);
                            }
                          }}
                          className={cn(
                            'cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-cyan-500',
                            active
                              ? 'border-l-4 border-l-cyan-600 bg-cyan-50 ring-1 ring-inset ring-cyan-200/60'
                              : 'border-l-4 border-l-transparent hover:bg-slate-50',
                          )}
                        >
                          <td className="whitespace-nowrap px-4 py-3 font-mono text-cyan-800">{r.id}</td>
                          <td className="px-4 py-3 font-medium text-slate-800">{r.registrantMasked}</td>
                          <td className="max-w-[140px] truncate px-4 py-3 text-slate-700" title={r.tenant}>
                            {r.tenant}
                          </td>
                          <td className="max-w-[120px] truncate px-4 py-3 text-slate-700" title={r.requestedRole}>
                            {r.requestedRole}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-slate-600">{r.ingestedAtLabel}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">
                              <ShieldCheck className="h-3 w-3 shrink-0" />
                              SHA-256
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900">
                              Pending
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {visibleRows.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                          Ingestion queue drained. No pending RBAC verifications.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">Showing {rangeLabel}</span> of{' '}
                  <span className="font-semibold tabular-nums">{queue.length.toLocaleString()}</span> pending ·{' '}
                  <span className="tabular-nums">{TOTAL_INGESTED.toLocaleString()}</span> total ingested
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 border-slate-200"
                    disabled={safePage <= 0}
                    onClick={goPrev}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Previous
                  </Button>
                  <span className="min-w-[100px] text-center text-xs font-medium text-slate-700">
                    Page {safePage + 1} of {totalPages}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 border-slate-200"
                    disabled={safePage >= totalPages - 1}
                    onClick={goNext}
                  >
                    Next
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <aside className="hidden w-full shrink-0 lg:flex lg:max-w-[440px] lg:flex-col">
            <div className="flex h-full min-h-[480px] flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-semibold text-slate-900">Review panel</h3>
                <p className="text-xs text-slate-500">Cryptographic review &amp; RBAC workflow</p>
              </div>
              <ReviewPanelBody {...panelProps} />
            </div>
          </aside>
        </div>
      </main>

      <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
        <SheetContent
          side="right"
          className="flex w-full flex-col border-slate-200 bg-white text-slate-900 sm:max-w-[520px] lg:hidden"
        >
          <SheetHeader>
            <SheetTitle className="text-left text-slate-900">Review panel · RBAC clearance</SheetTitle>
          </SheetHeader>
          <ReviewPanelBody {...panelProps} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
