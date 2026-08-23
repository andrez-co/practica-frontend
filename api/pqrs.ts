import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

export interface PQRS {
  id: string;
  solicitante: string;
  categoria: 'Agua' | 'Basuras' | 'Alumbrado' | string;
  descripcion: string;
  estado: 'En trámite' | 'Resuelto' | string;
  fechaRadicacion: string;
  plazoLegal: string;
  respuestaOficial: string;
}

export default function handler(
  _req: IncomingMessage,
  res: ServerResponse & { status?: (code: number) => void; json?: (data: unknown) => void }
) {
  try {
    const filePath = path.join(process.cwd(), 'data', 'pqrs.json');
    if (!fs.existsSync(filePath)) {
      if (typeof res.json === 'function') {
        res.status?.(404);
        return res.json({ error: 'Archivo data/pqrs.json no encontrado' });
      }
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: 'Archivo data/pqrs.json no encontrado' }));
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const pqrsData: PQRS[] = JSON.parse(fileContent);

    if (typeof res.json === 'function') {
      return res.json(pqrsData);
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.end(JSON.stringify(pqrsData));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    if (typeof res.json === 'function') {
      res.status?.(500);
      return res.json({ error: 'Error interno al procesar las PQRS', detail: errorMessage });
    }
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'Error interno al procesar las PQRS', detail: errorMessage }));
  }
}
