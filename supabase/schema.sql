-- Falkyria Games: contas, ranking global e xadrez online.
-- Roda num projeto Supabase (Postgres + Auth). Tudo que grava passa por funções
-- com SECURITY DEFINER; as tabelas só liberam leitura onde faz sentido.

create extension if not exists citext with schema extensions;

-- ---------------------------------------------------------------- perfis
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username extensions.citext unique not null check (username ~ '^[A-Za-z0-9_]{3,16}$'),
  rating int not null default 1200,
  chess_games int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "perfis são públicos" on public.profiles for select using (true);

-- O nome de jogador vem nos metadados do cadastro; o perfil nasce junto com o usuário.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare u text := coalesce(new.raw_user_meta_data ->> 'username', '');
begin
  if u !~ '^[A-Za-z0-9_]{3,16}$' then
    raise exception 'nome de jogador inválido';
  end if;
  insert into public.profiles (id, username) values (new.id, u);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.username_available(p_username text) returns boolean
language sql stable security definer set search_path = '' as $$
  select p_username ~ '^[A-Za-z0-9_]{3,16}$'
     -- compara em minúsculas: com search_path vazio o operador = do citext não é encontrado
     and not exists (select 1 from public.profiles where lower(username::text) = lower(p_username));
$$;

-- ---------------------------------------------------------------- ranking
create table public.games (
  id text primary key,
  max_score int not null  -- teto de sanidade: acima disso a pontuação é recusada
);
insert into public.games (id, max_score) values
  ('cobrinha', 5000), ('blocos', 5000000), ('orbita', 100000), ('desvio', 36000),
  ('palavras', 1000000), ('enxame', 10000000), ('nucleo', 10000000), ('tunel', 1000000),
  ('tijolos', 10000000), ('sequencia', 100000);
alter table public.games enable row level security;
create policy "jogos são públicos" on public.games for select using (true);

create table public.scores (
  game text not null references public.games (id),
  user_id uuid not null references public.profiles (id) on delete cascade,
  score int not null check (score > 0),
  updated_at timestamptz not null default now(),
  primary key (game, user_id)
);
create index scores_game_score on public.scores (game, score desc);
alter table public.scores enable row level security;
create policy "pontuações são públicas" on public.scores for select using (true);

-- Guarda só o melhor resultado de cada jogador em cada jogo. Devolve a posição atual.
create function public.submit_score(p_game text, p_score int) returns int
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); lim int; best int;
begin
  if uid is null then raise exception 'entre na sua conta para pontuar'; end if;
  select max_score into lim from public.games where id = p_game;
  if lim is null or p_score is null or p_score <= 0 or p_score > lim then
    raise exception 'pontuação inválida';
  end if;
  insert into public.scores (game, user_id, score) values (p_game, uid, p_score)
  on conflict (game, user_id) do update set score = excluded.score, updated_at = now()
    where public.scores.score < excluded.score;
  select score into best from public.scores where game = p_game and user_id = uid;
  return (select count(*) + 1 from public.scores where game = p_game and score > best);
end $$;

create function public.top_scores(p_game text, p_limit int default 50)
returns table (pos bigint, username text, score int)
language sql stable security definer set search_path = '' as $$
  select rank() over (order by s.score desc), p.username::text, s.score
  from public.scores s join public.profiles p on p.id = s.user_id
  where s.game = p_game
  order by s.score desc, s.updated_at
  limit least(greatest(p_limit, 1), 100);
$$;

-- Ranking geral: em cada jogo o 1º lugar vale 100 pontos, o 2º 99, e assim por diante.
create function public.overall_ranking(p_limit int default 50)
returns table (pos bigint, username text, points bigint, games bigint)
language sql stable security definer set search_path = '' as $$
  with r as (
    select user_id, rank() over (partition by game order by score desc) as rk from public.scores
  ), t as (
    select user_id, sum(greatest(0, 101 - rk)) as points, count(*) as games from r group by user_id
  )
  select rank() over (order by t.points desc), p.username::text, t.points::bigint, t.games
  from t join public.profiles p on p.id = t.user_id
  order by t.points desc, p.username
  limit least(greatest(p_limit, 1), 100);
