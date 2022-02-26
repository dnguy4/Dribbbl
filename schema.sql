create table tags (
  tag_id SERIAL PRIMARY KEY,
  tag_name varchar(127) not null
);

-- Would like to make username unique, have to sort out what happens during collision
create table users (
    u_id text PRIMARY KEY,
    username varchar(127) not null unique
);

create table posts (
    post_id SERIAL PRIMARY KEY,
    title varchar(127) not null,
    upload_time timestamp default now(),
    post_image bytea,
    descrip text,
    hint text,
    solution text not null,
    solved boolean default false,
    author text references users(u_id),
    show_comment boolean default true
);

create table tagged (
    post int references posts(post_id) ON DELETE CASCADE,
    tag int references tags(tag_id) ON DELETE CASCADE
);

create table COMMENTS (
    comment_id SERIAL PRIMARY KEY,
    post int references posts(post_id),
    author text references users(u_id),
    content text,
    upload_time timestamp default now()
);

-- INSERT INTO POSTS (title, descrip, author) VALUES ('emc', 'physics', 3);
-- https://extendsclass.com/postgresql-online.html