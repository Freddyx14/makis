/**
 * Capa de Google Drive.
 *
 * Maneja carpetas de trabajo y subida de archivos. Usa el `provider_token`
 * que Supabase Auth devuelve al hacer login con Google — NO necesita OAuth
 * propio ni refresco de tokens: Supabase lo gestiona todo.
 *
 * REGLA: todas las funciones reciben `accessToken` como primer argumento.
 * Nunca lo guardes en base de datos: vence en 1 hora.
 */

import { google, type drive_v3 } from "googleapis";

function drive(accessToken: string): drive_v3.Drive {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.drive({ version: "v3", auth });
}

/**
 * Crea una carpeta para el workspace dentro de "Makis OS" en Drive del usuario.
 * Si "Makis OS" no existe, la crea primero.
 */
export async function ensureWorkspaceFolder(
  accessToken: string,
  workspaceName: string,
): Promise<{ folderId: string; folderUrl: string }> {
  const client = drive(accessToken);

  const rootQuery = "name='Makis OS' and mimeType='application/vnd.google-apps.folder' and trashed=false";
  const rootRes = await client.files.list({ q: rootQuery, fields: "files(id)" });
  let rootId = rootRes.data.files?.[0]?.id;

  if (!rootId) {
    const created = await client.files.create({
      requestBody: {
        name: "Makis OS",
        mimeType: "application/vnd.google-apps.folder",
      },
      fields: "id",
    });
    rootId = created.data.id!;
  }

  const wsQuery = `name='${workspaceName}' and mimeType='application/vnd.google-apps.folder' and '${rootId}' in parents and trashed=false`;
  const wsRes = await client.files.list({ q: wsQuery, fields: "files(id)" });
  let wsId = wsRes.data.files?.[0]?.id;

  if (!wsId) {
    const created = await client.files.create({
      requestBody: {
        name: workspaceName,
        mimeType: "application/vnd.google-apps.folder",
        parents: [rootId],
      },
      fields: "id",
    });
    wsId = created.data.id!;
  }

  return {
    folderId: wsId!,
    folderUrl: `https://drive.google.com/drive/folders/${wsId}`,
  };
}

/**
 * Lista archivos dentro de una carpeta.
 */
export async function listFiles(
  accessToken: string,
  folderId: string,
): Promise<Array<{ id: string; name: string; url: string; mimeType: string }>> {
  const client = drive(accessToken);
  const res = await client.files.list({
    q: `'${folderId}' in parents and trashed=false`,
    fields: "files(id,name,mimeType,webViewLink)",
    orderBy: "name",
  });

  return (res.data.files ?? []).map((f) => ({
    id: f.id!,
    name: f.name!,
    url: f.webViewLink ?? "",
    mimeType: f.mimeType ?? "",
  }));
}
