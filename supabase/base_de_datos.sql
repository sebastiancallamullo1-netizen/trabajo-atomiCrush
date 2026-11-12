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
  nivel_maximo int not null default 1 check (nivel_maximo between 1 and 15),
  creado timestamptz not null default now()
);

-- Tabla de puntuaciones: el mejor puntaje y las estrellas de cada
-- jugador en cada nivel (un jugador tiene una fila por nivel ganado).
create table public.puntajes (
  usuario_id uuid not null references public.perfiles(id) on delete cascade,
  nivel int not null check (nivel between 1 and 15),
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
  set nivel_maximo = greatest(p.nivel_maximo, least(guardar_progreso.nivel_maximo, 15))
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

-- ============================================================
-- DOMINIOS DE CORREO PERMITIDOS
-- Solo se pueden crear cuentas con correos de estos dominios
-- (por ejemplo, alumno@gmail.com sí, alumno@cualquiercosa.xyz no).
-- Para permitir otro dominio: insert into public.dominios_permitidos values ('nuevo.com');
-- ============================================================
create table public.dominios_permitidos (
  dominio text primary key
);

insert into public.dominios_permitidos (dominio) values
  ('gmail.com'), ('hotmail.com'), ('hotmail.com.ar'), ('outlook.com'),
  ('outlook.com.ar'), ('live.com'), ('live.com.ar'), ('yahoo.com'),
  ('yahoo.com.ar'), ('icloud.com');

-- Cualquiera puede ver la lista (el juego la usa para avisar antes de registrar)
alter table public.dominios_permitidos enable row level security;
create policy "Todos ven los dominios" on public.dominios_permitidos
  for select using (true);

-- Antes de crear una cuenta, se revisa que el dominio del correo esté en la lista.
-- Así, aunque alguien se saltee el juego, la base de datos no lo deja registrarse.
create function public.revisar_dominio()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.dominios_permitidos
    where dominio = lower(split_part(new.email, '@', 2))
  ) then
    raise exception 'Dominio de correo no permitido';
  end if;
  return new;
end;
$$;

create trigger antes_de_crear_usuario
  before insert on auth.users
  for each row execute function public.revisar_dominio();

-- ============================================================
-- CAMBIO: de 10 a 15 niveles
-- (si la base ya estaba creada, correr solo esta parte)
-- ============================================================
-- alter table public.perfiles drop constraint perfiles_nivel_maximo_check;
-- alter table public.perfiles add constraint perfiles_nivel_maximo_check check (nivel_maximo between 1 and 15);
-- alter table public.puntajes drop constraint puntajes_nivel_check;
-- alter table public.puntajes add constraint puntajes_nivel_check check (nivel between 1 and 15);
-- y volver a crear guardar_progreso con "create or replace function" (de arriba)

-- ============================================================
-- SEGURIDAD EXTRA (beta test)
-- 1) Filtro de palabras ofensivas en el nickname y en el correo
-- 2) Nickname solo con letras, números y _ . -
-- 3) Puntajes entre 0 y 10.000 por nivel (para que no se pueda hacer trampa)
-- 4) El álbum solo acepta las 14 moléculas del juego
-- 5) Cada jugador puede borrar su propia cuenta
-- Las palabras son las mismas que src/palabrasProhibidas.js
-- ============================================================
create table public.palabras_prohibidas (palabra text primary key);
create table public.palabras_solas (palabra text primary key);
create table public.palabras_permitidas (palabra text primary key);
-- Sin políticas de lectura: nadie las puede leer ni modificar desde afuera
alter table public.palabras_prohibidas enable row level security;
alter table public.palabras_solas enable row level security;
alter table public.palabras_permitidas enable row level security;

