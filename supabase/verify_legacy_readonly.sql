-- READ ONLY. Run before and after the fleet migration with legacy writes paused.
-- Equal count AND checksum indicate identical serialized rows between snapshots.
-- This is verification, NOT a backup. Do not post the results with actual data publicly.
select 'tools' as source, count(*) as records,
  md5(coalesce(string_agg(id::text || ':' || md5(data::text), ',' order by id::text),'')) as checksum
from public.tools
union all
select 'history', count(*),
  md5(coalesce(string_agg(id::text || ':' || md5(data::text), ',' order by id::text),''))
from public.history
union all
select 'settings', count(*),
  md5(coalesce(string_agg(id::text || ':' || md5(data::text), ',' order by id::text),''))
from public.settings;

select id,
  case when jsonb_typeof(data::jsonb->'ppeRecords')='array'
    then jsonb_array_length(data::jsonb->'ppeRecords') else 0 end as ppe_records,
  md5(coalesce((data::jsonb->'ppeRecords')::text,'')) as ppe_checksum
from public.settings where id='main';
