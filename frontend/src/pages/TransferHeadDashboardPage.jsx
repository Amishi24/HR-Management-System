import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import api from "../api/axios";
import {
  RefreshCw,
  Play,
  X,
  Shield,
  TrendingUp,
  Users,
  Clock,
  FileText,
  Search,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Zap,
  MapPin,
  Hash,
  ChevronRight,
  Loader2,
  ChevronDown,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function scoreBadge(score) {
  if (score >= 0.7) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (score >= 0.4) return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-rose-50 text-rose-700 border-rose-200";
}

function statusBadge(status) {
  const map = {
    APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    PROPOSED: "bg-blue-50 text-blue-700 border-blue-200",
    APPEALED: "bg-amber-50 text-amber-700 border-amber-200",
  };
  return map[status] || "bg-slate-50 text-slate-600 border-slate-200";
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function CycleSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-slate-100" />
        ))}
      </div>
      <div className="h-52 rounded-2xl bg-slate-100" />
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 mb-4">
        <RotateCcw size={28} className="text-slate-400" />
      </div>
      <h3 className="text-base font-bold text-slate-700 mb-1">
        No Cycles Found
      </h3>
      <p className="text-sm text-slate-500 max-w-sm">{message}</p>
    </div>
  );
}

function Toast({ toast, onDismiss }) {
  if (!toast) return null;
  const isError = toast.type === "error";
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border px-5 py-3.5 shadow-xl transition-all duration-300 ${isError ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}
    >
      {isError ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
      <span className="text-sm font-semibold">{toast.message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="ml-2 rounded p-1 hover:bg-black/5 cursor-pointer"
      >
        <X size={14} />
      </button>
    </div>
  );
}

// ─── Discipline Selector ──────────────────────────────────────────────────────
function DisciplineSelector({ disciplines, selectedId, onSelect, loading }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selected = disciplines.find((d) => d.discipline_id === selectedId);

  const filtered = disciplines.filter((d) =>
    d.discipline_name.toLowerCase().includes(search.toLowerCase()),
  );

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        disabled={loading}
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-blue-300 hover:shadow focus:outline-none disabled:opacity-50 cursor-pointer"
      >
        <span className="flex items-center gap-2">
          <Users
            size={16}
            className={selected ? "text-blue-500" : "text-slate-400"}
          />
          {selected ? (
            <span>
              {selected.discipline_name}
              <span className="ml-2 text-xs font-normal text-slate-400">
                {selected.count} approved employee
                {selected.count !== 1 ? "s" : ""}
              </span>
            </span>
          ) : (
            <span className="text-slate-400 font-normal">
              Select a discipline…
            </span>
          )}
        </span>
        <ChevronDown
          size={16}
          className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                autoFocus
                type="text"
                placeholder="Search discipline…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg bg-slate-50 py-2 pl-8 pr-3 text-sm text-slate-700 outline-none placeholder-slate-400"
              />
            </div>
          </div>
          <ul className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-slate-400 text-center">
                No results
              </li>
            ) : (
              filtered.map((d) => (
                <li key={d.discipline_id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(d.discipline_id);
                      setOpen(false);
                      setSearch("");
                    }}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors hover:bg-blue-50 cursor-pointer ${selectedId === d.discipline_id ? "bg-blue-50" : ""}`}
                  >
                    <div>
                      <p className="font-semibold text-slate-800">
                        {d.discipline_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {d.count} approved employee
                        {d.count !== 1 ? "s" : ""}
                      </p>
                    </div>
                    {selectedId === d.discipline_id && (
                      <CheckCircle2
                        size={16}
                        className="ml-auto text-blue-500 shrink-0"
                      />
                    )}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═════════════════════════════════════════════════════════════════════════════
export default function TransferHeadDashboardPage() {
  const [activeTab, setActiveTab] = useState("cycle");

  // Approved employee list (used to derive unique disciplines)
  const [approvedEmps, setApprovedEmps] = useState([]);
  const [empsLoading, setEmpsLoading] = useState(false);

  // Cycle state
  const [selectedDisciplineId, setSelectedDisciplineId] = useState(null);
  const [cycles, setCycles] = useState([]);
  const [activeCycle, setActiveCycle] = useState(null); // cycle shown in confirm dialog
  const [exemptIds, setExemptIds] = useState([]);
  const [exemptNames, setExemptNames] = useState({});
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [cycleError, setCycleError] = useState(null);

  // Overview state
  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [toast, setToast] = useState(null);
  const dialogRef = useRef(null);

  // Derive unique disciplines from approved employees
  const uniqueDisciplines = useMemo(() => {
    const map = new Map();
    approvedEmps.forEach((emp) => {
      if (!map.has(emp.discipline_id)) {
        map.set(emp.discipline_id, {
          discipline_id: emp.discipline_id,
          discipline_name:
            emp.discipline_name ?? `Discipline #${emp.discipline_id}`,
          count: 0,
        });
      }
      map.get(emp.discipline_id).count += 1;
    });
    return [...map.values()];
  }, [approvedEmps]);

  const selectedDiscipline = uniqueDisciplines.find(
    (d) => d.discipline_id === selectedDisciplineId,
  );

  // Auto-dismiss toasts
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  // ── Fetch approved employees ──────────────────────────────────────────
  useEffect(() => {
    setEmpsLoading(true);
    api
      .get("/transfer-head/approved-employees")
      .then(({ data }) => setApprovedEmps(data))
      .catch(() => setApprovedEmps([]))
      .finally(() => setEmpsLoading(false));
  }, []);

  // ── Generate cycles ───────────────────────────────────────────────────
  const generateCycles = useCallback(
    async (ids = exemptIds, discId = selectedDisciplineId) => {
      if (!discId) return;
      setLoading(true);
      setCycleError(null);
      try {
        const { data } = await api.post("/transfer-head/cycle/generate", {
          discipline_id: discId,
          exempt_employee_ids: ids,
        });
        setCycles(data);
      } catch (err) {
        setCycles([]);
        setCycleError(
          err.response?.data?.detail ||
            "No valid transfer cycles found for this discipline.",
        );
      } finally {
        setLoading(false);
      }
    },
    [exemptIds, selectedDisciplineId],
  );

  // ── Discipline selection ──────────────────────────────────────────────
  const handleSelectDiscipline = (discId) => {
    setSelectedDisciplineId(discId);
    setExemptIds([]);
    setExemptNames({});
    setCycles([]);
    setActiveCycle(null);
    generateCycles([], discId);
  };

  // ── Exempt / un-exempt ────────────────────────────────────────────────
  const handleExempt = (empId, empName) => {
    const next = [...exemptIds, empId];
    setExemptIds(next);
    setExemptNames((prev) => ({ ...prev, [empId]: empName }));
    generateCycles(next, selectedDisciplineId);
  };

  const handleUnexempt = (empId) => {
    const next = exemptIds.filter((id) => id !== empId);
    setExemptIds(next);
    setExemptNames((prev) => {
      const copy = { ...prev };
      delete copy[empId];
      return copy;
    });
    generateCycles(next, selectedDisciplineId);
  };

  // ── Execute ───────────────────────────────────────────────────────────
  const handleExecute = async () => {
    if (!activeCycle) return;
    setExecuting(true);
    try {
      await api.post("/transfer-head/cycle/execute", {
        steps: activeCycle.steps,
      });
      setToast({
        type: "success",
        message: `Cycle executed — ${activeCycle.steps.length} transfers completed.`,
      });
      // Remove the executed cycle from the list
      setCycles((prev) =>
        prev.filter((c) => c.cycle_id !== activeCycle.cycle_id),
      );
      setActiveCycle(null);
      dialogRef.current?.close();
      // Refresh approved list
      api
        .get("/transfer-head/approved-employees")
        .then(({ data }) => setApprovedEmps(data));
    } catch (err) {
      setToast({
        type: "error",
        message:
          err.response?.data?.detail || "Execution failed. Please retry.",
      });
      dialogRef.current?.close();
    } finally {
      setExecuting(false);
    }
  };

  // ── Overview ──────────────────────────────────────────────────────────
  const fetchOverview = useCallback(async () => {
    setOverviewLoading(true);
    try {
      const { data } = await api.get("/transfer-head/requests/overview");
      setOverview(data);
    } catch {
      setOverview(null);
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "overview" && !overview) fetchOverview();
  }, [activeTab, overview, fetchOverview]);

  const filteredRequests = (overview?.requests || []).filter((r) => {
    const matchName = r.employee_name
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "ALL" || r.status === statusFilter;
    return matchName && matchStatus;
  });

  // ─────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">
          Transfer Head Workspace
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Select a discipline, inspect all optimal non-overlapping transfer
          cycles, exempt participants, and execute atomically.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 w-fit">
        {[
          { key: "cycle", label: "Cycle Inspector", icon: RotateCcw },
          { key: "overview", label: "Requests Overview", icon: FileText },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-200 cursor-pointer ${activeTab === key ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TAB: Cycle Inspector                                          */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === "cycle" && (
        <div className="space-y-5">
          {/* ── Step 1: Discipline selector ──────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-100 border border-slate-100 p-6 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50">
                <Users size={15} className="text-blue-500" />
              </div>
              <h2 className="text-sm font-bold text-slate-700">
                Choose a discipline
              </h2>
              <span className="ml-auto text-xs text-slate-400">
                {uniqueDisciplines.length} discipline
                {uniqueDisciplines.length !== 1 ? "s" : ""} with approved
                employees
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Select a discipline from the approved transfer list. The engine
              will find all optimal non-overlapping transfer cycles for it.
            </p>

            <DisciplineSelector
              disciplines={uniqueDisciplines}
              selectedId={selectedDisciplineId}
              onSelect={handleSelectDiscipline}
              loading={empsLoading}
            />

            {selectedDiscipline && (
              <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-2.5 flex items-center gap-3 text-xs">
                <Zap size={13} className="text-blue-400 shrink-0" />
                <span className="text-blue-700">
                  Finding optimal cycles for{" "}
                  <strong>{selectedDiscipline.discipline_name}</strong> (
                  {selectedDiscipline.count} approved employee
                  {selectedDiscipline.count !== 1 ? "s" : ""})
                </span>
              </div>
            )}
          </div>

          {/* ── Step 2: Cycle results ────────────────────────────────── */}
          {selectedDisciplineId && (
            <div className="space-y-4">
              {/* Section header + Regenerate */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50">
                    <RotateCcw size={15} className="text-violet-500" />
                  </div>
                  <h2 className="text-sm font-bold text-slate-700">
                    Optimal Cycles
                    {!loading && cycles.length > 0 && (
                      <span className="ml-2 text-xs font-normal text-slate-400">
                        {cycles.length} cycle{cycles.length !== 1 ? "s" : ""}{" "}
                        found
                      </span>
                    )}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    generateCycles(exemptIds, selectedDisciplineId)
                  }
                  disabled={loading}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-50 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw
                    size={15}
                    className={loading ? "animate-spin" : ""}
                  />
                  Regenerate
                </button>
              </div>

              {/* Exempt pills */}
              {exemptIds.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Exempted from cycles:
                  </span>
                  {exemptIds.map((eid) => (
                    <span
                      key={eid}
                      className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-700"
                    >
                      {exemptNames[eid] || `#${eid}`}
                      <span className="text-[10px] text-rose-400">
                        (stays approved)
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUnexempt(eid)}
                        className="rounded-full p-0.5 hover:bg-rose-200/60 cursor-pointer"
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Loading / Error / Cycle cards */}
              {loading ? (
                <CycleSkeleton />
              ) : cycleError ? (
                <div className="bg-white rounded-2xl shadow-xl shadow-slate-100 border border-slate-100 p-6">
                  <EmptyState message={cycleError} />
                </div>
              ) : cycles.length > 0 ? (
                <div className="space-y-4">
                  {cycles.map((cycle, cycleIdx) => (
                    <div
                      key={cycle.cycle_id}
                      className="bg-white rounded-2xl shadow-xl shadow-slate-100 border border-slate-100 p-6 space-y-5"
                    >
                      {/* Cycle header */}
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-100">
                          <span className="text-xs font-extrabold text-violet-600">
                            {cycleIdx + 1}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-700">
                          Cycle {cycleIdx + 1}
                          <span className="ml-1 text-xs font-normal text-slate-400">
                            of {cycles.length}
                          </span>
                        </h3>
                      </div>

                      {/* Metric cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                            <Hash size={16} className="text-blue-600" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Cycle Length
                            </p>
                            <p className="text-lg font-extrabold text-slate-800">
                              {cycle.cycle_length}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100">
                            <TrendingUp
                              size={16}
                              className="text-emerald-600"
                            />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Avg Match Score
                            </p>
                            <p className="text-lg font-extrabold text-slate-800">
                              {(cycle.overall_score * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Flow visualizer */}
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <RotateCcw size={12} />
                          Transfer Flow (hover for exempt button)
                        </p>
                        <div className="flex flex-nowrap gap-2 overflow-x-auto pb-2 snap-x">
                          {cycle.steps.map((step, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 snap-start"
                            >
                              <div className="min-w-[240px] rounded-xl border border-slate-200 bg-white hover:border-blue-200 p-4 shadow-sm transition-all duration-200 hover:shadow-md group relative">
                                {/* Exempt button */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleExempt(
                                      step.from_employee_id,
                                      step.from_employee_name,
                                    )
                                  }
                                  className="absolute top-2 right-2 rounded-lg p-1.5 text-slate-300 opacity-0 group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-500 transition-all duration-150 cursor-pointer"
                                  title="Exempt from cycles"
                                >
                                  <Shield size={13} />
                                </button>

                                <p className="text-sm font-bold text-slate-800 pr-7 truncate">
                                  {step.from_employee_name}
                                </p>

                                <div className="flex items-center gap-1 mt-1.5 text-xs text-slate-500">
                                  <MapPin size={11} />
                                  <span>{step.from_location}</span>
                                  <ArrowRight
                                    size={11}
                                    className="text-blue-400 mx-0.5"
                                  />
                                  <span className="text-blue-600 font-medium">
                                    {step.to_location}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 mt-2.5">
                                  <span
                                    className={`text-xs font-bold px-2 py-0.5 rounded-md border ${scoreBadge(step.match_score)}`}
                                  >
                                    {(step.match_score * 100).toFixed(0)}% match
                                  </span>
                                </div>
                              </div>

                              {idx < cycle.steps.length - 1 ? (
                                <ChevronRight
                                  size={18}
                                  className="text-slate-300 shrink-0"
                                />
                              ) : (
                                <div className="flex flex-col items-center gap-0.5 shrink-0 text-blue-400 px-1">
                                  <RotateCcw size={14} />
                                  <span className="text-[9px] font-bold uppercase tracking-widest">
                                    loop
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Execute this cycle */}
                      <div className="flex justify-end pt-1 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveCycle(cycle);
                            dialogRef.current?.showModal();
                          }}
                          className="flex items-center gap-2 rounded-xl bg-[#3b82f6] px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-200 transition-all hover:bg-[#2563eb] hover:shadow-md cursor-pointer"
                        >
                          <Play size={15} />
                          Execute Cycle
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          )}

          {/* Placeholder when no discipline selected yet */}
          {!selectedDisciplineId && (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-20 text-center">
              <Users size={36} className="text-slate-300 mb-4" />
              <p className="text-sm font-semibold text-slate-500">
                Select a discipline above
              </p>
              <p className="text-xs text-slate-400 mt-1">
                The engine will find all optimal transfer cycles for that
                discipline
              </p>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TAB: Requests Overview                                        */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === "overview" && (
        <div className="space-y-5">
          {overviewLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-24 rounded-2xl bg-slate-100" />
                ))}
              </div>
              <div className="h-64 rounded-2xl bg-slate-100" />
            </div>
          ) : overview ? (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  {
                    label: "Total Pending",
                    value: overview.summary.total,
                    icon: FileText,
                    bg: "bg-slate-100",
                    iconCls: "text-slate-600",
                  },
                  {
                    label: "Proposed",
                    value: overview.summary.proposed,
                    icon: Clock,
                    bg: "bg-blue-50",
                    iconCls: "text-blue-600",
                  },
                  {
                    label: "Approved",
                    value: overview.summary.approved,
                    icon: CheckCircle2,
                    bg: "bg-emerald-50",
                    iconCls: "text-emerald-600",
                  },
                  {
                    label: "Appealed",
                    value: overview.summary.appealed,
                    icon: AlertTriangle,
                    bg: "bg-amber-50",
                    iconCls: "text-amber-600",
                  },
                ].map(({ label, value, icon: Icon, bg, iconCls }) => (
                  <div
                    key={label}
                    className="bg-white rounded-2xl shadow-xl shadow-slate-100 border border-slate-100 p-5 flex items-center gap-4"
                  >
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${bg}`}
                    >
                      <Icon size={20} className={iconCls} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        {label}
                      </p>
                      <p className="text-xl font-extrabold text-slate-800">
                        {value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Search by employee name…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50 transition-all"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 outline-none focus:border-blue-300 cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PROPOSED">Proposed</option>
                  <option value="APPROVED">Approved</option>
                  <option value="APPEALED">Appealed</option>
                </select>
              </div>

              {/* Table */}
              <div className="bg-white rounded-2xl shadow-xl shadow-slate-100 border border-slate-100 overflow-hidden">
                {filteredRequests.length === 0 ? (
                  <p className="py-14 text-center text-sm text-slate-400">
                    No matching requests found.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/60">
                          {[
                            "Employee",
                            "ID",
                            "Discipline",
                            "Status",
                            "Location",
                            "Preferred Cities",
                            "Created",
                          ].map((h) => (
                            <th
                              key={h}
                              className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredRequests.map((r) => (
                          <tr
                            key={r.request_id}
                            className="transition-colors hover:bg-slate-50/50"
                          >
                            <td className="px-5 py-3.5 font-semibold text-slate-800 whitespace-nowrap">
                              {r.employee_name}
                            </td>
                            <td className="px-5 py-3.5 text-slate-500 font-mono text-xs">
                              {r.employee_id}
                            </td>
                            <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">
                              {r.discipline_name || "—"}
                            </td>
                            <td className="px-5 py-3.5">
                              <span
                                className={`text-xs font-bold px-2.5 py-1 rounded-md border ${statusBadge(r.status)}`}
                              >
                                {r.status}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">
                              {r.current_location}
                            </td>
                            <td className="px-5 py-3.5 text-slate-600">
                              {r.preferred_cities?.join(", ") || "—"}
                            </td>
                            <td className="px-5 py-3.5 text-slate-400 text-xs whitespace-nowrap">
                              {r.created_at
                                ? new Date(r.created_at).toLocaleDateString()
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            <p className="py-16 text-center text-sm text-slate-400">
              Failed to load overview data.
            </p>
          )}
        </div>
      )}

      {/* ── Execution confirmation dialog ──────────────────────────────── */}
      <dialog
        ref={dialogRef}
        className="rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-sm max-w-md w-full"
      >
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
              <AlertTriangle size={20} className="text-amber-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Confirm Cycle Execution
              </h3>
              <p className="text-xs text-slate-400">
                {activeCycle?.cycle_length}-employee transfer loop
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-slate-50 border border-slate-100 px-4 py-3 space-y-1.5">
            {activeCycle?.steps?.map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-slate-700 w-5 text-right">
                  {i + 1}.
                </span>
                <span className="font-semibold text-slate-800 flex-1">
                  {s.from_employee_name}
                </span>
                <ArrowRight size={11} className="text-slate-400 shrink-0" />
                <span className="text-blue-600 font-medium">
                  {s.to_location}
                </span>
              </div>
            ))}
          </div>

          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-2.5">
            <p className="text-xs font-semibold text-amber-700">
              ⚠ This is irreversible — positions, tenure records and request
              statuses will all be updated.
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExecute}
              disabled={executing}
              className="flex items-center gap-2 rounded-xl bg-[#3b82f6] px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-200 transition-all hover:bg-[#2563eb] cursor-pointer disabled:opacity-60"
            >
              {executing ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <CheckCircle2 size={15} />
              )}
              {executing ? "Executing…" : "Confirm & Execute"}
            </button>
          </div>
        </div>
      </dialog>

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}