insert into public.palabras_prohibidas (palabra) values ('boludo'), ('boluda'), ('pelotudo'), ('pelotuda'), ('forro'), ('forra'), ('pajero'), ('pajera'), ('pajin'), ('conchudo'), ('conchuda'), ('concha'), ('chota'), ('pija'), ('poronga'), ('garca'), ('salame'), ('gilazo'), ('chupapija'), ('chupamela'), ('chupala'), ('sorete'), ('ojete'), ('cagon'), ('cagona'), ('mogolico'), ('mogolica'), ('mongolico'), ('mongolica'), ('conchetumadre'), ('laconchadetumadre'), ('lpmqtp'), ('chupaculo'), ('gilipollas'), ('capullo'), ('subnormal'), ('cabron'), ('cabrona'), ('culero'), ('culera'), ('pinche'), ('chingar'), ('chingada'), ('chingado'), ('chingon'), ('verga'), ('vergon'), ('pendejo'), ('pendeja'), ('huevon'), ('weon'), ('aweonao'), ('conchetumare'), ('conchesumadre'), ('malparido'), ('malparida'), ('gonorrea'), ('mamaguevo'), ('mamaguebo'), ('mamahuevo'), ('hijueputa'), ('cojudo'), ('cojuda'), ('huevada'), ('imbecil'), ('idiota'), ('estupido'), ('estupida'), ('tarado'), ('tarada'), ('retrasado'), ('retrasada'), ('anormal'), ('inutil'), ('cornudo'), ('cornuda'), ('cretino'), ('cretina'), ('bastardo'), ('bastarda'), ('malnacido'), ('malnacida'), ('mierda'), ('mierdoso'), ('cagada'), ('carajo'), ('culiado'), ('culiao'), ('culeado'), ('hijodeputa'), ('hijadeputa'), ('putamadre'), ('lagranputa'), ('puta'), ('puto'), ('putita'), ('putito'), ('putazo'), ('putero'), ('prostituta'), ('prostituto'), ('ramera'), ('zorra'), ('perra'), ('trola'), ('trolo'), ('coger'), ('cogida'), ('cogiendo'), ('follar'), ('follando'), ('polla'), ('pollon'), ('tetas'), ('tetona'), ('culona'), ('culote'), ('pajearse'), ('pajeando'), ('masturb'), ('orgasmo'), ('orgia'), ('porno'), ('pornografia'), ('sexo'), ('violador'), ('violacion'), ('pedofilo'), ('pederasta'), ('zoofilia'), ('incesto'), ('chupapene'), ('pene'), ('vagina'), ('clitoris'), ('semen'), ('eyacul'), ('mamada'), ('felacion'), ('nalgas'), ('pichula'), ('calentona'), ('garchar'), ('garche'), ('maricon'), ('marica'), ('mariquita'), ('joto'), ('punal'), ('tortillera'), ('travelo'), ('trava'), ('negrodemierda'), ('negrata'), ('sudaca'), ('nazi'), ('hitler'), ('simio'), ('falopa'), ('cocaina'), ('porro'), ('drogadicto'), ('narco'), ('asesino'), ('matar'), ('suicid'), ('terrorista'), ('bomba'), ('fuck'), ('fucker'), ('fucking'), ('motherfucker'), ('shit'), ('bitch'), ('bastard'), ('asshole'), ('dick'), ('cock'), ('pussy'), ('cunt'), ('whore'), ('slut'), ('nigga'), ('nigger'), ('faggot'), ('retard'), ('porn'), ('sex');
insert into public.palabras_solas (palabra) values ('gil'), ('gila'), ('orto'), ('teta'), ('pito'), ('culo'), ('pete'), ('hdp'), ('lpm'), ('ctm'), ('csm'), ('ptm'), ('kkk'), ('ass'), ('tit'), ('mono'), ('torta'), ('bolita'), ('cono'), ('anal'), ('pico'), ('raja');
insert into public.palabras_permitidas (palabra) values ('comput'), ('disput'), ('imput'), ('reput'), ('diputad'), ('amput'), ('esput'), ('control'), ('recog'), ('escog'), ('acog'), ('encog'), ('conchita'), ('concheto'), ('pijama'), ('vergara'), ('georgia'), ('maricarmen'), ('maricruz'), ('matarazzo'), ('matarife'), ('matare'), ('carajillo'), ('bombero'), ('bombilla'), ('bombon'), ('bombard'), ('pinchetti'), ('pollack'), ('penelope'), ('sexto'), ('sexta'), ('sextet'), ('essex'), ('sussex'), ('dickson'), ('dickens'), ('peacock'), ('hitchcock'), ('hancock'), ('cockpit');

