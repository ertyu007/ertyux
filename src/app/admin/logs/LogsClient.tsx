"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Shield,
  AlertTriangle,
  Activity,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Clock,
  Globe,
  ChevronDown,
} from "lucide-react";
import type { AuditLog } from "./page";

/* ── Helpers ── */
const PER_PAGE = 25;

const SEVERITY_COLORS: Record<string, { bg: string; fg: string; border: string }> = {
  INFO:     { bg: "rgba(0,234,255,0.08)", fg: "#00eaff", border: "rgba(0,234,255,0.25)" },
  WARN:     { bg: "rgba(245,158,11,0.08)", fg: "#f59e0b", border: "rgba(245,158,11,0.25)" },
  CRITICAL: { bg: "rgba(213,63,140,0.08)", fg: "#d53f8c", border: "rgba(213,63,140,0.25)" },
  ERROR:   { bg: "rgba(239,68,68,0.08)", fg: "#ef4444", border: "rgba(239,68,68,0.25)" },
};

function formatDate(iso?: string) {
  if (!iso) return "N/A";
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
  } catch {
    return iso;
  }
}

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toCsv(logs: AuditLog[]): string {
  const headers = ["id", "created_at", "severity", "event_type", "ip_address", "method", "path", "user_agent", "details"];
  const rows = logs.map((l) =>
    headers.map((h) => {
      const val = l?.[h as keyof AuditLog];
      const str = typeof val === "object" ? JSON.stringify(val ?? {}) : String(val ?? "");
      return `"${str.replace(/"/g, '""')}"`;
    }).join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

/* ── Component ── */
export default function LogsClient({ initialLogs = [] }: { initialLogs: AuditLog[] }) {
  const safeLogs = useMemo(() => Array.isArray(initialLogs) ? initialLogs : [], [initialLogs]);

  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [eventFilter, setEventFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  /* Derive event types safely */
  const eventTypes = useMemo(
    () => Array.from(new Set(safeLogs.map((l) => l?.event_type || "UNKNOWN"))).sort(),
    [safeLogs]
  );

  /* Filter safely */
  const filtered = useMemo(() => {
    let result = safeLogs;
    if (severityFilter !== "ALL") result = result.filter((l) => (l?.severity || "INFO") === severityFilter);
    if (eventFilter !== "ALL") result = result.filter((l) => (l?.event_type || "UNKNOWN") === eventFilter);
    if (dateFrom) result = result.filter((l) => (l?.created_at || "") >= dateFrom);
    if (dateTo) result = result.filter((l) => (l?.created_at || "") <= `${dateTo}T23:59:59`);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((l) => {
        const eventType = (l?.event_type || "").toLowerCase();
        const ip = (l?.ip_address || "").toLowerCase();
        const path = (l?.path || "").toLowerCase();
        const detailsStr = JSON.stringify(l?.details || {}).toLowerCase();
        return eventType.includes(q) || ip.includes(q) || path.includes(q) || detailsStr.includes(q);
      });
    }
    return result;
  }, [safeLogs, severityFilter, eventFilter, dateFrom, dateTo, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  /* Stats */
  const totalCount = filtered.length;
  const criticalCount = filtered.filter((l) => l?.severity === "CRITICAL" || l?.severity === "ERROR").length;
  const uniqueIps = new Set(filtered.map((l) => l?.ip_address || "unknown")).size;

  /* Export */
  const exportCsv = () => downloadFile(toCsv(filtered), `audit_logs_${new Date().toISOString().split("T")[0]}.csv`, "text/csv");
  const exportJson = () => downloadFile(JSON.stringify(filtered, null, 2), `audit_logs_${new Date().toISOString().split("T")[0]}.json`, "application/json");

  return (
    <main className="logs-shell">
      <div className="logs-ambient logs-ambient--one" />
      <div className="logs-ambient logs-ambient--two" />

      <div className="logs-container">
        {/* Header */}
        <header className="logs-header">
          <div>
            <Link href="/admin" className="logs-back">
              <ArrowLeft size={16} /> Back to Projects
            </Link>
            <div className="section-tag">Security Logs</div>
            <h1>Audit Dashboard</h1>
            <p>Monitor, filter, and export security events in real-time.</p>
          </div>
          <div className="logs-header__actions">
            <button type="button" className="btn-outline" onClick={exportCsv}>
              <Download size={15} /> CSV
            </button>
            <button type="button" className="btn-outline" onClick={exportJson}>
              <Download size={15} /> JSON
            </button>
          </div>
        </header>

        {/* Stats */}
        <section className="logs-stats">
          <article>
            <Activity size={20} style={{ color: "var(--cyan)" }} />
            <div>
              <span>Total Events</span>
              <strong>{totalCount}</strong>
            </div>
          </article>
          <article>
            <AlertTriangle size={20} style={{ color: "#d53f8c" }} />
            <div>
              <span>Critical / Error</span>
              <strong style={{ color: criticalCount > 0 ? "#d53f8c" : undefined }}>{criticalCount}</strong>
            </div>
          </article>
          <article>
            <Globe size={20} style={{ color: "var(--purple)" }} />
            <div>
              <span>Unique IPs</span>
              <strong>{uniqueIps}</strong>
            </div>
          </article>
        </section>

        {/* Filters */}
        <section className="logs-filters">
          <div className="logs-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search logs..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            />
          </div>

          <div className="logs-filter-group">
            <select value={severityFilter} onChange={(e) => { setSeverityFilter(e.target.value); setPage(0); }}>
              <option value="ALL">All Severities</option>
              <option value="INFO">INFO</option>
              <option value="WARN">WARN</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="ERROR">ERROR</option>
            </select>

            <select value={eventFilter} onChange={(e) => { setEventFilter(e.target.value); setPage(0); }}>
              <option value="ALL">All Events</option>
              {eventTypes.map((et) => (
                <option key={et} value={et}>{et}</option>
              ))}
            </select>

            <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(0); }} title="From date" />
            <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(0); }} title="To date" />
          </div>
        </section>

        {/* Table */}
        <section className="logs-table-wrap">
          <table className="logs-table">
            <thead>
              <tr>
                <th><Clock size={13} /> Timestamp</th>
                <th><Shield size={13} /> Severity</th>
                <th>Event</th>
                <th><Globe size={13} /> IP</th>
                <th>Method</th>
                <th>Path</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {paged.map((log, rowIndex) => {
                  const severityKey = log?.severity || "INFO";
                  const sev = SEVERITY_COLORS[severityKey] || SEVERITY_COLORS.INFO;
                  const isExpanded = expandedId === log.id;

                  return (
                    <motion.tr
                      key={log.id || `row-${rowIndex}`}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="logs-row"
                      onClick={() => setExpandedId(isExpanded ? null : log.id)}
                      style={{ cursor: "pointer" }}
                    >
                      <td className="logs-td-time">{formatDate(log?.created_at)}</td>
                      <td>
                        <span className="logs-badge" style={{ background: sev.bg, color: sev.fg, border: `1px solid ${sev.border}` }}>
                          {severityKey}
                        </span>
                      </td>
                      <td className="logs-td-event">{log?.event_type || "UNKNOWN"}</td>
                      <td className="logs-td-ip">{log?.ip_address || "unknown"}</td>
                      <td><span className="logs-method">{log?.method || "GET"}</span></td>
                      <td className="logs-td-path">{log?.path || "/"}</td>
                      <td>
                        <ChevronDown
                          size={14}
                          style={{
                            transition: "transform 0.2s",
                            transform: isExpanded ? "rotate(180deg)" : "none",
                            color: "var(--fg-dim)",
                          }}
                        />
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>

          {/* Expanded detail panels */}
          {paged.map((log) => {
            if (expandedId !== log.id) return null;
            return (
              <motion.div
                key={`detail-${log.id}`}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="logs-detail"
              >
                <div className="logs-detail-grid">
                  <div><strong>User Agent</strong><p>{log?.user_agent || "unknown"}</p></div>
                  <div><strong>Full Path</strong><p>{log?.method || "GET"} {log?.path || "/"}</p></div>
                </div>
                <div>
                  <strong>Details</strong>
                  <pre>{JSON.stringify(log?.details || {}, null, 2)}</pre>
                </div>
              </motion.div>
            );
          })}

          {filtered.length === 0 && (
            <div className="logs-empty">
              <Shield size={28} />
              <p>No logs match your filters.</p>
            </div>
          )}
        </section>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="logs-pagination">
            <button disabled={page === 0} onClick={() => setPage(page - 1)}>
              <ChevronLeft size={16} /> Prev
            </button>
            <span>Page {page + 1} of {totalPages}</span>
            <button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .logs-shell {
          position: relative;
          min-height: 100vh;
          padding: clamp(6rem, 9vw, 8rem) 0 5rem;
          overflow: hidden;
          background: var(--bg);
        }
        .logs-ambient {
          position: fixed;
          width: 520px; height: 520px;
          border-radius: 50%;
          filter: blur(130px);
          opacity: 0.14;
          pointer-events: none;
        }
        .logs-ambient--one { top: -180px; right: -150px; background: var(--cyan); }
        .logs-ambient--two { bottom: -220px; left: -180px; background: var(--purple); }

        .logs-container {
          position: relative; z-index: 1;
          width: min(1280px, calc(100% - 2rem));
          margin: 0 auto;
        }

        .logs-back {
          display: inline-flex; align-items: center; gap: 0.4rem;
          color: var(--fg-dim); font-size: 0.82rem; font-weight: 600;
          text-decoration: none; margin-bottom: 1rem;
          transition: color 0.2s;
        }
        .logs-back:hover { color: var(--cyan); }

        .logs-header {
          display: flex; align-items: flex-end; justify-content: space-between;
          gap: 2rem; margin-bottom: 2rem; flex-wrap: wrap;
        }
        .logs-header h1 {
          margin: 0; font-size: clamp(2rem, 5vw, 3.5rem); letter-spacing: -0.05em;
        }
        .logs-header p { max-width: 500px; margin-top: 0.5rem; }
        .logs-header__actions { display: flex; gap: 0.6rem; flex-shrink: 0; }
        .logs-header__actions button { padding: 0.65rem 1rem; font-size: 0.8rem; }

        .logs-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 1rem; margin-bottom: 1.5rem;
        }
        .logs-stats article {
          display: flex; align-items: center; gap: 1rem;
          padding: 1.2rem 1.4rem;
          border: 1px solid var(--glass-border);
          border-radius: 18px;
          background: var(--glass-bg);
          backdrop-filter: blur(18px);
        }
        .logs-stats span { color: var(--fg-dim); font-size: 0.78rem; display: block; }
        .logs-stats strong { font-size: 1.5rem; color: var(--fg); display: block; margin-top: 0.15rem; }

        .logs-filters {
          display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap;
        }
        .logs-search {
          flex: 1; min-width: 200px;
          display: flex; align-items: center; gap: 0.6rem;
          padding: 0 1rem; height: 42px;
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          background: var(--glass-bg);
          backdrop-filter: blur(8px);
        }
        .logs-search input {
          flex: 1; border: none; background: transparent; outline: none;
          color: var(--fg); font-size: 0.85rem;
        }
        .logs-search svg { color: var(--fg-dim); flex-shrink: 0; }

        .logs-filter-group {
          display: flex; gap: 0.6rem; flex-wrap: wrap;
        }
        .logs-filter-group select,
        .logs-filter-group input[type="date"] {
          height: 42px; padding: 0 0.8rem;
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          background: var(--bg-2);
          color: var(--fg);
          font-size: 0.8rem;
          outline: none;
        }
        .logs-filter-group select:focus,
        .logs-filter-group input[type="date"]:focus {
          border-color: var(--cyan);
          box-shadow: 0 0 12px var(--cyan-glow);
        }

        .logs-table-wrap {
          border: 1px solid var(--glass-border);
          border-radius: 18px;
          background: var(--glass-bg);
          backdrop-filter: blur(18px);
          overflow-x: auto;
        }
        .logs-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.82rem;
        }
        .logs-table thead {
          position: sticky; top: 0; z-index: 2;
          background: var(--bg-2);
        }
        .logs-table th {
          padding: 0.9rem 1rem;
          text-align: left;
          font-weight: 700;
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--fg-dim);
          border-bottom: 1px solid var(--glass-border);
          white-space: nowrap;
        }
        .logs-table th svg { vertical-align: -2px; margin-right: 4px; }

        .logs-row td {
          padding: 0.75rem 1rem;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          vertical-align: middle;
        }
        .logs-row:hover td { background: rgba(0,234,255,0.03); }

        .logs-td-time { white-space: nowrap; color: var(--fg-dim); font-size: 0.78rem; }
        .logs-td-event { font-weight: 600; font-size: 0.78rem; }
        .logs-td-ip { font-family: monospace; font-size: 0.78rem; color: var(--fg-dim); }
        .logs-td-path {
          max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          font-size: 0.78rem; color: var(--fg-dim);
        }

        .logs-badge {
          display: inline-block;
          padding: 0.2rem 0.55rem;
          border-radius: 8px;
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.5px;
        }
        .logs-method {
          display: inline-block; padding: 0.15rem 0.4rem;
          border-radius: 6px;
          background: rgba(123,97,255,0.1);
          color: var(--purple);
          font-size: 0.7rem; font-weight: 700;
        }

        .logs-detail {
          padding: 1rem 1.5rem;
          border-bottom: 1px solid var(--glass-border);
          background: rgba(0,234,255,0.02);
        }
        .logs-detail-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;
          margin-bottom: 0.75rem;
        }
        .logs-detail strong {
          font-size: 0.72rem; text-transform: uppercase;
          letter-spacing: 1px; color: var(--fg-dim); display: block; margin-bottom: 0.3rem;
        }
        .logs-detail p { margin: 0; font-size: 0.82rem; word-break: break-all; }
        .logs-detail pre {
          margin: 0.3rem 0 0;
          padding: 0.8rem; border-radius: 10px;
          background: var(--bg-2);
          font-size: 0.75rem; color: var(--cyan);
          overflow-x: auto; max-height: 200px;
        }

        .logs-empty {
          padding: 3rem 2rem;
          text-align: center; color: var(--fg-dim);
          display: flex; flex-direction: column; align-items: center; gap: 0.6rem;
        }

        .logs-pagination {
          display: flex; align-items: center; justify-content: center;
          gap: 1rem; margin-top: 1.5rem;
        }
        .logs-pagination button {
          display: inline-flex; align-items: center; gap: 0.3rem;
          padding: 0.55rem 1rem;
          border: 1px solid var(--glass-border);
          border-radius: 10px;
          background: var(--glass-bg);
          color: var(--fg);
          font-size: 0.8rem; font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .logs-pagination button:hover:not(:disabled) {
          border-color: var(--cyan);
          box-shadow: 0 0 12px var(--cyan-glow);
        }
        .logs-pagination button:disabled {
          opacity: 0.35; cursor: not-allowed;
        }
        .logs-pagination span {
          color: var(--fg-dim); font-size: 0.82rem;
        }

        @media (max-width: 768px) {
          .logs-stats { grid-template-columns: 1fr; }
          .logs-header { flex-direction: column; align-items: flex-start; }
          .logs-detail-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </main>
  );
}
