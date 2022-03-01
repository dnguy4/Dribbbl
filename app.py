import json
import os
import urllib
import io
import psycopg2.errors
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

#Kluver's groovy DB setup
@app.before_first_request
def initialize():
    db.setup()


###### AUTH0 functions ######
@app.route('/callback')
def callback_handling():
    # Handles response from token endpoint
    auth0.authorize_access_token()
    resp = auth0.get('userinfo')
    userinfo = resp.json()
    #print(userinfo, flush=True)

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
      return redirect('/')
    return f(*args, **kwargs)

  return decorated

###### Routes ######

@app.route('/')
def landing_page():
    userInfo = session.get("profile", None)
    with db.get_db_cursor() as cur:
        posts = db.get_posts()
        return render_template('landing.html',  userinfo=userInfo, posts=posts)

@app.route('/user/<username>', methods=['GET', 'POST'])
def profile_page(username):
    uid = db.get_uid(username) #if uid dne, return 404
    if request.method == 'GET':
        return render_template("profile.html", uid=uid, username=username)
    else:
        #POST, trying to change username
        new_username = request.form.get('username')
        try:
            db.edit_username(uid, new_username)
            session['profile']['name'] = new_username
            return redirect(url_for('profile_page', username=new_username))
        except psycopg2.Error as e:
            flash("Username already taken.")
            #print(e.pgerror)
            return redirect(url_for('profile_page', username=username))


@app.route('/search')
def search_page():
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

@app.route('/solver/<post_id>')
def solver_page(post_id):
    number = int(post_id)
    print("number")
    with db.get_db_cursor() as cur:
        print(db.get_total_post_ids())
        listMaxId = db.get_total_post_ids()
        maxId = listMaxId[0][0]
        if(number > maxId):
            abort(404)
        else:
            post=db.get_post(number)
            return render_template("solver.html",post=post)

### IMAGES
### TODO replace them with the proper function route names
@app.route('/images/<int:post_id>')
def view_post(post_id):
    post_row = db.get_post(post_id)
    stream = io.BytesIO(post_row["post_image"])
         
    # use special "send_file" function
    return send_file(stream, attachment_filename=post_row["title"])

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ['png', 'jpg', "gif"]


@app.route('/image', methods=['POST'])
@requires_auth
def upload_post():
    # check if the post request has the file part
    if 'post_image' not in request.files:
        return redirect(url_for("image_gallery", status="Image Upload Failed: No selected file"))
    file = request.files['post_image']
    title = request.form['title']
    desc = request.form['desc']
    solution = request.form['solution']
    hint = request.form['hint']

    # if user does not select file, browser also
    # submit an empty part without filename
    if file.filename == '':
        return redirect(url_for("image_gallery", status="Image Upload Failed: No selected file"))
    if file and allowed_file(file.filename):
        #filename = secure_filename(file.filename)
        data = file.read()
        db.upload_post(data, title, desc, hint, solution, 
            session['profile']['user_id']) #todo: sanitize title
    return redirect(url_for("image_gallery", status="Image Uploaded Succesfully"))

@app.route('/image', methods=['GET'])
def image_gallery():
    with db.get_db_cursor() as cur:
        image_ids = db.get_image_ids()
        return render_template("uploader.html", image_ids = image_ids)

@app.route('/drawing')
def drawing_page():
    return render_template('drawing.html')