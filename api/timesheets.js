const express = require('express');
const timesheetsRouter = express.Router({mergeParams: true});
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

//timesheets param for id
timesheetsRouter.param('timesheetId', (req, res, next, timesheetId) => {
    db.get("SELECT * FROM Timesheet WHERE Timesheet.id = $timesheetId", 
        {
            $timesheetId: timesheetId
        },
        (error, row) => {
            if(error){
                next(error);
            } else if (row) {
                next();
            } else {
                res.sendStatus(404);
            }
        }
    );
});

//get route for all current employees
timesheetsRouter.get('/', (req, res, next) => {
    db.all(`SELECT * FROM Timesheet WHERE employee_id = ${req.params.employeeId}`, (error, rows) => {
        if(error){
            next(error);
        } else {
            res.status(200).json({timesheets: rows});
        }
    });
});

//post method to add new timesheet to the table
timesheetsRouter.post('/', (req, res, next) => {
    const timesheet = req.body.timesheet;
    if(!timesheet.hours || !timesheet.rate || !timesheet.date){
        return res.sendStatus(400);
    }
    db.run("INSERT INTO Timesheet (hours, rate, date, employee_id) " +
        "VALUES ($hours, $rate, $date, $employeeId)",
        {
            $hours: timesheet.hours,
            $rate: timesheet.rate,
            $date: timesheet.date,
            $employeeId: req.params.employeeId
        }, 
        function(error) {
            if(error){
                next(error);
            } else {
                db.get(`SELECT * FROM Timesheet WHERE Timesheet.id = ${this.lastID}`, (error, row) => {
                    res.status(201).json({timesheet: row});
                });
            }
        }
    );
});

//put method to update the timesheet with timesheetId
timesheetsRouter.put('/:timesheetId', (req, res, next) => {
    const timesheet = req.body.timesheet;
    if(!timesheet.hours || !timesheet.rate || !timesheet.date){
        return res.sendStatus(400);
    }
    db.run("UPDATE Timesheet SET hours = $hours, rate = $rate, date = $date, employee_id = $employeeId WHERE Timesheet.id = $id",
        {
            $id: req.params.timesheetId,
            $hours: timesheet.hours,
            $rate: timesheet.rate,
            $date: timesheet.date,
            $employeeId: req.params.employeeId
        }, 
        (error) => {
            if(error){
                next(error);
            } else {
                db.get(`SELECT * FROM Timesheet WHERE Timesheet.id = ${req.params.timesheetId}`, (error, row) => {
                    res.status(200).json({timesheet: row});
                });
            }
        }
    );
});

//Delete method for deleting a specific timesheet
timesheetsRouter.delete('/:timesheetId', (req, res, next) => {
    const timesheetId = req.params.timesheetId;
    db.run(`DELETE FROM Timesheet WHERE Timesheet.id = ${timesheetId}`, (error) => {
        if(error){
            next(error);
        } else {
            res.sendStatus(204);
        }
    });
});


module.exports = timesheetsRouter;