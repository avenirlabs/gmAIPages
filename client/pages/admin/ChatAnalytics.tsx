import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type DailyRow = {
  day: string;
  sessions: number;
  messages: number;
  products_returned: number;
  avg_latency_ms: number | null;
  unique_users: number;
  countries: number;
};
type TopImpRow = { product_id: string; impressions: number; avg_position: number; avg_score: number };
type GeoRow = { country: string; city: string; messages: number };
type QualRow = { day: string; avg_latency_ms: number | null; avg_reply_chars: number | null };
type DepthRow = { conversation_id: number; messages_in_session: number; started_at: string; last_msg_at: string };
type ChipRow = { day: string; chip: string; uses: number };
type FilterRow = { day: string; filter: string; uses: number };
type TopPageRow = { page_slug: string; sessions: number };

export default function ChatAnalytics() {
  const [start, setStart] = useState(() => new Date(Date.now() - 29 * 864e5).toISOString().slice(0,10));
  const [end, setEnd] = useState(() => new Date().toISOString().slice(0,10));

  const [daily, setDaily] = useState<DailyRow[]>([]);
  const [quality, setQuality] = useState<QualRow[]>([]);
  const [geo, setGeo] = useState<GeoRow[]>([]);
  const [topProducts, setTopProducts] = useState<TopImpRow[]>([]);
  const [depth, setDepth] = useState<DepthRow[]>([]);
  const [chips, setChips] = useState<ChipRow[]>([]);
  const [filters, setFilters] = useState<FilterRow[]>([]);
  const [topPages, setTopPages] = useState<TopPageRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const totals = useMemo(() => {
    const s = daily.reduce((a, r) => a + (r.sessions || 0), 0);
    const m = daily.reduce((a, r) => a + (r.messages || 0), 0);
    const pr = daily.reduce((a, r) => a + (r.products_returned || 0), 0);
    const latVals = daily.map(d => d.avg_latency_ms || 0).filter(Boolean);
    const lat = latVals.length ? Math.round(latVals.reduce((a,b)=>a+b,0)/latVals.length) : 0;
    return { sessions: s, messages: m, products_returned: pr, avg_latency_ms: lat };
  }, [daily]);

  const load = async () => {
    setLoading(true); setErr(null);
    try {
      // Get auth token from Supabase session
      const { supabase } = await import("@/lib/supabaseClient");
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Authentication required");
      }

      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`
      };

      const r1 = await fetch(`/api/admin/analytics/kpis`, {
        method: "POST",
        headers,
        body: JSON.stringify({ p_start: start, p_end: end }),
      });
      const d1 = (await r1.json()) as DailyRow[];

      const r2 = await fetch(`/api/admin/analytics/quality`, { headers });
      const d2 = (await r2.json()) as QualRow[];

      const r3 = await fetch(`/api/admin/analytics/geo`, { headers });
      const d3 = (await r3.json()) as GeoRow[];

      const r4 = await fetch(`/api/admin/analytics/products/top`, { headers });
      const d4 = (await r4.json()) as TopImpRow[];

      const r5 = await fetch(`/api/admin/analytics/sessions/depth`, { headers });
      const d5 = (await r5.json()) as DepthRow[];

      const r6 = await fetch(`/api/admin/analytics/chips`, { headers });
      const d6 = (await r6.json()) as ChipRow[];

      const r7 = await fetch(`/api/admin/analytics/filters`, { headers });
      const d7 = (await r7.json()) as FilterRow[];

      const r8 = await fetch(`/api/admin/analytics/pages/top`, { headers });
      const d8 = (await r8.json()) as TopPageRow[];

      setDaily(Array.isArray(d1) ? d1 : []);
      setQuality(Array.isArray(d2) ? d2 : []);
      setGeo(Array.isArray(d3) ? d3 : []);
      setTopProducts(Array.isArray(d4) ? d4 : []);
      setDepth(Array.isArray(d5) ? d5 : []);
      setChips(Array.isArray(d6) ? d6 : []);
      setFilters(Array.isArray(d7) ? d7 : []);
      setTopPages(Array.isArray(d8) ? d8 : []);
    } catch (e: any) {
      setErr(e?.message || "Load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <h1 className="text-2xl font-bold">Chat Analytics</h1>
        <div className="ml-auto flex items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600">Start</label>
            <input type="date" value={start} onChange={(e)=>setStart(e.target.value)} className="rounded-lg border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600">End</label>
            <input type="date" value={end} onChange={(e)=>setEnd(e.target.value)} className="rounded-lg border px-3 py-2 text-sm" />
          </div>
          <Button onClick={load} disabled={loading} className="rounded-full px-6">{loading ? "Loading…" : "Refresh"}</Button>
          {err ? <span className="text-sm text-red-600">{err}</span> : null}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Sessions" value={totals.sessions} />
        <Kpi label="Messages" value={totals.messages} />
        <Kpi label="Products Returned" value={totals.products_returned} />
        <Kpi label="Avg Latency (ms)" value={totals.avg_latency_ms} />
      </div>

      {/* Charts */}
      {daily.length > 0 && (
        <Section title="Sessions Trend">
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={daily.slice().reverse()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="day"
                  stroke="#64748b"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                <Tooltip
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="sessions"
                  stroke="#155ca5"
                  strokeWidth={2}
                  dot={{ fill: '#155ca5', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#155ca5', strokeWidth: 2, fill: 'white' }}
                />
                <Line
                  type="monotone"
                  dataKey="messages"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  dot={{ fill: '#0ea5e9', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#0ea5e9', strokeWidth: 2, fill: 'white' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Section>
      )}

      {quality.length > 0 && (
        <Section title="Assistant Performance">
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={quality.slice().reverse()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="day"
                  stroke="#64748b"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                <Tooltip
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="avg_latency_ms"
                  stroke="#dc2626"
                  strokeWidth={2}
                  dot={{ fill: '#dc2626', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#dc2626', strokeWidth: 2, fill: 'white' }}
                  name="Avg Latency (ms)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Section>
      )}

      <Section title="Daily KPIs">
        <Table
          columns={["Day","Sessions","Messages","Products Returned","Avg Latency (ms)","Unique Users","Countries"]}
          rows={daily.map(d => [d.day, d.sessions, d.messages, d.products_returned, d.avg_latency_ms ? Math.round(d.avg_latency_ms) : "—", d.unique_users, d.countries])}
        />
      </Section>

      <Section title="Assistant Quality">
        <Table
          columns={["Day","Avg Latency (ms)","Avg Reply Chars"]}
          rows={quality.map(q => [q.day, q.avg_latency_ms ? Math.round(q.avg_latency_ms) : "—", q.avg_reply_chars ? Math.round(q.avg_reply_chars) : "—"])}
        />
      </Section>

      <Section title="Top Products (Impressions)">
        <Table
          columns={["Product ID","Impressions","Avg Position","Avg Score"]}
          rows={topProducts.map(p => [p.product_id, p.impressions, p.avg_position, p.avg_score])}
        />
      </Section>

      <Section title="Geography">
        <Table
          columns={["Country","City","Messages"]}
          rows={geo.map(g => [g.country, g.city, g.messages])}
        />
      </Section>

      <Section title="Session Depth">
        <Table
          columns={["Conversation ID","Messages in Session","Started","Last Message"]}
          rows={depth.map(s => [s.conversation_id, s.messages_in_session, s.started_at, s.last_msg_at])}
        />
      </Section>

      <Section title="Chip Usage (recent)">
        <Table
          columns={["Day","Chip","Uses"]}
          rows={chips.slice(0,50).map(c => [c.day, c.chip, c.uses])}
        />
      </Section>

      <Section title="Filter Usage (recent)">
        <Table
          columns={["Day","Filter","Uses"]}
          rows={filters.slice(0,50).map(f => [f.day, f.filter, f.uses])}
        />
      </Section>

      <Section title="Top Pages (30d)">
        <Table
          columns={["Page","Sessions"]}
          rows={topPages.map(p => [p.page_slug, p.sessions])}
        />
      </Section>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold">{Intl.NumberFormat().format(value || 0)}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: any }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Table({ columns, rows }: { columns: string[]; rows: any[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b bg-slate-50 text-slate-600">
          <tr>{columns.map((c) => (<th key={c} className="px-3 py-2 font-medium">{c}</th>))}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b last:border-b-0">
              {r.map((cell, j) => (<td key={j} className="px-3 py-2">{cell}</td>))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}