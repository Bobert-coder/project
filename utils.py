import sqlite3
import init_db
connection = sqlite3.connect('portfolios.db')
cursor = connection.cursor()
def new_user(uuid=None,name=None,bio=None,github=None,telegram=None,avatar=None,skills=None):
    cursor.execute("""INSERT INTO portfolio(uuid,name,bio,github,telegram,avatar,skills) VALUES 
    (?,?,?,?,?,?,?)""",
            (uuid, name, bio, github, telegram, avatar, skills))
    connection.commit()

def get_all_profiles():
    cursor.execute('''
     SELECT * FROM portfolios;
    '''
    )

print(get_all_profiles())