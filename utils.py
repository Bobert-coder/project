import sqlite3

connection = sqlite3.connect(
    'portfolios.db',
    check_same_thread = False
)

cursor = connection.cursor()
cursor.row_factory = sqlite3.Row

def new_user(uuid=None,name=None,
             bio=None,github=None,
             telegram=None,avatar=None,
             skills=None):
    cursor.execute("""
    INSERT INTO portfolios
    (uuid, name, bio, github, telegram, avatar, skills) 
    VALUES (?,?,?,?,?,?,?)""",
            (uuid, name, bio, github, telegram, avatar, skills))
    connection.commit()

def get_all_portfolios():
    cursor.execute('''
     SELECT * FROM portfolios
    ''')
    portfolios = cursor.fetchall()
    return [dict(item) for item in portfolios]