$$;

create function public.chess_ranking(p_limit int default 50)
returns table (pos bigint, username text, rating int, games int)
language sql stable security definer set search_path = '' as $$
  select rank() over (order by rating desc), username::text, rating, chess_games
  from public.profiles where chess_games > 0
  order by rating desc, username
  limit least(greatest(p_limit, 1), 100);
$$;

-- ---------------------------------------------------------------- xadrez online
-- O estado do tabuleiro é o objeto do motor do site. O servidor confere de quem é a vez
-- e a ordem dos lances; a legalidade do lance é conferida pelo cliente de cada jogador.
create table public.chess_games (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  white uuid references public.profiles (id) on delete set null,
  black uuid references public.profiles (id) on delete set null,
  state jsonb not null,
  moves jsonb not null default '[]',
  status text not null default 'waiting' check (status in ('waiting', 'playing', 'done')),
  result text check (result in ('w', 'b', 'd')),
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index chess_games_waiting on public.chess_games (created_at desc) where status = 'waiting';
alter table public.chess_games enable row level security;  -- sem políticas: acesso só pelas funções

create function public._chess_view(g public.chess_games) returns json
language sql stable security definer set search_path = '' as $$
  select json_build_object(
    'id', g.id, 'code', g.code, 'status', g.status, 'result', g.result, 'reason', g.reason,
    'state', g.state, 'moves', g.moves,
    'white', (select json_build_object('name', username::text, 'rating', rating) from public.profiles where id = g.white),
    'black', (select json_build_object('name', username::text, 'rating', rating) from public.profiles where id = g.black),
    'me', case auth.uid() when g.white then 'w' when g.black then 'b' end);
$$;

-- Encerra a partida e atualiza o rating (Elo, K = 24) dos dois jogadores.
create function public._chess_finish(p_id uuid, p_result text, p_reason text) returns void
language plpgsql security definer set search_path = '' as $$
declare g public.chess_games; rw int; rb int; ew float; sw float;
begin
  update public.chess_games set status = 'done', result = p_result, reason = p_reason, updated_at = now()
    where id = p_id and status = 'playing' returning * into g;
  if not found or g.white is null or g.black is null or g.white = g.black then return; end if;
  select rating into rw from public.profiles where id = g.white for update;
  select rating into rb from public.profiles where id = g.black for update;
  ew := 1 / (1 + power(10, (rb - rw) / 400.0));
  sw := case p_result when 'w' then 1 when 'b' then 0 else 0.5 end;
  update public.profiles set rating = rw + round(24 * (sw - ew)), chess_games = chess_games + 1 where id = g.white;
  update public.profiles set rating = rb - round(24 * (sw - ew)), chess_games = chess_games + 1 where id = g.black;
end $$;

create function public.chess_create(p_state jsonb, p_color text default 'w') returns json
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); g public.chess_games; c text;
begin
  if uid is null then raise exception 'entre na sua conta para jogar online'; end if;
  if p_state is null or jsonb_typeof(p_state -> 'b') <> 'array' or jsonb_array_length(p_state -> 'b') <> 64 then
    raise exception 'posição inválida';
  end if;
  -- uma sala de espera por jogador
  delete from public.chess_games where status = 'waiting' and (white = uid or black = uid);
  loop
    c := upper(substr(md5(gen_random_uuid()::text), 1, 6));
    exit when not exists (select 1 from public.chess_games where code = c);
  end loop;
  insert into public.chess_games (code, white, black, state)
    values (c, case when p_color = 'b' then null else uid end, case when p_color = 'b' then uid end, p_state)
    returning * into g;
  return public._chess_view(g);
end $$;

create function public.chess_join(p_code text) returns json
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); g public.chess_games;
begin
  if uid is null then raise exception 'entre na sua conta para jogar online'; end if;
  select * into g from public.chess_games where code = upper(trim(p_code)) for update;
  if not found then raise exception 'partida não encontrada'; end if;
  if uid = g.white or uid = g.black then return public._chess_view(g); end if;
  if g.status <> 'waiting' then raise exception 'essa partida já começou'; end if;
  update public.chess_games
    set white = coalesce(white, uid), black = case when white is null then black else uid end,
        status = 'playing', updated_at = now()
    where id = g.id returning * into g;
  return public._chess_view(g);
