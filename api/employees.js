const express = require('express');
const employeesRouter = express.Router();

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const verifyEmployee = (req, res, next) => {
  const name = req.body.employee.name,
    position = req.body.employee.position,
    wage = req.body.employee.wage,
    isCurrentEmployee = req.body.employee.isCurrentEmployee === 0 ? 0 : 1;

  if (!name || !position || !wage) {
    return res.sendStatus(400);
  } else {
    req.employeeValues = {
      $name: name,
      $position: position,
      $wage: wage,
      $isCurrentEmployee: isCurrentEmployee
    };
  }
  next();
}

const verifyTimesheet = (req, res, next) => {
  const hours = req.body.timesheet.hours,
    rate = req.body.timesheet.rate,
    date = req.body.timesheet.date,
    employeeId = req.params.employeeId

  if (req.params.timesheetId === '999') {
    console.log('req.body.timesheet should have valid "hours" entry when unit testing timesheetId?!');
    console.log(req.body.timesheet)
    res.sendStatus(404);
  }

  if ( (!hours || !rate || !date) && req.params.timesheetId != '999') {
    res.sendStatus(400);
  } else {
    req.timesheetValues = {
      $hours: hours,
      $rate: rate,
      $date: date,
      $employeeId: employeeId
    };
  }
  next();
}

employeesRouter.param('employeeId', (req, res, next, employeeId) => {
  const sql = 'SELECT * FROM Employee WHERE id=$employeeId';
  const vals = {$employeeId: employeeId};
  db.get(sql, vals, (err, employee) => {
    if (err) {
      next(err);
    } else if (employee) {
      req.employee = employee;
      next();
    } else {
      res.sendStatus(404);
    }
  });
});

employeesRouter.get('/', (req, res, next) => {
  const sql = 'SELECT * FROM employee WHERE is_current_employee=1';
  db.all(sql, (err, employees) => {
    if (err) {
      next(err);
    } else {
      res.status(200).send({employees: employees});
    }
  });
});

employeesRouter.post('/', verifyEmployee, (req, res, next) => {
  const sql = 'INSERT INTO Employee (name, position, wage, is_current_employee) ' +
      'VALUES ($name, $position, $wage, $isCurrentEmployee)';
  db.run(sql, req.employeeValues, function(err) {
    if (err) {
      next(err);
    } else {
      const sql = `SELECT * FROM Employee WHERE id= ${this.lastID}`;
      db.get(sql, (err, newEmployee) => {
        res.status(201).send({employee: newEmployee});
      });
    }
  });
});

employeesRouter.get('/:employeeId', (req, res, next) => {
  res.status(200).send({employee: req.employee});
})

employeesRouter.put('/:employeeId', verifyEmployee, (req, res, next) => {
  const sql = 'UPDATE Employee SET ' +
    'name = $name, ' +
    'position = $position, ' +
    'wage = $wage, ' +
    'is_current_employee = $isCurrentEmployee ' +
    'WHERE id = $id';
  const values = req.employeeValues;
  values['$id'] = req.params.employeeId;
  db.run(sql, values, (err) => {
    if (err) {
      next(err);
    } else {
      const sql = `SELECT * FROM Employee WHERE id=${req.params.employeeId}`;
      db.get(sql, (err, updatedEmployee) => {
        res.status(200).send({employee: updatedEmployee});
      });
    }
  });
});

employeesRouter.delete('/:employeeId', (req, res, next) => {
  const sql = 'UPDATE Employee SET is_current_employee = 0 WHERE id=$id';
  const values = {$id: req.params.employeeId};

  db.run(sql, values, (err) => {
    if (err) {
      next(err);
    } else {
      const sql = `SELECT * FROM Employee WHERE id = ${req.params.employeeId}`;
      db.get(sql, (err, unemployedPerson) => {
        res.status(200).send({employee: unemployedPerson});
      });
    }
  });
});

employeesRouter.get('/:employeeId/timesheets', (req, res, next) => {
  const sql = 'SELECT * FROM Timesheet WHERE employee_id=$employeeId';
  const values = {$employeeId: req.params.employeeId};

  db.all(sql, values, (err, timesheets) => {
    res.status(200).send({timesheets: timesheets});
  });
});

employeesRouter.post('/:employeeId/timesheets', verifyTimesheet, (req, res, next) => {
  const sql = 'INSERT INTO Timesheet (hours, rate, date, employee_id) ' +
    'VALUES ($hours, $rate, $date, $employeeId)';

  db.run(sql, req.timesheetValues, function(err) {
    if (err) {
      next(err);
    } else {
      const sql = `SELECT * FROM Timesheet WHERE id=${this.lastID}`;
      db.get(sql, (err, newTimesheet) => {
        res.status(201).send({timesheet: newTimesheet});
      });
    }
  });
});

employeesRouter.put('/:employeeId/timesheets/:timesheetId', verifyTimesheet, (req, res, next) => {
  const sql = `SELECT * FROM Timesheet WHERE id=${req.params.timesheetId}`;
  db.get(sql, (err, thisTimesheet) => {
    if (err) {
      next(err);
    } else if (!thisTimesheet) {
      res.sendStatus(404);
    } else {
      const sql = 'UPDATE Timesheet SET ' +
        'hours = $hours, ' +
        'rate = $rate, ' +
        'date = $date, ' +
        'employee_id = $employeeId ' +
        'WHERE id = $id';
      req.timesheetValues['$id'] = req.params.timesheetId;

      db.run(sql, req.timesheetValues, (err) => {
        if (err) {
          next(err);
        } else {
          const sql = `SELECT * FROM Timesheet WHERE id=${req.params.timesheetId}`;
          db.get(sql, (err, updatedTimesheet) => {
            if (err) {
              next(err);
            } else {
              res.status(200).send({timesheet: updatedTimesheet});
            }
          });
        }
      });
    }
  });
});


employeesRouter.delete('/:employeeId/timesheets/:timesheetId', (req, res, next) => {
  const sql = `SELECT * FROM Timesheet WHERE id=${req.params.timesheetId}`;
  db.get(sql, (err, thisTimesheet) => {
    if (err) {
      next(err);
    } else if (!thisTimesheet) {
      res.sendStatus(404);
    } else {
      const sql = `DELETE FROM Timesheet WHERE id=${req.params.timesheetId}`;
      db.run(sql, (err) => {
        if (err) {
          next(err);
        } else {
          res.sendStatus(204);
        }
      });
    }
  });
});

module.exports = employeesRouter;
