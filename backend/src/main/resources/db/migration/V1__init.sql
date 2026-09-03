create table activity (
    id               bigint generated always as identity primary key,
    sport            varchar(64) not null,
    start_time       timestamptz,
    total_distance_meters  double precision,
    total_elapsed_seconds  double precision,
    avg_heart_rate   integer,
    samples          jsonb not null
);