end $$;

-- p_ply é o número de lances que o cliente já conhece: impede lance duplicado ou fora de ordem.
-- p_result (opcional) encerra a partida: o próprio jogador da vez só pode declarar a sua vitória ou empate.
create function public.chess_move(p_id uuid, p_ply int, p_state jsonb, p_move jsonb, p_result text default null, p_reason text default null) returns json
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); g public.chess_games; turn text;
begin
  select * into g from public.chess_games where id = p_id for update;
  if not found then raise exception 'partida não encontrada'; end if;
  if g.status <> 'playing' then raise exception 'a partida não está em andamento'; end if;
  turn := g.state ->> 't';
  if uid is null or uid <> (case turn when 'w' then g.white else g.black end) then raise exception 'não é a sua vez'; end if;
  if jsonb_array_length(g.moves) <> p_ply then raise exception 'lance fora de ordem'; end if;
  if p_state is null or jsonb_array_length(p_state -> 'b') <> 64 or p_state ->> 't' = turn then raise exception 'posição inválida'; end if;
  if p_result is not null and p_result not in (turn, 'd') then raise exception 'resultado inválido'; end if;
  update public.chess_games set state = p_state, moves = moves || jsonb_build_array(p_move), updated_at = now()
    where id = p_id returning * into g;
  if p_result is not null then
    perform public._chess_finish(p_id, p_result, left(p_reason, 80));
    select * into g from public.chess_games where id = p_id;
  end if;
  return public._chess_view(g);
end $$;

create function public.chess_resign(p_id uuid) returns json
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); g public.chess_games;
begin
  select * into g from public.chess_games where id = p_id for update;
  if not found or uid is null or uid not in (g.white, g.black) then raise exception 'partida não encontrada'; end if;
  if g.status = 'waiting' then delete from public.chess_games where id = p_id; return null; end if;
  if g.status = 'playing' then
    perform public._chess_finish(p_id, case when uid = g.white then 'b' else 'w' end, 'desistência');
    select * into g from public.chess_games where id = p_id;
  end if;
  return public._chess_view(g);
end $$;

create function public.chess_get(p_id uuid) returns json
language plpgsql stable security definer set search_path = '' as $$
declare g public.chess_games;
begin
  if auth.uid() is null then raise exception 'entre na sua conta para jogar online'; end if;
  select * into g from public.chess_games where id = p_id;
  if not found then return null; end if;
  return public._chess_view(g);
end $$;

-- Salas abertas esperando adversário e as partidas em andamento de quem chama.
create function public.chess_lobby() returns json
language sql stable security definer set search_path = '' as $$
  select json_build_object(
    'open', coalesce((select json_agg(x) from (
      select g.code, p.username::text as host, p.rating, g.state ->> 'v' as variant,
             case when g.white is null then 'w' else 'b' end as seat
      from public.chess_games g join public.profiles p on p.id = coalesce(g.white, g.black)
      where g.status = 'waiting' and g.created_at > now() - interval '2 hours'
        and coalesce(g.white, g.black) <> auth.uid()
      order by g.created_at desc limit 20) x), '[]'::json),
    'mine', coalesce((select json_agg(y) from (
      select g.id, g.code, g.status from public.chess_games g
      where auth.uid() in (g.white, g.black) and g.status <> 'done'
      order by g.updated_at desc limit 5) y), '[]'::json));
$$;

-- ---------------------------------------------------------------- permissões
-- O Supabase concede EXECUTE em toda função nova a anon e authenticated; aqui só fica o que é público de fato.
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.username_available(text), public.top_scores(text, int),
  public.overall_ranking(int), public.chess_ranking(int) to anon, authenticated;
grant execute on function public.submit_score(text, int), public.chess_create(jsonb, text),
  public.chess_join(text), public.chess_move(uuid, int, jsonb, jsonb, text, text),
  public.chess_resign(uuid), public.chess_get(uuid), public.chess_lobby() to authenticated;
