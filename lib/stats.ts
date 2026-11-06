import { columnsFor } from "@/lib/phases";
import {
  SIN_FORMATO_LABEL,
  type Contact,
  type EmailFormat,
  type EmailsByFormat,
} from "@/lib/types";

export function mergeFormatStats(
  formats: EmailFormat[],
  stats: EmailsByFormat[],
): EmailsByFormat[] {
  const byId = new Map(stats.map((row) => [row.format_id, row]));
  const rows: EmailsByFormat[] = formats.map((format) => {
    const found = byId.get(format.id);
    return {
      format_id: format.id,
      format_name: found?.format_name || format.name,
      sent_count: found?.sent_count ?? 0,
    };
  });

  const unlabeled = stats.find((row) => row.format_id === null);
  rows.push({
    format_id: null,
    format_name: unlabeled?.format_name || SIN_FORMATO_LABEL,
    sent_count: unlabeled?.sent_count ?? 0,
  });

  for (const row of stats) {
    if (row.format_id && !formats.some((format) => format.id === row.format_id)) {
      rows.splice(rows.length - 1, 0, row);
    }
  }

  return rows;
}

export function countBySubject(contacts: Contact[]) {
  const counts = new Map<string, number>();
  for (const contact of contacts) {
    const label = contact.subject?.trim() || "Sin asunto";
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label, "es"));
}

export function countByPhase(contacts: Contact[]) {
  return columnsFor(contacts.map((contact) => contact.phase)).map((phase) => ({
    phase: phase.id,
    label: phase.label,
    color: phase.color,
    count: contacts.filter((contact) => contact.phase === phase.id).length,
  }));
}
