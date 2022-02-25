import json
import os
import urllib
from flask import Flask, render_template, request, g, redirect, url_for, jsonify, send_file, session
from authlib.integrations.flask_client import OAuth

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
    print(userinfo, flush=True)

    # Store the user information in flask session.
    session['jwt_payload'] = userinfo
    #useful keys: nickname, name, picture
    session['profile'] = {
        'user_id': userinfo['sub'],
        'name': userinfo['name'],
        'picture': userinfo['picture']
    }

    if userinfo['http://dribbbl.io/is_new']: #new user rooute, TODO
        #db.add_user(userinfo['sub'], userinfo['name'])
        #return redirect(url_for("profile_page"))
        return redirect(url_for("landing_page"))
    else:
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
    return render_template('landing.html',  userinfo=userInfo)

@app.route('/user/<user_id>', methods=['GET'])
def profile_page(user_id):
    username = db.get_username(user_id)
    return render_template("profile.html", name=username)

@app.route('/search')
def search_page():
    return render_template("search.html")