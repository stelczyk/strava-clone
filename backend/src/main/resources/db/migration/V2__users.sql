create table users (
    id            bigint generated always as identity primary key,
    username      varchar(64) not null unique,
    password_hash varchar(255) not null,
    role          varchar(32) not null default 'USER'
);
