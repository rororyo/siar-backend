PGDMP     1    '    
            |         
   siar-halal    15.4    15.4 9    4           0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                      false            5           0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                      false            6           0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                      false            7           1262    41283 
   siar-halal    DATABASE     �   CREATE DATABASE "siar-halal" WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'English_United States.1252';
    DROP DATABASE "siar-halal";
                postgres    false                        3079    42515    cube 	   EXTENSION     8   CREATE EXTENSION IF NOT EXISTS cube WITH SCHEMA public;
    DROP EXTENSION cube;
                   false            8           0    0    EXTENSION cube    COMMENT     E   COMMENT ON EXTENSION cube IS 'data type for multidimensional cubes';
                        false    4                        3079    42604    earthdistance 	   EXTENSION     A   CREATE EXTENSION IF NOT EXISTS earthdistance WITH SCHEMA public;
    DROP EXTENSION earthdistance;
                   false    4            9           0    0    EXTENSION earthdistance    COMMENT     f   COMMENT ON EXTENSION earthdistance IS 'calculate great-circle distances on the surface of the Earth';
                        false    5                        3079    41432    postgis 	   EXTENSION     ;   CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;
    DROP EXTENSION postgis;
                   false            :           0    0    EXTENSION postgis    COMMENT     ^   COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';
                        false    3                        3079    41284 	   uuid-ossp 	   EXTENSION     ?   CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;
    DROP EXTENSION "uuid-ossp";
                   false            ;           0    0    EXTENSION "uuid-ossp"    COMMENT     W   COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';
                        false    2            �            1259    41422    articles    TABLE     �   CREATE TABLE public.articles (
    id integer NOT NULL,
    image_path text,
    title text,
    content text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    author text
);
    DROP TABLE public.articles;
       public         heap    postgres    false            �            1259    41421    articles_id_seq    SEQUENCE     �   CREATE SEQUENCE public.articles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 &   DROP SEQUENCE public.articles_id_seq;
       public          postgres    false    227            <           0    0    articles_id_seq    SEQUENCE OWNED BY     C   ALTER SEQUENCE public.articles_id_seq OWNED BY public.articles.id;
          public          postgres    false    226            �            1259    41383    kategori    TABLE     M   CREATE TABLE public.kategori (
    id integer NOT NULL,
    kategori text
);
    DROP TABLE public.kategori;
       public         heap    postgres    false            �            1259    41382    kategori_id_seq    SEQUENCE     �   CREATE SEQUENCE public.kategori_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 &   DROP SEQUENCE public.kategori_id_seq;
       public          postgres    false    224            =           0    0    kategori_id_seq    SEQUENCE OWNED BY     C   ALTER SEQUENCE public.kategori_id_seq OWNED BY public.kategori.id;
          public          postgres    false    223            �            1259    41363    reviews    TABLE     �   CREATE TABLE public.reviews (
    id integer NOT NULL,
    title text,
    description text,
    file_path text,
    thumbnail_path text,
    views integer,
    likes integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
    DROP TABLE public.reviews;
       public         heap    postgres    false            �            1259    41362    reviews_id_seq    SEQUENCE     �   CREATE SEQUENCE public.reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 %   DROP SEQUENCE public.reviews_id_seq;
       public          postgres    false    220            >           0    0    reviews_id_seq    SEQUENCE OWNED BY     A   ALTER SEQUENCE public.reviews_id_seq OWNED BY public.reviews.id;
          public          postgres    false    219            �            1259    41373    umkms    TABLE     /  CREATE TABLE public.umkms (
    id integer NOT NULL,
    nama text,
    lat double precision,
    long double precision,
    status_verif boolean DEFAULT false,
    nomor_telp text,
    kategori_id integer,
    rating double precision,
    deskripsi text,
    banner_img_path text,
    img_path text
);
    DROP TABLE public.umkms;
       public         heap    postgres    false            �            1259    41372    umkms_id_seq    SEQUENCE     �   CREATE SEQUENCE public.umkms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 #   DROP SEQUENCE public.umkms_id_seq;
       public          postgres    false    222            ?           0    0    umkms_id_seq    SEQUENCE OWNED BY     =   ALTER SEQUENCE public.umkms_id_seq OWNED BY public.umkms.id;
          public          postgres    false    221            �            1259    41391    umkms_kategori    TABLE     U   CREATE TABLE public.umkms_kategori (
    id_umkm integer,
    id_kategori integer
);
 "   DROP TABLE public.umkms_kategori;
       public         heap    postgres    false            �            1259    41352    users    TABLE       CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(50) NOT NULL,
    password text NOT NULL,
    username character varying(25),
    rank text DEFAULT 'hunter-pemula'::text,
    exp integer DEFAULT 0
);
    DROP TABLE public.users;
       public         heap    postgres    false    2            �            1259    49642    wayspotfound    TABLE     �   CREATE TABLE public.wayspotfound (
    id integer NOT NULL,
    user_id uuid,
    lat double precision,
    lon double precision,
    foundat timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
     DROP TABLE public.wayspotfound;
       public         heap    postgres    false            �            1259    49641    wayspotfound_id_seq    SEQUENCE     �   CREATE SEQUENCE public.wayspotfound_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 *   DROP SEQUENCE public.wayspotfound_id_seq;
       public          postgres    false    234            @           0    0    wayspotfound_id_seq    SEQUENCE OWNED BY     K   ALTER SEQUENCE public.wayspotfound_id_seq OWNED BY public.wayspotfound.id;
          public          postgres    false    233            |           2604    41425    articles id    DEFAULT     j   ALTER TABLE ONLY public.articles ALTER COLUMN id SET DEFAULT nextval('public.articles_id_seq'::regclass);
 :   ALTER TABLE public.articles ALTER COLUMN id DROP DEFAULT;
       public          postgres    false    227    226    227            {           2604    41386    kategori id    DEFAULT     j   ALTER TABLE ONLY public.kategori ALTER COLUMN id SET DEFAULT nextval('public.kategori_id_seq'::regclass);
 :   ALTER TABLE public.kategori ALTER COLUMN id DROP DEFAULT;
       public          postgres    false    223    224    224            w           2604    41366 
   reviews id    DEFAULT     h   ALTER TABLE ONLY public.reviews ALTER COLUMN id SET DEFAULT nextval('public.reviews_id_seq'::regclass);
 9   ALTER TABLE public.reviews ALTER COLUMN id DROP DEFAULT;
       public          postgres    false    220    219    220            y           2604    41376    umkms id    DEFAULT     d   ALTER TABLE ONLY public.umkms ALTER COLUMN id SET DEFAULT nextval('public.umkms_id_seq'::regclass);
 7   ALTER TABLE public.umkms ALTER COLUMN id DROP DEFAULT;
       public          postgres    false    222    221    222            ~           2604    49645    wayspotfound id    DEFAULT     r   ALTER TABLE ONLY public.wayspotfound ALTER COLUMN id SET DEFAULT nextval('public.wayspotfound_id_seq'::regclass);
 >   ALTER TABLE public.wayspotfound ALTER COLUMN id DROP DEFAULT;
       public          postgres    false    233    234    234            /          0    41422    articles 
   TABLE DATA           V   COPY public.articles (id, image_path, title, content, created_at, author) FROM stdin;
    public          postgres    false    227   =       ,          0    41383    kategori 
   TABLE DATA           0   COPY public.kategori (id, kategori) FROM stdin;
    public          postgres    false    224   �C       (          0    41363    reviews 
   TABLE DATA           n   COPY public.reviews (id, title, description, file_path, thumbnail_path, views, likes, created_at) FROM stdin;
    public          postgres    false    220   D       s          0    41750    spatial_ref_sys 
   TABLE DATA           X   COPY public.spatial_ref_sys (srid, auth_name, auth_srid, srtext, proj4text) FROM stdin;
    public          postgres    false    229   !D       *          0    41373    umkms 
   TABLE DATA           �   COPY public.umkms (id, nama, lat, long, status_verif, nomor_telp, kategori_id, rating, deskripsi, banner_img_path, img_path) FROM stdin;
    public          postgres    false    222   >D       -          0    41391    umkms_kategori 
   TABLE DATA           >   COPY public.umkms_kategori (id_umkm, id_kategori) FROM stdin;
    public          postgres    false    225   *E       &          0    41352    users 
   TABLE DATA           I   COPY public.users (id, email, password, username, rank, exp) FROM stdin;
    public          postgres    false    218   GE       1          0    49642    wayspotfound 
   TABLE DATA           F   COPY public.wayspotfound (id, user_id, lat, lon, foundat) FROM stdin;
    public          postgres    false    234   G       A           0    0    articles_id_seq    SEQUENCE SET     =   SELECT pg_catalog.setval('public.articles_id_seq', 2, true);
          public          postgres    false    226            B           0    0    kategori_id_seq    SEQUENCE SET     =   SELECT pg_catalog.setval('public.kategori_id_seq', 6, true);
          public          postgres    false    223            C           0    0    reviews_id_seq    SEQUENCE SET     =   SELECT pg_catalog.setval('public.reviews_id_seq', 1, false);
          public          postgres    false    219            D           0    0    umkms_id_seq    SEQUENCE SET     :   SELECT pg_catalog.setval('public.umkms_id_seq', 9, true);
          public          postgres    false    221            E           0    0    wayspotfound_id_seq    SEQUENCE SET     B   SELECT pg_catalog.setval('public.wayspotfound_id_seq', 1, false);
          public          postgres    false    233            �           2606    41430    articles articles_pkey 
   CONSTRAINT     T   ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_pkey PRIMARY KEY (id);
 @   ALTER TABLE ONLY public.articles DROP CONSTRAINT articles_pkey;
       public            postgres    false    227            �           2606    41390    kategori kategori_pkey 
   CONSTRAINT     T   ALTER TABLE ONLY public.kategori
    ADD CONSTRAINT kategori_pkey PRIMARY KEY (id);
 @   ALTER TABLE ONLY public.kategori DROP CONSTRAINT kategori_pkey;
       public            postgres    false    224            �           2606    41371    reviews reviews_pkey 
   CONSTRAINT     R   ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);
 >   ALTER TABLE ONLY public.reviews DROP CONSTRAINT reviews_pkey;
       public            postgres    false    220            �           2606    41380    umkms umkms_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public.umkms
    ADD CONSTRAINT umkms_pkey PRIMARY KEY (id);
 :   ALTER TABLE ONLY public.umkms DROP CONSTRAINT umkms_pkey;
       public            postgres    false    222            �           2606    41361    users users_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);
 :   ALTER TABLE ONLY public.users DROP CONSTRAINT users_pkey;
       public            postgres    false    218            �           2606    49648    wayspotfound wayspotfound_pkey 
   CONSTRAINT     \   ALTER TABLE ONLY public.wayspotfound
    ADD CONSTRAINT wayspotfound_pkey PRIMARY KEY (id);
 H   ALTER TABLE ONLY public.wayspotfound DROP CONSTRAINT wayspotfound_pkey;
       public            postgres    false    234            �           2606    41404    umkms fk_kategori    FK CONSTRAINT     w   ALTER TABLE ONLY public.umkms
    ADD CONSTRAINT fk_kategori FOREIGN KEY (kategori_id) REFERENCES public.kategori(id);
 ;   ALTER TABLE ONLY public.umkms DROP CONSTRAINT fk_kategori;
       public          postgres    false    4232    222    224            �           2606    41399 .   umkms_kategori umkms_kategori_id_kategori_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.umkms_kategori
    ADD CONSTRAINT umkms_kategori_id_kategori_fkey FOREIGN KEY (id_kategori) REFERENCES public.kategori(id);
 X   ALTER TABLE ONLY public.umkms_kategori DROP CONSTRAINT umkms_kategori_id_kategori_fkey;
       public          postgres    false    225    4232    224            �           2606    41394 *   umkms_kategori umkms_kategori_id_umkm_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.umkms_kategori
    ADD CONSTRAINT umkms_kategori_id_umkm_fkey FOREIGN KEY (id_umkm) REFERENCES public.umkms(id);
 T   ALTER TABLE ONLY public.umkms_kategori DROP CONSTRAINT umkms_kategori_id_umkm_fkey;
       public          postgres    false    222    225    4230            �           2606    49649 &   wayspotfound wayspotfound_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.wayspotfound
    ADD CONSTRAINT wayspotfound_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);
 P   ALTER TABLE ONLY public.wayspotfound DROP CONSTRAINT wayspotfound_user_id_fkey;
       public          postgres    false    218    234    4226            /   �  x��XM�5=���:��Lvf��[� ����^<ݞ�n������lw7n "���=n���{�ʽ�<W!���A�tx~P�j�l��i��z��1�a��_������S0�ԠcC��A�Q��Iuf4�5�D�7qK?(�j��d[R�MUkzL ��W�ZG2�!}<���>uw�X��w��.梽WX��	AA�L��lPOfHaK?���oi�ߠ�g)��Z�G����h��u�t@�?���=|H�TK���y��oH��#��ث6�S��5Ö~�F�z<8�t2���ÙR$�#�8��v?�Ø�J-��.�F��'!񿼊f,~NF�+���#�'W�`��xM\��[�5��R|HYJ^�]���G�Z�O�O�����y�͡#����P��Rm���l#Yp�*2ª<�����t�z��]�����!)<�KJJz>��Q4�5]���9�hp=7s���ދ��4i&BrmA��tCק8�o9��0e�L�������
e.J��#����	�@R/�����\i΋9�Tm2���Ȋ�gg[���rc�K�8_ε��//K����" W�e�N� �/��=��b5ݖ����1�E�=
�5ąE�:xO1s@d,���t0 �уY���t6�]i�۽�CF���R�q�P�[�z<tb<@Ĳ��~ֈgd�AM{��/�il�����G�'�n C\���"~�5�^E�ս�Y�"�l�,mC�0Xe�`�T>�4S������I��n <����-��f�@���r4�E���#��$��p�&O-���ƞ=h�RJ���v�k&\p��S�(�qQ� q�GH��&�]��� �����n�l�����?A��lP�X%�Z˒MnN�m��BB���90Scjx����d���M��lkӶV�2�#s�d�G�*�g���Ի����3�=����/��|��O�?aP�bC�mK�;�o�LH�Đ��0�_R?��P��he��;�!8u��L��2��V I˒�?c��NX�[��+�M\2��*�3@i�U5�P�?�"��n:�ҁ�ӷ���{��+�;�rX2A	���8����c9h9�,:����ADbش;�j�(@5|i�X���Yа�C���7�b$�o	re�4� ϰ�d�b��%U�l9�eܘ�"�-}���}>=+���Pj9�R�|�bw&�d�O�����,}��'�Y:��Wnй�����e���վ�.Y�+Q�Qf��2л�Ei�\;)���l��ZOݢ�o 1���l�T����,�dn�X �eɩ�#�d�d[�T�i�V��=�� ���6�b�_y��D� a3Y�8��y�B/(�p�'��<��}�8����SW���q�,KǛ&��'a��+���pg�n[�[���D��2�c���N�uf��7oW3d�3���pN�]��������vw�/�nn����~u}M_��εg$Ad�|��῏�����_��|��w:���~��W����^��+�z��Ԯx�}Ϯ�~�6�{}�{u����^�\�n�tW���)mn�`b�i�Y����������G�h��v�O��}�1Y��w��;��3�=��2��O�\��k��5󯷸�w���ۛ�����{��R�^=n���� �U��      ,   G   x�3�t�K�NT�K,��2�t�L�UpJMJ��2�tJ����2��J�J��2���/��2����+�
��qqq M9�      (      x������ � �      s      x������ � �      *   �   x��нN�0��y��@�8M�1�8$�[,�+�HZ]ҁ��-�U,`y����JȅO�A!���3H��I+��e�j����q�o>�w��(�ph�e��n�u^n�Y�m(�?�^��"����W�W�~�U�l�[�}��%������B9��D%��Ưy�/��ZxxN!��1O�?̴��C�u����۔��O����Gc������1���j�      -      x������ � �      &   �  x����r�0 ��5>;���$���Z��U��p��BA���sv�Ӆ��7H(<& sd"C
ph��B��v��m�x�p%�ҧS�e�晦��+,#��G����{����g������x���f2���5��z�������|�U)Z5W�=,�����׫S�|�̿ks-��*.�g�]R���2D`q��A�MF ��Ќ� F��&��sq�l`�9�*�Q�(�y����+�&U���[�&���fq[��0ee�������_�#����"��� 	�,0`G����V�ßdv?��Z����q������We'=X���Z:*������{������ r�2yM�2jw��72C��1B����2��@ FTp!�Iٿ�O<ʤ��J�7�t1*������WvS�-��^�L�*��Z��^�A���S(¨iS���|�t:_��ތ      1      x������ � �     