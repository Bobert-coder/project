import sqlite3




connection = sqlite3.connect(
    'portfolios.db',
    check_same_thread=False
)
connection.row_factory = sqlite3.Row

cursor = connection.cursor()


def new_user(uuid = None,name=None,
             bio=None,github=None,
             avatar=None
             ):

    cursor.execute("""
    INSERT INTO portfolios
    ( uuid, name, bio, github, avatar) 
    VALUES (?,?,?,?,?)""",
            ( uuid, name, bio, github, avatar))
    connection.commit()

    return  cursor.lastrowid


def get_all_portfolios():
    cursor.execute('''
     SELECT * FROM portfolios
    ''')
    portfolios = cursor.fetchall()
    print([dict(item) for item in portfolios])
    print(portfolios)
    return [dict(item) for item in portfolios]

def get_portfolio_by_uuid(uuid):
    cursor.execute('SELECT * FROM portfolios where uuid = ?', (uuid,))
    portfolio = cursor.fetchone()
    print(portfolio)


    return dict(portfolio) if portfolio else None

