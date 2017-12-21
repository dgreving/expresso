const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./database.sqlite')

db.serialize(() => {
  db.run('DROP TABLE IF EXISTS Employee', err => {
    if (err) {
      console.log(err);
    }
  });

  db.run('CREATE TABLE Employee ( ' +
          'id INTEGER PRIMARY KEY, ' +
          'name TEXT NOT NULL, ' +
          'position TEXT NOT NULL, ' +
          'wage INTEGER NOT NULL, ' +
          'is_current_employee INTEGER NOT NULL DEFAULT 1 )', err => {
            if (err) {
              console.log(err);
            }
          });

  db.run('DROP TABLE IF EXISTS Timesheet', err => {
    if (err) {
      console.log(err);
    }
  });

  db.run('CREATE TABLE Timesheet (' +
          'id INTEGER PRIMARY KEY, ' +
          'hours INTEGER NOT NULL, ' +
          'rate INTEGER NOT NULL, ' +
          'date INTEGER NOT NULL, ' +
          'employee_id INTEGER NOT NULL, ' +
          'FOREIGN KEY(employee_id) REFERENCES Employee(id) )', err=> {
            if (err) {
              console.log(err);
            }
          });

  db.run('DROP TABLE IF EXISTS Menu', err => {
    console.log(err);
  });

  db.run('CREATE TABLE Menu (' +
          'id INTEGER PRIMARY KEY, ' +
          'title TEXT NOT NULL)', err => {
            if (err) {
              console.log(err);
            }
          });
  db.run('DROP TABLE IF EXISTS MenuItem', err => {
    console.log(err);
  });

  db.run('CREATE TABLE MenuItem (' +
          'id INTEGER PRIMARY KEY, ' +
          'name TEXT NOT NULL, ' +
          'description TEXT, ' +
          'inventory INTEGER NOT NULL, ' +
          'price INTEGER NOT NULL, ' +
          'menu_id INTEGER NOT NULL, ' +
          'FOREIGN KEY(menu_id) REFERENCES Menu(id) )', err => {
            if (err) {
              console.log(err);
            }
          });
});
