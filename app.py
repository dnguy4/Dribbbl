import json
import os
import math
import re
import urllib
import io
import psycopg2.errors
from base64 import b64encode
from flask import Flask, render_template, request, g, redirect, url_for, \
    jsonify, send_file, session, flash, abort
from authlib.integrations.flask_client import OAuth
from functools import wraps

import db

app = Flask(__name__)
app.secret_key = "can be anything, just random"
oauth = OAuth(app)

auth0clientid = os.getenv("client_id")
auth0clientsecret = os.getenv("client_secret")
auth0domain = os.getenv("auth0_domain")

auth0 = oauth.register(
    'auth0',
    client_id=auth0clientid,
    client_secret=auth0clientsecret,
    api_base_url='https://'+auth0domain,
    access_token_url='https://'+auth0domain+'/oauth/token',
    authorize_url='https://'+auth0domain+'/authorize',
    client_kwargs={
        'scope': 'openid profile email',
    },
)
# https://stackoverflow.com/questions/5208252/ziplist1-list2-in-jinja2
app.jinja_env.globals.update(zip=zip)

@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html', userinfo=session['profile']), 404

@app.before_first_request
def initialize():
    db.setup()
    app.register_error_handler(404, page_not_found)


###### AUTH0 functions ######
@app.route('/callback')
def callback_handling():
    # Handles response from token endpoint
    auth0.authorize_access_token()
    resp = auth0.get('userinfo')
    userinfo = resp.json()

    # Store the user information in flask session.
    session['jwt_payload'] = userinfo
    #useful keys: nickname, name, picture
    session['profile'] = {
        'user_id': userinfo['sub'],
        'name': userinfo['name'],
        'picture': userinfo['picture'],
        'email': userinfo['email']
    }

    username = db.get_username(userinfo['sub'])
    if userinfo['http://dribbbl.io/is_new'] or not username: #new user
        db.add_user(userinfo['sub'], userinfo['email'])
        return redirect(url_for("profile_page", username=userinfo['email']))
    else:
        session['profile']['name'] = username
        return redirect(url_for("landing_page"))


@app.route("/login")
def login():
      return auth0.authorize_redirect(redirect_uri=url_for("callback_handling", _external=True))

@app.route('/logout')
def logout():
    # Clear session stored data
    session.clear()
    # Redirect user to logout endpoint
    params = {'returnTo': url_for('landing_page', _external=True), 'client_id': auth0clientid}
    return redirect(auth0.api_base_url + '/v2/logout?' + urllib.parse.urlencode(params))

def requires_auth(f):
  @wraps(f)
  def decorated(*args, **kwargs):
    if 'profile' not in session:
      # Redirect to Login page here
      return redirect('/login')
    return f(*args, **kwargs)

  return decorated


def get_tags_and_images(posts):
    images = []
    post_ids = []
    for post in posts:
        post_ids.append(post['post_id'])
        images.append(b64encode(post['post_image']).decode("utf-8"))
    
    tags = db.get_tags(post_ids)
    for i in range(len(tags)):
        tags[i]['textcat_all'] = tags[i]['textcat_all'][:-1]

    return tags, images

###### Routes ######

@app.route('/')
def landing_page():
    page = max(request.args.get('page', 1, type=int), 1)
    final_page = math.ceil(db.get_num_of_posts()/10)
    posts = db.get_posts(page=page)
    tags, images = get_tags_and_images(posts)
    comments = db.get_comment_counts(page=page)
    return render_template('landing.html', userinfo=session.get("profile", None), 
        posts=posts, tags=tags, images=images, comments=comments,
        page_num=page, final_page=final_page)

@app.route('/user/<username>')
def profile_page(username):
    uid = db.get_uid(username)
    is_current_user =  session.get("profile") and session['profile']['user_id'] == uid
    if request.method == 'GET' and uid != None:
        posts = db.get_posts_by_author(uid)
        tags, images = get_tags_and_images(posts)
        comments = db.get_comment_counts()
        return render_template("profile.html", posts=posts, tags=tags, images=images, comments=comments,
            username=username, is_me=is_current_user, userinfo=session.get('profile', None))
    else:
        abort(404)

