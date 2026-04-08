import type { ResultSetHeader } from 'mysql2/promise';

import { pool } from './pool';

export async function writeHistorial(params: {
  usuario?: string | null;
  email?: string | null;
  evento: string;
}): Promise<number> {
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO historial (historial_date, historial_user, historial_email, historial_evento)
     VALUES (NOW(), ?, ?, ?)`,
    [params.usuario ?? null, params.email ?? null, params.evento],
  );

  return result.insertId;
}

