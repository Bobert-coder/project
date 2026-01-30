import sqlite3
connection = sqlite3.connect('portfolios.db')
cursor = connection.cursor()
def new_user(uuid=None,name=None,bio=None,github=None,telegram=None,avatar=None,skills=None):
    cursor.execute("""INSERT INTO portfolios(uuid,name,bio,github,telegram,avatar,skills) VALUES 
    (?,?,?,?,?,?,?)""",
            (uuid, name, bio, github, telegram, avatar, skills))
    connection.commit()