@app.route('/user/<username>', methods=['POST'])
@requires_auth
def update_username(username):
    uid = db.get_uid(username)
    is_current_user =  session['profile']['user_id'] == uid
    if is_current_user:
        new_username = request.form.get('username')
        if not re.match(r'^[A-Za-z0-9_@]+$', new_username):
            abort(400, "Only alphanumeric and underscores allowed")
        try:
            db.edit_username(uid, new_username)
            session['profile']['name'] = new_username
            session.modifed = True
            return redirect(url_for('profile_page', username=new_username))
        except psycopg2.Error as e:
            #print(e.pgerror)
            abort(403, "Username already in use")
    abort(401, "Unauthorized")


@app.route('/search', methods=['GET'])
def search():
    with db.get_db_cursor() as cur:
        posts = db.get_posts()
        tags = db.get_tags()
        for i in range(len(tags)):
            tags[i]['textcat_all'] = tags[i]['textcat_all'][:-1]
        # tags['textcat_all'] = [t[:-1] for t in tags['textcat_all']]

        # for tag in tags:
        #     # print(tag)
        #     # print(tag['post_id'])
        #     tag_list.append(tag['textcat_all'][:-1])
        #     # tag_list = tag['textcat_all'].split(',')[:-1]
        print(tags)
    return render_template("search.html", posts=posts, tags=tags)

@app.route('/post/<int:post_id>', methods=['GET'])
def solver_page(post_id):
    post = db.get_post(post_id)
    if post == None:
        abort(404)
    tags = db.get_tag(post_id)
    tags['textcat_all'] = tags['textcat_all'][:-1]
    username = db.get_post_author_name(post_id)
    comments = db.get_comments(post_id)
    if post['solved']:
        solver = next(c['username'] for c in comments if c['content'] == post['solution'])
    else:
        solver = None
    return render_template("solver.html", post=post,  comments=comments, solver=solver,
        tags=tags, author=username, userinfo=session.get('profile', None))

@app.route('/post/<int:post_id>', methods=['POST'])
@requires_auth
def add_comment(post_id):
    post = db.get_post(post_id)
    #allow comments only if not yet solved
    if not post or post['solved']:
        return redirect(url_for('solver_page', post_id=post_id))
    # #Limit 1 comment per user?
    comment_author =  session['profile']['user_id']
    content = request.form.get("answer", "").lower().strip()
    db.add_comment(post_id, comment_author, content)

    # Check if it was the solution
    if post['solution'] == content:
        db.mark_post_solved(True, post_id)
    return redirect(url_for('solver_page', post_id=post_id))

@app.route('/post/<int:post_id>/edit')
@requires_auth
def editing_page(post_id):
    post = db.get_post(post_id)
    if post == None:
        abort(404)
    if (post['author'] == session['profile']['user_id']):
        tags = db.get_tag(post_id)
        tags['textcat_all'] = tags['textcat_all'][:-1]
        username = db.get_post_author_name(post_id)
        return render_template("editing.html",post=post, tags=tags, author=username, userinfo=session['profile'])
    else:
        abort(403)

### IMAGES
@app.route('/images/<int:post_id>')
def view_post(post_id):
    post_row = db.get_post(post_id)
    stream = io.BytesIO(post_row["post_image"])
    return send_file(stream, attachment_filename=post_row["title"])

@app.route('/drawing')
@requires_auth
def drawing_page():
    tags = [t['tag_name'] for t in db.get_all_tags()]
    return render_template('drawing.html', tags=tags, userinfo=session['profile'])

@app.route('/drawing', methods=['POST'])
@requires_auth
def upload_post():
    file = request.files['post_image']
    data = file.read()
    title = request.form['title']
    desc = request.form['description']
    solution = request.form['word-selection'].lower().strip()
    hint = request.form['hint']
    show_comment = request.form.get('see-guesses', None) != None
    post_id = db.upload_post(data, title, desc, hint, show_comment, solution, 
            session['profile']['user_id'])
    tags = request.form['drawing_tags'].split(",")
    db.tag_post(tags, post_id)
    return str(post_id)

@app.route('/post/<int:post_id>/edit', methods=['POST'])
@requires_auth
def edit_post(post_id):
    post = db.get_post(post_id)
    if not post or post['author'] != session['profile']['user_id']:
        abort(403)
    delete = request.form.get('delete-post', None) != None
    if delete:
        db.delete_post(post_id)
        return redirect(url_for("profile_page", username=session['profile']['name']))
    title = request.form['title']
    desc = request.form['description']
    hint = request.form['hint']
    show_comment = request.form.get('see-guesses', None) != None
    db.edit_post(title, desc, hint, show_comment, post_id)
    return redirect(url_for("solver_page", post_id=post_id))
