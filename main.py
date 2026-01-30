from flask import Flask,render_template
import utils
app = Flask(__name__)

@app.route('/')
def start():
    context = {
        'information':utils.new_user(123,'Alex')
    }
    return render_template("all_portfolios.html",**context)

if __name__ == "__main__":
    app.run(debug=True)