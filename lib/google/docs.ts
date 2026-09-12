/**
 * Capa de Google Docs.
 *
 * Crea documentos y escribe contenido estructurado. Cada artefacto del
 * workspace se vuelca en un Doc con formato legible.
 */

import { google, type docs_v1 } from "googleapis";

function docs(accessToken: string): docs_v1.Docs {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.docs({ version: "v1", auth });
}

function driveClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.drive({ version: "v3", auth });
}

/**
 * Crea un Google Doc vacío dentro de una carpeta.
 */
export async function createDoc(
  accessToken: string,
  title: string,
  folderId: string,
): Promise<{ docId: string; docUrl: string }> {
  const client = docs(accessToken);

  const created = await client.documents.create({
    requestBody: { title },
  });

  const docId = created.data.documentId!;

  // Mover a la carpeta del workspace
  const drive = driveClient(accessToken);
  await drive.files.update({
    fileId: docId,
    addParents: folderId,
    fields: "id",
  });

  return {
    docId,
    docUrl: `https://docs.google.com/document/d/${docId}/edit`,
  };
}

/**
 * Inserta texto al final de un documento existente.
 */
export async function appendText(
  accessToken: string,
  docId: string,
  lines: string[],
): Promise<void> {
  if (lines.length === 0) return;
  const client = docs(accessToken);

  const doc = await client.documents.get({ documentId: docId });
  const body = doc.data.body;
  const endIndex = body?.content?.at(-1)?.endIndex ?? 1;

  const requests: docs_v1.Schema$Request[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isHeading = /^#{1,3}\s/.test(line);
    const text = line.replace(/^#{1,3}\s/, "");
    const offset = endIndex + (i * (text.length + 1));

    requests.push({
      insertText: {
        location: { index: offset },
        text: text + "\n",
      },
    });

    if (isHeading) {
      const level = line.match(/^(#{1,3})/)?.[1].length ?? 1;
      const textStyle = level === 1 ? "HEADING_1" : level === 2 ? "HEADING_2" : "HEADING_3";
      requests.push({
        updateParagraphStyle: {
          range: { startIndex: offset, endIndex: offset + text.length },
          paragraphStyle: { namedStyleType: textStyle },
          fields: "namedStyleType",
        },
      });
    }
  }

  if (requests.length > 0) {
    await client.documents.batchUpdate({
      documentId: docId,
      requestBody: { requests },
    });
  }
}
