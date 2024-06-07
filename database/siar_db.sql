CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(50) NOT NULL,
    password VARCHAR(15) NOT NULL,
	username varchar(25) not null,
	rank text default 'hunter-pemula',
	exp int default 0 
);
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    title TEXT,
    description TEXT,
    file_path TEXT,
    thumbnail_path TEXT,
    views INT,
    likes INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
create table umkms(
	id serial primary key, 
	nama text,
	lat float,
	long float,
	status_verif boolean
);
