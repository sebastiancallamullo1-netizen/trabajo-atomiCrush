-- ============================================================
-- BASE DE DATOS DE ATOMICRUSH (Supabase / PostgreSQL)
-- Para crearla: en Supabase entrar al proyecto > "SQL Editor" >
-- "New query" > pegar todo este archivo > "Run".
--
-- Los usuarios (correo y contraseña) los guarda Supabase solo, en su
-- tabla auth.users, con la contraseña hasheada. Acá solo creamos lo
-- propio del juego: perfil (nickname), puntajes y álbum.
-- ============================================================

-- Un perfil por jugador. El id es el mismo que el del usuario de Supabase.
create table public.perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null unique check (char_length(nickname) between 3 and 20),
  nivel_maximo int not null default 1 check (nivel_maximo between 1 and 10),
  creado timestamptz not null default now()
);

-- Tabla de puntuaciones: el mejor puntaje y las estrellas de cada
-- jugador en cada nivel (un jugador tiene una fila por nivel ganado).
create table public.puntajes (
  usuario_id uuid not null references public.perfiles(id) on delete cascade,
  nivel int not null check (nivel between 1 and 10),
  puntos int not null default 0,
  estrellas int not null default 0 check (estrellas between 0 and 3),
  primary key (usuario_id, nivel)
);

-- Álbum: qué moléculas descubrió cada jugador (por ejemplo "H2O")
create table public.album (
  usuario_id uuid not null references public.perfiles(id) on delete cascade,
  formula text not null,
  primary key (usuario_id, formula)
);

-- ============================================================
-- SEGURIDAD (RLS): el juego se conecta directo a la base de datos,
-- así que hay que decir qué puede leer cada uno. Nadie puede escribir
-- directo en las tablas: se escribe solo con las funciones de abajo.
-- ============================================================
alter table public.perfiles enable row level security;
alter table public.puntajes enable row level security;
alter table public.album enable row level security;

-- Los nicknames los puede ver cualquiera (para saber si uno ya está usado)
create policy "Todos ven los perfiles" on public.perfiles
  for select using (true);

-- Cada jugador ve solo sus propios puntajes y su álbum
create policy "Cada uno ve sus puntajes" on public.puntajes
  for select using (auth.uid() = usuario_id);

create policy "Cada uno ve su album" on public.album
  for select using (auth.uid() = usuario_id);

-- ============================================================
-- Cuando alguien crea una cuenta, se le crea su perfil con el
-- nickname que escribió en el registro.
-- ============================================================
create function public.crear_perfil()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.perfiles (id, nickname)
  values (new.id, new.raw_user_meta_data ->> 'nickname');
  return new;
end;
$$;

create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function public.crear_perfil();

-- ============================================================
-- GUARDAR PROGRESO del jugador que inició sesión (auth.uid()).
-- Recibe el nivel máximo, los niveles { "1": { puntos, estrellas } }
-- y el álbum ["H2O", ...]. Solo guarda mejoras: nunca baja un
-- puntaje ni el nivel alcanzado (igual que la versión en PHP).
-- ============================================================
create function public.guardar_progreso(nivel_maximo int, niveles jsonb, album text[])
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  jugador uuid := auth.uid();
  fila record;
begin
  if jugador is null then
    raise exception 'Tenés que iniciar sesión';
  end if;

  -- greatest se queda con el mayor entre el guardado y el nuevo
  update public.perfiles p
  set nivel_maximo = greatest(p.nivel_maximo, least(guardar_progreso.nivel_maximo, 10))
  where p.id = jugador;

  -- Si el jugador ya tenía ese nivel, se actualiza solo si mejoró
  for fila in select key, value from jsonb_each(niveles) loop
    insert into public.puntajes (usuario_id, nivel, puntos, estrellas)
    values (jugador, fila.key::int, (fila.value ->> 'puntos')::int, (fila.value ->> 'estrellas')::int)
    on conflict (usuario_id, nivel) do update
    set puntos = greatest(public.puntajes.puntos, excluded.puntos),
        estrellas = greatest(public.puntajes.estrellas, excluded.estrellas);
  end loop;

  -- "on conflict do nothing": si la molécula ya estaba guardada, no pasa nada
  insert into public.album (usuario_id, formula)
  select jugador, unnest(guardar_progreso.album)
  on conflict do nothing;
end;
$$;

-- ============================================================
-- RANKING: los 10 mejores jugadores. El puntaje total es la suma
-- del mejor puntaje en cada nivel (repetir un nivel no lo infla).
-- ============================================================
create function public.ranking()
returns table (nickname text, nivel_maximo int, puntos_totales bigint)
language sql
security definer set search_path = ''
as $$
  select p.nickname, p.nivel_maximo, sum(s.puntos) as puntos_totales
  from public.perfiles p
  join public.puntajes s on s.usuario_id = p.id
  group by p.id
  order by puntos_totales desc
  limit 10;
$$;
