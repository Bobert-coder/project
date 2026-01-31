import sqlite3

import utils


connection = sqlite3.connect('portfolios.db')
cursor = connection.cursor()

def create_database():
    cursor.execute('DROP TABLE IF EXISTS portfolios')
    cursor.execute(
        """CREATE TABLE portfolios(
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
utils.new_user(123,'Alex')
utils.new_user(124,'Bob', skills='python')