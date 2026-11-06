# kanban-contactos

Tablero kanban para seguir clínicas por fase. La interfaz está en español y el nombre visible es Tramo. El repositorio previsto se llama **kanban-contactos**. Todavía no hay un sitio público ni un despliegue.

En este entorno `.env.local` ya tiene el client ID, el ID de la hoja y una sola cuenta permitida: `brianjosue1900@gmail.com`. Otra cuenta de Google es rechazada. Si esa variable se borra, nadie entra y vuelven los datos de ejemplo. El token queda en la memoria de la pestaña. No hay clave compartida, no hay Apps Script y no hay secreto de cliente.

## Cómo correrla

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). El tablero está en `/` y las estadísticas en `/estadisticas`.

```bash
npm run build
npm run lint
npx tsx scripts/test-sheets-grid.ts
```

`npm run build` genera un sitio estático en `out/` (`output: 'export'`). Los contactos se piden desde el navegador.

## Google Sheets con la cuenta de Brian

La app llama a la API de Google Sheets con un access token de Google Identity Services. Antes de escribir **Stato** vuelve a leer la fila. Si el correo de la fila ya no coincide, o si **Stato** cambió desde la lectura (por ejemplo n8n), no escribe y pide recargar.

Esito se lee para el badge Rebotado y no se escribe. No se borran filas. «Eliminar» pide confirmación y pone `Stato` en `Descartado`.

El mapa de textos está en `lib/stato-map.ts`.

| Stato en la hoja | Fase |
| --- | --- |
| vacío | Nuevo |
| Contactado, Seguimiento 1 programado | Contactado |
| Seguimiento 1 enviado, Seguimiento 2 programado | Primer recordatorio |
| Seguimiento 2 enviado | Segundo recordatorio |
| Tercer recordatorio | Tercer recordatorio (cierre) |
| Respondió | Respondió |
| Demo agendada | Demo agendada |
| Descartado | outcome descartado, fase Contactado al releer |

Al mover una tarjeta se escribe: vacío, `Contactado`, `Seguimiento 1 enviado`, `Seguimiento 2 enviado`, `Tercer recordatorio`, `Respondió` o `Demo agendada`.

### Límite real del permiso

El alcance es `https://www.googleapis.com/auth/spreadsheets` más `https://www.googleapis.com/auth/userinfo.email`.

Ese alcance de Sheets **no** está limitado a un archivo ni a la columna Stato. Con el token, la cuenta podría leer y editar cualquier hoja de cálculo a la que ya tenga acceso. No existe un scope de OAuth que diga «solo Master2» o «solo la columna AC». `drive.file` sí limita por archivo, pero solo a archivos creados o abiertos con la app mediante el selector de Google; no alcanza, por sí solo, una hoja que ya existe y que n8n también edita.

Lo que sí hace este código: comprueba que el título sea **IntelliVet Outreach**, busca el encabezado `Stato` y envía `values.update` de una sola celda. Si el encabezado no está, no escribe. El correo de la sesión tiene que estar en `NEXT_PUBLIC_ALLOWED_GOOGLE_EMAIL`. El token no se guarda en `localStorage` ni en `sessionStorage`; al cerrar o recargar la pestaña hay que entrar de nuevo. Dura alrededor de una hora.

### Qué debe crear Brian en Google Cloud

No hay una URL pública de esta app. Hasta que exista el repo y Pages, el único origen real es el de desarrollo.

