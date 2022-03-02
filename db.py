""" database access
docs:
* http://initd.org/psycopg/docs/
* http://initd.org/psycopg/docs/pool.html
* http://initd.org/psycopg/docs/extras.html#dictionary-like-cursor
"""

from contextlib import contextmanager
import logging
import os

from flask import current_app, g

import psycopg2
from psycopg2.pool import ThreadedConnectionPool
from psycopg2.extras import DictCursor

pool = None

def setup():
    global pool
    DATABASE_URL = os.environ['DATABASE_URL']
    current_app.logger.info(f"creating db connection pool")
    pool = ThreadedConnectionPool(1, 4, dsn=DATABASE_URL, sslmode='require')


@contextmanager
def get_db_connection():
    try:
        connection = pool.getconn()
        yield connection
    finally:
        pool.putconn(connection)


@contextmanager
def get_db_cursor(commit=False):
    with get_db_connection() as connection:
      cursor = connection.cursor(cursor_factory=DictCursor)
      # cursor = connection.cursor()
      try:
          yield cursor
          if commit:
              connection.commit()
      finally:
          cursor.close()


def add_user(user_id, username):
    # Since we're using connection pooling, it's not as big of a deal to have
    # lots of short-lived cursors (I think -- worth testing if we ever go big)
    with get_db_cursor(True) as cur:
        current_app.logger.info("Adding person %s", username)
        cur.execute("INSERT INTO users (u_id, username) values (%s, %s)", (user_id, username))

def get_username(user_id):
     with get_db_cursor(True) as cur:
        cur.execute("SELECT username FROM users WHERE u_id = %s", (user_id,))
        res = cur.fetchone()
        return res['username'] if res else res

def get_uid(username):
     with get_db_cursor(True) as cur:
        cur.execute("SELECT u_id FROM users WHERE username = %s", (username,))
        res = cur.fetchone()
        return res['u_id'] if res else res

def edit_username(user_id, username):
    with get_db_cursor(True) as cur:
        current_app.logger.info("Trying to add %s", username)
        cur.execute("""UPDATE users SET username = %s WHERE u_id = %s""", (username, user_id))


def get_posts(page = 0, post_per_page = 10):
    ''' note -- result can be used as list of dictionaries'''
    limit = post_per_page
    offset = page*post_per_page
    with get_db_cursor() as cur:
        cur.execute("select * from posts order by upload_time limit %s offset %s", (limit, offset))
        return cur.fetchall()

def get_post(post_id):
    with get_db_cursor() as cur:
        cur.execute("SELECT * FROM posts where post_id=%s", (post_id,))
        return cur.fetchone()

def upload_post(data, title, desc, hint, sol, u_id):
    with get_db_cursor(True) as cur:
        cur.execute("""insert into posts (title, post_image,
            descrip, hint, solution, author) 
            values (%s, %s, %s, %s, %s, %s) RETURNING post_id""",
            (title, data, desc, hint, sol, u_id))
        return cur.fetchone()[0] #postid

def get_image_ids():
    with get_db_cursor() as cur:
        cur.execute("select post_id from posts;")
        return [r['post_id'] for r in cur]

def get_tags():
    with get_db_cursor() as cur:
        cur.execute("SELECT post_id, textcat_all(tag_name || ',') FROM(SELECT * FROM (SELECT * FROM posts LEFT JOIN tagged ON post_id=post) AS joinedTags LEFT JOIN tags ON tag=tag_id) AS tag_labels GROUP BY post_id ORDER BY post_id;")
        return cur.fetchall()

def get_tag(post_id):
    with get_db_cursor() as cur:
        # This is kinda bad, definitely optimize this by adding WHERE clause deeper in query
        cur.execute("SELECT post_id, textcat_all(tag_name || ',') FROM(SELECT * FROM (SELECT * FROM posts LEFT JOIN tagged ON post_id=post) AS joinedTags LEFT JOIN tags ON tag=tag_id) AS tag_labels  WHERE post_id=%s GROUP BY post_id ORDER BY post_id;", (post_id,)) 
        return cur.fetchone()


def get_total_post_ids():
    with get_db_cursor() as cur:
        cur.execute("SELECT MAX(post_id) from posts;")
        return cur.fetchall()
