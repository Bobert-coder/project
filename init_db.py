import sqlite3




connection = sqlite3.connect('portfolios.db')
cursor = connection.cursor()

def create_database():
    cursor.execute('DROP TABLE IF EXISTS portfolios')
    cursor.execute(
        """CREATE TABLE portfolios(
        
        uuid INTEGER PRIMARY KEY AUTOINCREMENT ,
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
