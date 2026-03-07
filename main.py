import requests

import os

from flask import Flask,render_template,request,redirect

import utils

app = Flask(__name__)



@app.route('/')
def start():
    context = {
        'information': utils.get_all_portfolios()
    }
    return render_template("all_portfolios.html", **context)



@app.route('/new_portfolio', methods=['GET','POST'])
def new_portfolio():
    if request.method == 'POST':
        name = request.form.get('name')
        bio = request.form.get('bio')
        github = request.form.get('git')

        image = request.files.get('image')

        if image and image.filename:
            os.makedirs("static/uploads", exist_ok=True)

            save_path = os.path.join("static/uploads", image.filename)
            image.save(save_path)

            avatar_filename = f"uploads/{image.filename}"
        else:
            avatar_filename = "placeholder.png"

        new_user_2 = utils.new_user(
            name=name,
            bio=bio,
            github=github,
            avatar=avatar_filename
        )
        print("Saved avatar:", avatar_filename)
        return redirect(f'/portfolio/{new_user_2}')

    return render_template('form.html')



@app.route('/portfolio/<int:uuid>')
def portfolio_page(uuid):
    info = utils.get_portfolio_by_uuid(uuid)


    if info is None:
        print('none in main')
        return "Portfolio not found", 404





    github = info["github"]
    gitprojects = get_user_repos(github)

    uuid,name,bio,github,telegram,avatar,skills = info.values()


    return render_template(
        'portfolio_template.html',

        users_name=name,
        users_bio=bio,
        projects=gitprojects
    )


def get_user_repos(github):
    url = f"https://api.github.com/users/{github}/repos"

    try:
        response = requests.get(
            url,
            headers={"Accept": "application/vnd.github.v3+json"},
            timeout=10
        )


        if response.status_code != 200:
            raise Exception(f"Request failed with status code {response.status_code}")

        repos = response.json()

        result = []


        for repo in repos[:6]:
            result.append({
                "title": repo.get("name"),
                "description": repo.get("description") or "No description",
                "link": repo.get("html_url")
            })

        return result

    except requests.exceptions.RequestException as e:
        print("Network error:", e)
    except Exception as e:
        print("Error:", e)

    return []





if __name__ == "__main__":
    app.run(debug=True)