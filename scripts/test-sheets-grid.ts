import fs from "node:fs";
import { DISCARD_STATO, interpretStato, statoForPhase } from "../lib/stato-map";
import {
  assertRowStillMatches,
  columnToA1,
  contactsFromGrid,
  findSheetColumns,
  statoCellRange,
} from "../lib/sheets-grid";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const headers = [
  "Esito",
  "First Name",
  "Company Name",
  "Stato",
  "Last Name",
  "Email",
  "Oggetto email",
  "Data contatto",
  "Data follow-up",
  "State",
  "Company State",
];

function row(partial: Record<string, string>) {
  const line = headers.map(() => "");
  for (const [name, value] of Object.entries(partial)) line[headers.indexOf(name)] = value;
  return line;
}

const grid = [
  headers,
  row({
    Esito: "",
    "First Name": "Valentina",
    "Last Name": "Mora",
    "Company Name": "Clínica Cordillera",
    Email: "valentina.mora@cordillera.cl",
    Stato: "Seguimiento 1 programado",
    "Oggetto email": "Horas que se caen",
    "Data contatto": "12/10/2026",
    "Data follow-up": "04/11/2026",
    State: "RM",
  }),
  row({
    Esito: "rebotado",
    "First Name": "Diego",
    "Last Name": "Fuentes",
    Email: "diego.fuentes@institutodeldolor.cl",
    Stato: "",
    "Oggetto email": "Último intento",
  }),
  row({}),
  row({
    Esito: "rebotado",
    "First Name": "Paula",
    "Last Name": "Riquelme",
    Email: "paula.riquelme@plazadental.cl",
    Stato: "Descartado",
  }),
];

const columns = findSheetColumns(headers);
assert(columns.stato === 3, "Stato se ubica por encabezado, no por la columna AC");
assert(columns.esito === 0, "Esito no se confunde con State");
assert(columnToA1(columns.stato) === "D", "la letra sale del índice del encabezado");
assert(statoCellRange(2, columns.stato) === "'Master2'!D2", "la escritura es una sola celda");

const built = contactsFromGrid(grid);
assert(built.error === null, "la grilla con Stato es válida");
assert(built.contacts.length === 3, "omite la fila vacía");
assert(built.contacts[0]?.id === "2", "el id es el número de fila");
assert(built.contacts[0]?.phase === "contactado", "Seguimiento 1 programado es contactado");
assert(built.contacts[0]?.sheetStato === "Seguimiento 1 programado", "guarda el Stato leído");
assert(built.contacts[1]?.phase === "nuevo" && built.contacts[1]?.outcome === "rebotado", "Esito rebotado se lee");
assert(built.contacts[2]?.id === "5" && built.contacts[2]?.outcome === "descartado", "Descartado no borra la fila");
assert(built.contacts[2]?.phase === "contactado", "sin fase previa, Descartado cae en contactado");

const same = assertRowStillMatches({
  expectedEmail: "valentina.mora@cordillera.cl",
  expectedName: "Valentina Mora",
  expectedStato: "Seguimiento 1 programado",
  row: grid[1] ?? [],
  columns,
});
assert(same.ok, "la fila intacta se puede actualizar");

const conflict = assertRowStillMatches({
  expectedEmail: "valentina.mora@cordillera.cl",
  expectedName: "Valentina Mora",
  expectedStato: "Seguimiento 1 programado",
  row: row({ ...{ Email: "valentina.mora@cordillera.cl", "First Name": "Valentina", "Last Name": "Mora", Stato: "Respondió" } }),
  columns,
});
assert(!conflict.ok && conflict.message.includes("No escribí nada"), "si n8n cambió Stato no se escribe");

const wrongPerson = assertRowStillMatches({
  expectedEmail: "valentina.mora@cordillera.cl",
  expectedName: "Valentina Mora",
  expectedStato: "Seguimiento 1 programado",
  row: row({ Email: "otra@ejemplo.cl", "First Name": "Otra", Stato: "Seguimiento 1 programado" }),
  columns,
});
assert(!wrongPerson.ok && wrongPerson.message.includes("ya no es"), "rechaza si la fila cambió de persona");

const missing = contactsFromGrid([["First Name", "Email"], ["Ana", "ana@ejemplo.cl"]]);
assert(missing.error?.includes("Stato") && missing.contacts.length === 0, "sin encabezado Stato no hay datos que escribir");
assert(statoForPhase("primer_recordatorio") === "Seguimiento 1 enviado", "mover escribe el valor enviado");
assert(statoForPhase("nuevo") === "", "Nuevo limpia Stato");
assert(interpretStato("Seguimiento 2 programado", "").phase === "primer_recordatorio", "programado 2 es primer recordatorio");
assert(DISCARD_STATO === "Descartado", "el descarte es un texto de Stato");

const sessionSource = fs.readFileSync(new URL("../lib/google-session.ts", import.meta.url), "utf8");
assert(!/localStorage|sessionStorage/.test(sessionSource), "el token no se persiste");
const apiSource = fs.readFileSync(new URL("../lib/api.ts", import.meta.url), "utf8");
assert(!apiSource.includes("API_KEY") && !apiSource.includes("script.google.com"), "ya no hay clave ni Apps Script");
assert(apiSource.includes("values: [[stato]]"), "el cuerpo de escritura es una sola celda");

console.log("sheets-grid: pruebas ok");
