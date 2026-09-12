/**
 * Capa de Google Sheets.
 *
 * Crea hojas de cálculo para calendarios, métricas y datos tabulares.
 */

import { google, type sheets_v4 } from "googleapis";

function sheets(accessToken: string): sheets_v4.Sheets {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.sheets({ version: "v4", auth });
}

function driveClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.drive({ version: "v3", auth });
}

/**
 * Crea una Google Sheet dentro de una carpeta.
 */
export async function createSheet(
  accessToken: string,
  title: string,
  folderId: string,
): Promise<{ sheetId: string; sheetUrl: string }> {
  const client = sheets(accessToken);

  const created = await client.spreadsheets.create({
    requestBody: {
      properties: { title },
      sheets: [{ properties: { title: "Datos" } }],
    },
  });

  const sheetId = created.data.spreadsheetId!;

  // Mover a la carpeta del workspace
  const drive = driveClient(accessToken);
  await drive.files.update({
    fileId: sheetId,
    addParents: folderId,
    fields: "id",
  });

  return {
    sheetId,
    sheetUrl: `https://docs.google.com/spreadsheets/d/${sheetId}/edit`,
  };
}

/**
 * Escribe datos en una hoja. `values` es un array de arrays (filas).
 */
export async function writeData(
  accessToken: string,
  sheetId: string,
  values: string[][],
  sheetName: string = "Datos",
): Promise<void> {
  if (values.length === 0) return;
  const client = sheets(accessToken);

  await client.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `${sheetName}!A1`,
    valueInputOption: "RAW",
    requestBody: { values },
  });

  await client.spreadsheets.batchUpdate({
    spreadsheetId: sheetId,
    requestBody: {
      requests: [
        {
          repeatCell: {
            range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1 },
            cell: { userEnteredFormat: { textFormat: { bold: true } } },
            fields: "userEnteredFormat.textFormat.bold",
          },
        },
      ],
    },
  });
}
