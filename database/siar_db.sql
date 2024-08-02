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
    nomor_telp text,
    kategori_id int foreign key(kategori_id) REFERENCES kategori(id),
    deskripsi text,
    rating float,
    banner_img_path text,
    img_path text,
	lat float,
	long float,
	status_verif boolean set DEFAULT false
);
CREATE TABLE kategori (
    id SERIAL PRIMARY KEY,
    nama_kategori TEXT
);

CREATE TABLE umkms_kategori (
    id_umkm INT,
    id_kategori INT,
    FOREIGN KEY (id_umkm) REFERENCES umkms(id),
    FOREIGN KEY (id_kategori) REFERENCES kategori(id)
);

create table articles(
    id serial primary key,
    image_path text,
    title text,
    content text,
    created_at timestamp default current_timestamp,
    author text
)