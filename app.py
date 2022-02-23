import json
from os import environ as env

from flask import Flask, render_template, request, g, redirect, url_for, jsonify, send_file, session
from authlib.integrations.flask_client import OAuth

import db

app = Flask(__name__)
app.secret_key = "can be anything, just random"
oauth = OAuth(app)

auth0clientid = env["client_id"]
auth0clientsecret = env["client_secret"]
auth0domain = env["auth0_domain"]

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

    # Store the user information in flask session.
    session['jwt_payload'] = userinfo
    session['profile'] = {
        'user_id': userinfo['sub'],
        'name': userinfo['name'],
        'picture': userinfo['picture']
    }
    return redirect(url_for("home"))


@app.route("/login")
def login():
      return auth0.authorize_redirect(redirect_uri=url_for("callback_handling", _external=True))

###### Routes ######

@app.route('/')
def landing_page():
    return render_template('landing.html')