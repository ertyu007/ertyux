"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown, ChevronLeft, ChevronRight, FileDown, Search } from "lucide-react";
import type { AuditLog } from "./page";

const PER_PAGE = 25;

function formatDate(value?: string) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function download(content: string, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

export default function LogsClient({ initialLogs }: { initialLogs: AuditLog[] }) {
  const logs = useMemo(
    () => (Array.isArray(initialLogs) ? initialLogs : []),
    [initialLogs]
  );
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState("ALL");
  const [event, setEvent] = useState("ALL");
  const [page, setPage] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);

  const events = useMemo(
    () => Array.from(new Set(logs.map((log) => log.event_type || "UNKNOWN"))).sort(),
    [logs]
  );

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    return logs.filter((log) => {
      if (severity !== "ALL" && log.severity !== severity) return false;
      if (event !== "ALL" && (log.event_type || "UNKNOWN") !== event) return false;
      if (!text) return true;
      return [log.event_type, log.ip_address, log.path, JSON.stringify(log.details)]
        .join(" ").toLowerCase().includes(text);
    });
  }, [event, logs, query, severity]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const rows = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  const setFilter = (setter: (value: string) => void, value: string) => {
    setter(value);
    setPage(0);
    setOpenId(null);
  };

  const exportCsv = () => {
    const header = "id,created_at,severity,event_type,ip_address,method,path,details";
    const body = filtered.map((log) =>
      [log.id, log.created_at, log.severity, log.event_type, log.ip_address, log.method, log.path, JSON.stringify(log.details)]
        .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")
    );
    download([header, ...body].join("\n"), "audit-logs.csv", "text/csv");
  };

  return (
    <main className="simple-logs">
      <div className="simple-logs__header">
        <div>
          <Link href="/admin" className="simple-logs__back"><ArrowLeft size={15} /> Back to admin</Link>
          <h1>Security logs</h1>
          <p>{filtered.length} events found</p>
        </div>
        <button type="button" className="simple-logs__button" onClick={exportCsv}>
          <FileDown size={16} strokeWidth={2.2} /> Export CSV
        </button>
      </div>

      <div className="simple-logs__filters">
        <label className="simple-logs__search">
          <Search size={15} />
          <input value={query} placeholder="Search event, IP, path..." onChange={(e) => setFilter(setQuery, e.target.value)} />
        </label>
        <select value={severity} onChange={(e) => setFilter(setSeverity, e.target.value)}>
          <option value="ALL">All severities</option>
          <option value="INFO">Info</option>
          <option value="WARN">Warn</option>
          <option value="ERROR">Error</option>
          <option value="CRITICAL">Critical</option>
        </select>
        <select value={event} onChange={(e) => setFilter(setEvent, e.target.value)}>
          <option value="ALL">All events</option>
          {events.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>

      <div className="simple-logs__table-wrap">
        {rows.length === 0 ? (
          <div className="simple-logs__empty">No logs found.</div>
        ) : (
          <table className="simple-logs__table">
            <thead><tr><th>Time</th><th>Severity</th><th>Event</th><th>IP</th><th>Method</th><th>Path</th><th /></tr></thead>
            <tbody>
              {rows.map((log) => {
                const open = openId === log.id;
                return (
                  <Fragment key={log.id}>
                  <tr className={open ? "is-open" : ""}>
                    <td>{formatDate(log.created_at)}</td>
                    <td><span className={`simple-logs__severity simple-logs__severity--${(log.severity || "INFO").toLowerCase()}`}>{log.severity || "INFO"}</span></td>
                    <td className="strong">{log.event_type || "UNKNOWN"}</td>
                    <td>{log.ip_address || "—"}</td>
                    <td><span className="simple-logs__method">{log.method || "GET"}</span></td>
                    <td className="path">{log.path || "/"}</td>
                    <td><button className="simple-logs__expand" aria-label="Show details" onClick={() => setOpenId(open ? null : log.id)}><ChevronDown size={15} className={open ? "rotated" : ""} /></button></td>
                  </tr>
                  {open && <tr className="simple-logs__details-row"><td colSpan={7} className="simple-logs__details"><strong>User agent</strong><p>{log.user_agent || "—"}</p><strong>Details</strong><pre>{JSON.stringify(log.details || {}, null, 2)}</pre></td></tr>}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="simple-logs__pagination">
        <button disabled={page === 0} onClick={() => setPage(page - 1)}><ChevronLeft size={15} /> Previous</button>
        <span>{page + 1} / {totalPages}</span>
        <button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Next <ChevronRight size={15} /></button>
      </div>

      <style jsx>{`
        .simple-logs { min-height: 100vh; padding: 6rem 1.25rem 3rem; background: var(--bg); color: var(--fg); }
        .simple-logs__header, .simple-logs__filters, .simple-logs__pagination { width: min(1200px, 100%); margin: 0 auto; }
        .simple-logs__header { display:flex; justify-content:space-between; align-items:flex-end; gap:1rem; margin-bottom:1.5rem; }
        .simple-logs__back { display:inline-flex; gap:.4rem; align-items:center; color:var(--fg-dim); font-size:.82rem; margin-bottom:.7rem; }
        h1 { margin:0; font-size:clamp(2rem, 5vw, 3rem); } p { color:var(--fg-dim); margin:.35rem 0 0; }
        .simple-logs__button, .simple-logs__pagination button { display:inline-flex; align-items:center; gap:.4rem; border:1px solid var(--glass-border); border-radius:8px; background:var(--bg-2); color:var(--fg); padding:.65rem .9rem; cursor:pointer; }
        .simple-logs__filters { display:flex; gap:.6rem; margin-bottom:1rem; flex-wrap:wrap; }
        .simple-logs__search { display:flex; align-items:center; gap:.5rem; flex:1; min-width:220px; border:1px solid var(--glass-border); border-radius:8px; padding:0 .75rem; background:var(--bg-2); }
        input, select { height:40px; border:1px solid var(--glass-border); border-radius:8px; background:var(--bg-2); color:var(--fg); padding:0 .7rem; outline:none; } .simple-logs__search input { flex:1; border:0; padding:0; }
        .simple-logs__table-wrap { width:min(1200px,100%); margin:auto; overflow:auto; border:1px solid var(--glass-border); border-radius:10px; background:var(--bg-2); }
        .simple-logs__table { width:100%; min-width:820px; border-collapse:collapse; font-size:.82rem; } th { text-align:left; color:var(--fg-dim); font-size:.7rem; text-transform:uppercase; letter-spacing:.08em; padding:.8rem; border-bottom:1px solid var(--glass-border); } td { padding:.75rem .8rem; border-bottom:1px solid var(--glass-border); white-space:nowrap; } tr.is-open > td { background:var(--cyan-subtle); } .strong { font-weight:700; } .path { max-width:250px; overflow:hidden; text-overflow:ellipsis; } .simple-logs__severity, .simple-logs__method { display:inline-block; border-radius:5px; padding:.2rem .45rem; font-size:.68rem; font-weight:700; } .simple-logs__severity--info { color:#0891b2; background:rgba(8,145,178,.12); } .simple-logs__severity--warn { color:#d97706; background:rgba(217,119,6,.12); } .simple-logs__severity--error, .simple-logs__severity--critical { color:#dc2626; background:rgba(220,38,38,.12); } .simple-logs__method { color:var(--purple); background:var(--purple-subtle); } .simple-logs__expand { border:0; background:none; color:var(--fg-dim); cursor:pointer; } .rotated { transform:rotate(180deg); } .simple-logs__details { white-space:normal; padding:1rem; } .simple-logs__details p { margin:.35rem 0 .8rem; word-break:break-word; } pre { margin:.35rem 0 0; padding:.75rem; overflow:auto; background:var(--bg); border-radius:6px; color:var(--cyan); font-size:.75rem; } .simple-logs__empty { padding:3rem; text-align:center; color:var(--fg-dim); } .simple-logs__pagination { display:flex; justify-content:center; align-items:center; gap:1rem; margin-top:1rem; } .simple-logs__pagination button:disabled { opacity:.4; cursor:not-allowed; }
        @media (max-width:600px) { .simple-logs { padding:5rem .75rem 2rem; } .simple-logs__header { align-items:flex-start; flex-direction:column; } .simple-logs__button { width:100%; justify-content:center; } .simple-logs__filters > * { width:100%; } .simple-logs__search { min-width:0; } }
      `}</style>
    </main>
  );
}
