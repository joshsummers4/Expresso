const express = require('express');
const employeesRouter = express.Router();
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const timesheetsRouter = require('./timesheets.js');

//employeesid param
employeesRouter.param('employeeId', (req, res, next, employeeId) => {
    db.get("SELECT * FROM Employee WHERE Employee.id = $employeeId", 
        {
            $employeeId: employeeId
        },
        (error, row) => {
            if(error){
                next(error);
            } else if (row) {
                req.employee = row;
                next();
            } else {
                res.sendStatus(404);
            }
        }
    );
});

employeesRouter.use('/:employeeId/timesheets', timesheetsRouter);

//get method for an employee with supplied id 
employeesRouter.get('/:employeeId', (req, res, next) => {
    res.status(200).json({employee: req.employee});
});

//get route for all current employees
employeesRouter.get('/', (req, res, next) => {
    db.all("SELECT * FROM Employee WHERE is_current_employee = 1", (error, rows) => {
        if(error){
            next(error);
        } else {
            res.status(200).json({employees: rows});
        }
    });
});

//post method to add new employee to the table
employeesRouter.post('/', (req, res, next) => {
    const employee = req.body.employee;
    const isEmployed = employee.isCurrentEmployee === 0 ? 0 : 1;
    if(!employee.name || !employee.position || !employee.wage){
        return res.sendStatus(400);
    }
    db.run("INSERT INTO Employee (name, position, wage, is_current_employee) " +
        "VALUES ($name, $position, $wage, $employed)",
        {
            $name: employee.name,
            $position: employee.position,
            $wage: employee.wage,
            $employed: isEmployed
        }, 
        function(error) {
            if(error){
                next(error);
            } else {
                db.get(`SELECT * FROM Employee WHERE Employee.id = ${this.lastID}`, (error, row) => {
                    res.status(201).json({employee: row});
                });
            }
        }
    );
});

//put method to update employee
employeesRouter.put('/:employeeId', (req, res, next) => {
    const employee = req.body.employee;
    const isEmployed = employee.isCurrentEmployee === 0 ? 0 : 1;
    if(!employee.name || !employee.position || !employee.wage){
        return res.sendStatus(400);
    }
    db.run("UPDATE Employee SET name = $name, position = $position, wage = $wage, is_current_employee = $employed WHERE Employee.id = $id",
        {
            $name: employee.name,
            $position: employee.position,
            $wage: employee.wage,
            $employed: isEmployed,
            $id: req.params.employeeId
        }, 
        function(error) {
            if(error){
                next(error);
            } else {
                db.get(`SELECT * FROM Employee WHERE Employee.id = ${req.params.employeeId}`, (error, row) => {
                    res.status(200).json({employee: row});
                });
            }
        }
    );
});

//delete method that updates the employee to unemployed
employeesRouter.delete('/:employeeId', (req, res, next) => {
    db.run("UPDATE Employee SET is_current_employee = 0 WHERE Employee.id = $id", 
        { 
            $id: req.params.employeeId 
        }, 
        (error) => {
            if(error){
                 next(error);
            } else {
                db.get(`SELECT * FROM Employee WHERE Employee.id = ${req.params.employeeId}`, (error, row) => {
                    res.status(200).json({employee: row});
                });
            }
        }
    );
});

module.exports = employeesRouter;