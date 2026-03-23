-- Update get_user_state to include checkpoint positions
create or replace function get_user_state(p_user_id uuid)
returns json
language plpgsql
as $$
declare
  result json;
begin
  select json_build_object(
    'user_id', u.id,
    'app_code', u.app_code,
    'nickname', u.nickname,
    'email', u.email,
    'raffle_entries_total', coalesce((
      select sum(delta) from raffle_entries_ledger where user_id = p_user_id
    ), 0),
    'checkpoints_completed', (
      select count(*) from scans where user_id = p_user_id
    ),
    'checkpoints_completed_ids', coalesce((
      select json_agg(checkpoint_id) from scans where user_id = p_user_id
    ), '[]'::json),
    'active_multiplier', (
      select json_build_object('type', reward_type, 'remaining_uses', remaining_uses)
      from reward_states
      where user_id = p_user_id
        and reward_type = 'double_next_3_scans'
        and is_active = true
        and remaining_uses > 0
      order by created_at asc
      limit 1
    ),
    'donor_badge', exists(
      select 1 from reward_states
      where user_id = p_user_id and reward_type = 'donor_badge' and is_active = true
    ),
    'milestones_earned', coalesce((
      select json_agg(
        case
          when note like '%all%' then -1
          else (regexp_match(note, '(\d+)'))[1]::int
        end
      )
      from raffle_entries_ledger
      where user_id = p_user_id and source_type = 'checkpoint_milestone'
    ), '[]'::json),
    'checkpoints', (
      select coalesce(json_agg(
        json_build_object(
          'id', c.id,
          'name', c.name,
          'slug', c.slug,
          'sort_order', c.sort_order,
          'is_completed', exists(
            select 1 from scans s where s.user_id = p_user_id and s.checkpoint_id = c.id
          ),
          'position_lat', c.position_lat,
          'position_lng', c.position_lng
        ) order by c.sort_order
      ), '[]'::json)
      from checkpoints c
      where c.is_active = true
    )
  ) into result
  from users u
  where u.id = p_user_id;

  return result;
end;
$$;
