const express = require('express');
const menuRouter = express.Router();
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const menuItemsRouter = require('./menuItems.js');

//menu param for menu id
menuRouter.param('menuId', (req, res, next, menuId) => {
    db.get("SELECT * FROM Menu WHERE Menu.id = $menuId", 
        {
            $menuId: menuId
        },
        (error, row) => {
            if(error){
                next(error);
            } else if (row) {
                req.menu = row;
                next();
            } else {
                res.sendStatus(404);
            }
        }
    );
});

menuRouter.use('/:menuId/menu-items', menuItemsRouter);

//get method for menu with menuId
menuRouter.get('/:menuId', (req, res, next) => {
    res.status(200).json({menu: req.menu});
});

//get method to retrieve all menus
menuRouter.get('/', (req, res, next) => {
    db.all("SELECT * FROM Menu", (error, rows) => {
        if(error){
            next(error);
        } else {
            res.status(200).json({menus: rows});
        }
    });
});

//post method to add new menu 
menuRouter.post('/', (req, res, next) => {
    const menu = req.body.menu;
    if(!menu.title) {
        return res.sendStatus(400);
    }
    db.run("INSERT INTO Menu (title) VALUES ($title)",
        {
            $title: menu.title
        }, 
        function(error) {
            if(error) {
                next(error);
            } else {
                db.get(`SELECT * FROM Menu WHERE Menu.id = ${this.lastID}`, (error, row) => {
                    res.status(201).json({menu: row});
                });
            }
        }
    );
});

//put method for update a menu by id 
menuRouter.put('/:menuId', (req, res, next) => {
    const menu = req.body.menu;
    if(!menu.title) {
        return res.sendStatus(400);
    }
    db.run("UPDATE Menu SET title = $title WHERE Menu.id = $id",
        {
            $title: menu.title,
            $id: req.params.menuId
        }, 
        function(error) {
            if(error) {
                next(error);
            } else {
                db.get(`SELECT * FROM Menu WHERE Menu.id = ${req.params.menuId}`, (error, row) => {
                    res.status(200).json({menu: row});
                });
            }
        }
    );
});

//delete method to delete a menu by id
menuRouter.delete('/:menuId', (req, res, next) => {
    const menuId = req.params.menuId;
    db.get(`SELECT * FROM MenuItem WHERE MenuItem.menu_id = ${menuId}`, (error, rows) => {
        if (error) {
            next(error);
        } else if (rows) {
            return res.sendStatus(400);
        } else {
            db.run(`DELETE FROM Menu WHERE Menu.id = ${menuId}`, (error) => {
                if (error) {
                    next(error);
                } else {
                    res.sendStatus(204);
                }
            });
        }
    });
});



module.exports = menuRouter;