1. Entra a [Google Cloud Console](https://console.cloud.google.com/) con la cuenta que es dueña de la hoja.
2. Crea o elige un proyecto. Anota el nombre.
3. **APIs y servicios → Biblioteca**. Busca **Google Sheets API** y pulsa **Habilitar**. No hace falta Drive API.
4. **APIs y servicios → Pantalla de consentimiento de OAuth**.
   - Tipo de usuario: **Externo**.
   - Nombre de la app: `kanban-contactos`.
   - Correo de asistencia: el de Brian.
   - Alcances: agrega `.../auth/spreadsheets` y `.../auth/userinfo.email`.
   - Usuarios de prueba: agrega el correo exacto de la cuenta que abre la hoja. Mientras la app esté en **Prueba**, solo ese usuario puede aceptar.
   - No pulses **Publicar app**. En prueba no hace falta la verificación de Google, y el token de esta pantalla no es un refresh token guardado.
5. **APIs y servicios → Credenciales → Crear credenciales → ID de cliente de OAuth**.
   - Tipo: **Aplicación web**.
   - Nombre: `kanban-contactos web`.
   - Orígenes autorizados de JavaScript, por ahora solo:
     - `http://localhost:3000`
     - `http://127.0.0.1:3847` si pruebas en ese puerto
   - URI de redirección: déjalos vacíos. Identity Services con token de navegador no usa redirect.
   - No crees un secreto de cliente. Si la consola muestra uno, no lo copies a este repo ni a GitHub.
6. Copia el **ID de cliente** (`….apps.googleusercontent.com`). Es público.
7. Abre la hoja **IntelliVet Outreach**. El ID es el tramo de la URL entre `/d/` y `/edit`.
8. Crea `.env.local` (no lo subas si más adelante el repo es público; `.gitignore` ya ignora `.env*`):

```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=214191835958-mmja3vhe716ubvbure8oacs26favin4j.apps.googleusercontent.com
NEXT_PUBLIC_SPREADSHEET_ID=1-f4wd3NPeZOfSD03CA29b1wMhpMa-Pg8sOnOsbKrMNg
NEXT_PUBLIC_ALLOWED_GOOGLE_EMAIL=brianjosue1900@gmail.com
```

9. Reinicia `npm run dev`. La pantalla dice **Entrar con Google**. Brian elige su cuenta y acepta ver y editar hojas de cálculo, y ver su correo. Si entra otra cuenta, la app revoca el token y no lee la hoja.

### Qué autoriza Brian en el consentimiento

- Ver y editar todas las hojas de cálculo de esa cuenta (`spreadsheets`).
- Ver la dirección de correo de la cuenta (`userinfo.email`), para compararla con la lista permitida.

No autoriza Drive completo, Gmail ni borrar archivos. Aun así, el permiso de Sheets es amplio: la protección de «solo Stato» es del programa, no de Google.

## GitHub Pages

El destino es el repositorio [iboybrian/kanban-contactos](https://github.com/iboybrian/kanban-contactos). El workflow `.github/workflows/deploy.yml` fija `basePath` en `/kanban-contactos` y las tres variables públicas de OAuth. No lleva secreto de cliente.

El origen que Brian debe agregar en Google Cloud, sin path, es `https://iboybrian.github.io`. La ruta del sitio, solo si Pages queda activo y responde, sería `https://iboybrian.github.io/kanban-contactos/`.

## Efectos

Al soltar una tarjeta en otra fase suena una ficha y la tarjeta rebota. Si cae en **Respondió** o **Demo agendada**, hay lluvia de monedas y un jackpot. Marcar descartado suena un golpe corto. En estadísticas los números giran como un tragamonedas al cargar.

Los sonidos se sintetizan con la Web Audio API. El botón **Sonido** / **Silencio** guarda la preferencia en `localStorage` (`tramo-muted`). Eso es solo el mute, no el token de Google. Con `prefers-reduced-motion: reduce` no hay rebote, brillo animado, confeti ni giro.

## Uso del tablero

- Arrastrar una tarjeta escribe `Stato`, después de releer la fila.
- En el celular, un toque abre el correo. Para arrastrar, mantén la tarjeta un instante.
- El ícono de basura pide confirmación y marca `Descartado`. No elimina la fila.
- Descartados y rebotados se ven por defecto. **Ocultar descartados/rebotados** es solo de la pantalla.
- El panel muestra asunto y fechas. El cuerpo no está en la hoja: **Cuerpo no disponible**.
- Las estadísticas de formato, con la hoja real, quedan en **Sin formato**. También hay gráficas por fase y por asunto.
