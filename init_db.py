import sqlite3
import utils
from utils import new_user

connection = sqlite3.connect('portfolios.db')
cursor = connection.cursor()
def create_database():
    cursor.execute('DROP TABLE IF EXISTS portfolio')
    cursor.execute(
        """CREATE TABLE portfolio(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT ,
        name TEXT ,
        bio TEXT  ,
        github TEXT,
        telegram TEXT,
        avatar TEXT,
        skills TEXT
        )
        """
    )

create_database()
new_user(123,'Alex')
new_user(124,'Bob',skills= 'python')