#!/usr/bin/env node
import pool from '../config/database.js';
import { dispatchNotificationRow } from '../services/notificationsService.js';

const MAX_BATCH = parseInt(process.env.NOTIFY_BATCH_SIZE || '20', 10);
const MAX_RUN_MS = parseInt(process.env.NOTIFY_MAX_RUN_MS || '25000', 10);

async function main() {
  const started = Date.now();
  let processed = 0;
  while (Date.now() - started < MAX_RUN_MS) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `SELECT * FROM notifications_queue
         WHERE status = 'queued' AND scheduled_at_utc <= NOW()
         ORDER BY scheduled_at_utc ASC
         FOR UPDATE SKIP LOCKED
         LIMIT $1`,
        [MAX_BATCH]
      );
      if (rows.length === 0) {
        await client.query('ROLLBACK');
        break; // nada para processar
      }

      for (const row of rows) {
        try {
          const results = await dispatchNotificationRow(row);
          await client.query(
            `UPDATE notifications_queue
             SET status = 'sent', sent_at = NOW(), last_result = $2::jsonb, updated_at = NOW()
             WHERE id = $1`,
            [row.id, JSON.stringify(results)]
          );
          processed++;
        } catch (err) {
          await client.query(
            `UPDATE notifications_queue SET status = 'failed', last_error = $2, updated_at = NOW() WHERE id = $1`,
            [row.id, err?.message || String(err)]
          );
        }
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('[dispatcher] erro no ciclo:', err?.message || err);
    } finally {
      client.release();
    }

    if (processed >= MAX_BATCH) break; // evita rodar demais em um único acionamento
  }
  console.log(`[dispatcher] concluído. Processados: ${processed}`);
  process.exit(0);
}

main().catch(err => {
  console.error('[dispatcher] falha fatal:', err);
  process.exit(1);
});
