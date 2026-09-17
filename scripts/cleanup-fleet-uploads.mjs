/** Optional maintenance, NOT scheduled automatically. Default is dry-run; --apply deletes.
 * Only orphan drafts older than 48 hours are eligible. Stored invoice/history links are never deleted.
 * Node 22+: node --env-file=.env.local scripts/cleanup-fleet-uploads.mjs [--apply]
 */
import { createClient } from '@supabase/supabase-js';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('Missing URL or server-only key. Read START-POJAZDY.md.');
const apply = process.argv.includes('--apply');
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const cutoff = new Date(Date.now() - 48 * 3600_000).toISOString();
const rows = [];
for (let start = 0; ; start += 500) {
  const { data, error } = await db.from('acc_fleet_files').select('id,storage_path,created_at')
    .is('event_id', null).lt('created_at', cutoff).order('id').range(start, start + 499);
  if (error) throw error;
  rows.push(...(data || []));
  if (!data || data.length < 500) break;
}
console.log(`${apply ? 'APPLY' : 'DRY RUN'}: ${rows.length} unlinked uploads older than 48 hours.`);
let errors = 0;
for (const row of rows) {
  console.log(row.id, row.created_at, row.storage_path);
  if (!apply) continue;
  // Delete conditionally before Storage removal: a concurrent linked invoice must survive.
  const removed = await db.from('acc_fleet_files').delete().eq('id', row.id).is('event_id', null).lt('created_at', cutoff).select('id');
  if (removed.error) { console.error('Metadata failed:', removed.error.message); errors++; continue; }
  if (!removed.data?.length) { console.log('Skip: linked or removed concurrently.'); continue; }
  const file = await db.storage.from('acc-fleet-private').remove([row.storage_path]);
  if (file.error) { console.error('Storage cleanup failed. Remove this orphan path manually:', row.storage_path, file.error.message); errors++; }
}
if (!apply) console.log('No data changed. Add --apply only after reviewing this report.');
process.exitCode = errors ? 1 : 0;