-- Misma normalización que el juego: minúsculas, sin tildes, números y símbolos
-- que imitan letras (p0rong4 → poronga) y letras repetidas de más (puuuta → puta)
create function public.normalizar_texto(texto text)
returns text
language sql
immutable
as $$
  select regexp_replace(
    translate(lower(texto), 'áéíóúüñàèìòù0134578@$', 'aeiouunaeiouoieastbas'),
    '(.)\1{2,}', '\1', 'g');
$$;

create function public.tiene_palabra_prohibida(texto text)
returns boolean
language plpgsql
stable
security definer set search_path = ''
as $$
declare
  limpio text := public.normalizar_texto(texto);
  solo_letras text := regexp_replace(public.normalizar_texto(texto), '[^a-z]', '', 'g');
  permitida text;
begin
  for permitida in select palabra from public.palabras_permitidas loop
    solo_letras := replace(solo_letras, permitida, '-');
  end loop;
  if exists (select 1 from public.palabras_prohibidas where position(palabra in solo_letras) > 0) then
    return true;
  end if;
  return exists (
    select 1 from public.palabras_solas
    where palabra = any (regexp_split_to_array(limpio, '[^a-z]+'))
       or palabra = regexp_replace(limpio, '[^a-z]', '', 'g')
  );
end;
$$;

-- Reemplaza al control anterior: ahora revisa dominio, nickname y palabras ofensivas
create or replace function public.revisar_dominio()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  nick text := coalesce(new.raw_user_meta_data ->> 'nickname', '');
begin
  if not exists (
    select 1 from public.dominios_permitidos
    where dominio = lower(split_part(new.email, '@', 2))
  ) then
    raise exception 'Dominio de correo no permitido';
  end if;
  if nick !~ '^[A-Za-z0-9_.ÁÉÍÓÚáéíóúÑñÜü-]{3,20}$' then
    raise exception 'Nickname inválido';
  end if;
  if public.tiene_palabra_prohibida(nick) or public.tiene_palabra_prohibida(split_part(new.email, '@', 1)) then
    raise exception 'Palabra no permitida';
  end if;
  return new;
end;
$$;

-- Reglas en las tablas
alter table public.perfiles add constraint perfiles_nickname_formato
  check (nickname ~ '^[A-Za-z0-9_.ÁÉÍÓÚáéíóúÑñÜü-]{3,20}$');
alter table public.puntajes add constraint puntajes_puntos_check check (puntos between 0 and 10000);
alter table public.album add constraint album_formula_check
  check (formula in ('H2O', 'O2', 'H2', 'N2', 'NaCl', 'CO2', 'NH3', 'CH4', 'CaO', 'MgO', 'KCl', 'KOH', 'K2O', 'CaCl2'));

-- Cada jugador puede borrar su cuenta (se borran también su perfil, puntajes y álbum)
create function public.borrar_mi_cuenta()
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Tenés que iniciar sesión';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

-- El nickname es único sin importar mayúsculas ("Pepe" y "pepe" no pueden convivir).
-- Se controla al registrarse (ya había dos cuentas "dac" y "Dac" de antes).
create or replace function public.revisar_nickname_repetido()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if exists (select 1 from public.perfiles where lower(nickname) = lower(new.raw_user_meta_data ->> 'nickname')) then
    raise exception 'Nickname repetido';
  end if;
  return new;
end;
$$;

create trigger antes_de_crear_usuario_nickname
  before insert on auth.users
  for each row execute function public.revisar_nickname_repetido();
