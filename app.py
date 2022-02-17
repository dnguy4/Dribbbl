from flask import Flask, render_template, request

app = Flask(__name__)

@app.route('/')
def landing_page():
    return render_template('landing.html')