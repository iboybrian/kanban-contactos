"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SlotNumber } from "@/components/slot-number";
import { getContacts, getEmailFormats, getStats } from "@/lib/api";
import { countByPhase, countBySubject, mergeFormatStats } from "@/lib/stats";
import type { Contact, EmailsByFormat } from "@/lib/types";

const FORMAT_COLORS = ["#1d4ed8", "#b45309", "#6d28d9", "#047857", "#78716c", "#be123c", "#0f766e"];

function colorFor(row: EmailsByFormat, index: number) {
  if (row.format_id === null) return "#78716c";
  return FORMAT_COLORS[index % FORMAT_COLORS.length];
}

type Load =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; formats: EmailsByFormat[]; phases: ReturnType<typeof countByPhase>; contacts: Contact[] };

export function StatsDashboard() {
  const [load, setLoad] = useState<Load>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getEmailFormats(), getStats(), getContacts()])
      .then(([formats, stats, contacts]) => {
        if (cancelled) return;
        setLoad({
          status: "ready",
          formats: mergeFormatStats(formats, stats),
          phases: countByPhase(contacts),
          contacts,
        });
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setLoad({
          status: "error",
          message: reason instanceof Error ? reason.message : "No se pudieron cargar las estadísticas.",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return (
    <div className="px-4 pt-5 pb-10">
      <h1 className="font-display text-3xl tracking-tight text-ink sm:text-4xl">Estadísticas</h1>
      <p className="mt-1 max-w-2xl text-sm text-stone-600 sm:text-base">
        Correos enviados por formato y cuántos contactos hay en cada fase.
      </p>

      {load.status === "loading" ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2" aria-hidden>
          <div className="h-80 animate-pulse rounded-2xl bg-stone-200/80" />
          <div className="h-80 animate-pulse rounded-2xl bg-stone-200/80" />
        </div>
      ) : null}

      {load.status === "error" ? (
        <div className="mt-6">
          <p className="font-semibold text-ink">No se pudieron cargar las estadísticas.</p>
          <p className="mt-1 text-sm text-stone-600">{load.message}</p>
          <button
            type="button"
            className="mt-4 rounded-lg bg-pine px-4 py-2 text-sm font-semibold text-paper"
            onClick={() => {
              setLoad({ status: "loading" });
              setReloadKey((value) => value + 1);
            }}
          >
            Reintentar
          </button>
        </div>
      ) : null}

      {load.status === "ready" ? <StatsBody formats={load.formats} phases={load.phases} contacts={load.contacts} /> : null}
    </div>
  );
}

function StatsBody({
  formats,
  phases,
  contacts,
}: {
  formats: EmailsByFormat[];
  phases: ReturnType<typeof countByPhase>;
  contacts: Contact[];
}) {
  const sent = formats.reduce((sum, row) => sum + row.sent_count, 0);
  const discarded = contacts.filter((contact) => contact.outcome === "descartado").length;
  const bounced = contacts.filter((contact) => contact.outcome === "rebotado").length;
  const pieRows = formats.filter((row) => row.sent_count > 0);
  const subjects = countBySubject(contacts);
  const unlabeled = formats.find((row) => row.format_id === null)?.sent_count ?? 0;

  return (
    <>
      <dl className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Summary label="Correos enviados" value={sent} delay={0} />
        <Summary label="Contactos" value={contacts.length} delay={80} />
        <Summary label="Descartados" value={discarded} delay={160} />
        <Summary label="Rebotados" value={bounced} delay={240} />
      </dl>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <ChartCard
          title="Correos enviados por formato"
          caption={`Cada barra cuenta contactos con fecha de envío. ${unlabeled} quedaron en Sin formato.`}
        >
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formats} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                <CartesianGrid stroke="#e7e0d4" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fill: "#44403c", fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="format_name"
                  width={128}
                  tick={{ fill: "#292524", fontSize: 12 }}
                  interval={0}
                />
                <Tooltip content={<CountTooltip unit="enviados" />} />
                <Bar dataKey="sent_count" radius={[0, 6, 6, 0]} name="Enviados">
                  {formats.map((row, index) => (
                    <Cell key={row.format_id ?? "sin-formato"} fill={colorFor(row, index)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <CountList rows={formats.map((row) => ({ key: row.format_id ?? "sin-formato", label: row.format_name, value: row.sent_count }))} />
        </ChartCard>

        <ChartCard title="Proporción por formato" caption="Solo entran los formatos que tienen al menos un envío.">
          {pieRows.length === 0 ? (
            <p className="py-16 text-center text-sm text-stone-500">Todavía no hay correos enviados.</p>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieRows}
                    dataKey="sent_count"
                    nameKey="format_name"
                    innerRadius={58}
                    outerRadius={92}
                    paddingAngle={2}
                    stroke="#fffdf8"
                  >
                    {pieRows.map((row) => (
                      <Cell key={row.format_id ?? "sin-formato"} fill={colorFor(row, formats.indexOf(row))} />
                    ))}
                  </Pie>
                  <Tooltip content={<CountTooltip unit="enviados" />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </div>

      <div className="mt-4">
        <ChartCard
          title="Contactos por fase"
          caption="Incluye descartados y rebotados. Siguen en la fase donde quedaron."
        >
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={phases} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                <CartesianGrid stroke="#e7e0d4" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fill: "#44403c", fontSize: 12 }} />
                <YAxis type="category" dataKey="label" width={168} tick={{ fill: "#292524", fontSize: 12 }} interval={0} />
                <Tooltip content={<CountTooltip unit="contactos" />} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} name="Contactos">
                  {phases.map((row) => (
                    <Cell key={row.phase} fill={row.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <CountList rows={phases.map((row) => ({ key: row.phase, label: row.label, value: row.count }))} />
        </ChartCard>
      </div>

      <div className="mt-4">
        <ChartCard title="Contactos por asunto" caption="Cada barra agrupa el texto de Oggetto email. Si está vacío, entra en Sin asunto.">
          <div style={{ height: Math.max(280, subjects.length * 36) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjects} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                <CartesianGrid stroke="#e7e0d4" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fill: "#44403c", fontSize: 12 }} />
                <YAxis type="category" dataKey="label" width={168} tick={{ fill: "#292524", fontSize: 12 }} interval={0} />
                <Tooltip content={<CountTooltip unit="contactos" />} />
                <Bar dataKey="count" fill="#b45309" radius={[0, 6, 6, 0]} name="Contactos" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <CountList rows={subjects.map((row) => ({ key: row.label, label: row.label, value: row.count }))} />
        </ChartCard>
      </div>
    </>
  );
}

function Summary({ label, value, delay }: { label: string; value: number; delay: number }) {
  return (
    <div className="rounded-2xl border border-amber-200/80 bg-card px-4 py-3 shadow-sm">
      <dt className="text-xs font-semibold tracking-wide text-stone-500 uppercase">{label}</dt>
      <dd className="font-display mt-1 text-3xl leading-none text-ink">
        <SlotNumber value={value} delay={delay} />
      </dd>
    </div>
  );
}

function ChartCard({ title, caption, children }: { title: string; caption: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-black/5 bg-card p-4 shadow-sm">
      <h2 className="font-display text-2xl text-ink">{title}</h2>
      <p className="mt-1 mb-3 text-sm text-stone-600">{caption}</p>
      {children}
    </section>
  );
}

function CountList({ rows }: { rows: { key: string; label: string; value: number }[] }) {
  return (
    <ul className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
      {rows.map((row) => (
        <li key={row.key} className="flex items-center justify-between gap-3 border-t border-stone-100 py-1">
          <span className="text-stone-700">{row.label}</span>
          <span className="font-semibold text-ink">
            <SlotNumber value={row.value} delay={320} />
          </span>
        </li>
      ))}
    </ul>
  );
}

function CountTooltip({
  active,
  payload,
  unit,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: { format_name?: string; label?: string; sent_count?: number; count?: number } }>;
  unit: string;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  const name = row.format_name ?? row.label ?? "";
  const value = row.sent_count ?? row.count ?? 0;
  return (
    <div className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm shadow-md">
      <p className="font-semibold text-ink">{name}</p>
      <p className="text-stone-600">
        {value} {unit}
      </p>
    </div>
  );
}
