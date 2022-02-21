create table tags (
  tag_id SERIAL PRIMARY KEY,
  tag_name varchar(127) not null
);

create table users (
    u_id SERIAL PRIMARY KEY,
    username varchar(127) not null
);

create table posts (
    post_id SERIAL PRIMARY KEY,
    title varchar(127) not null,
    upload_time timestamp default now(),
    descrip text,
    hint text,
    solved boolean default false,
    author int references users(u_id),
    show_comment boolean default true
);

create table tagged (
    post int references posts(post_id) ON DELETE CASCADE,
    tag int references tags(tag_id) ON DELETE CASCADE
);

create table COMMENTS (
    comment_id SERIAL PRIMARY KEY,
    post int references posts(post_id),
    author int references users(u_id),
    content text,
    upload_time timestamp default now()
);

-- INSERT INTO POSTS (title, descrip, author) VALUES ('emc', 'physics', 3);