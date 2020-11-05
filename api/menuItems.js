const express = require('express');
const menuItemsRouter = express.Router({mergeParams: true});
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

//params for menuItemId
menuItemsRouter.param('menuItemId', (req, res, next, menuItemId) => {
    db.get("SELECT * FROM MenuItem WHERE MenuItem.id = $id", 
        {
            $id: menuItemId
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

//get method to rerieve all items from a given menu
menuItemsRouter.get('/', (req, res, next) => {
    db.all(`SELECT * FROM MenuItem WHERE menu_id = ${req.params.menuId}`, (error, rows) => {
        if(error){
            next(error)
        } else {
            res.status(200).json({menuItems: rows})
        }
    });
});

//post method to create new menu item
menuItemsRouter.post('/', (req, res, next) => {
    const menuItem = req.body.menuItem;
    if(!menuItem.name || !menuItem.inventory || !menuItem.price){
        return res.sendStatus(400);
    }
    db.run("INSERT INTO MenuItem (name, description, inventory, price, menu_id) " +
        "VALUES ($name, $description, $inventory, $price, $menuId)",
        {
            $name: menuItem.name,
            $description: menuItem.description, 
            $inventory: menuItem.inventory, 
            $price: menuItem.price, 
            $menuId: req.params.menuId
        }, 
        function(error) {
            if(error){
                next(error);
            } else {
                db.get(`SELECT * FROM MenuItem WHERE MenuItem.id = ${this.lastID}`, (error, row) => {
                    res.status(201).json({menuItem: row});
                });
            }
        }
    )  
});

//put method for updating a menu item by id
menuItemsRouter.put('/:menuItemId', (req, res, next) => {
    const menuItem = req.body.menuItem;
    if(!menuItem.name || !menuItem.inventory || !menuItem.price){
        return res.sendStatus(400);
    }
    db.run("UPDATE MenuItem SET name = $name, description = $description, inventory = $inventory, price = $price, menu_id = $menuId WHERE MenuItem.id = $id",
        {
            $id: req.params.menuItemId,
            $name: menuItem.name,
            $description: menuItem.description, 
            $inventory: menuItem.inventory, 
            $price: menuItem.price, 
            $menuId: req.params.menuId
        }, 
        function(error) {
            if(error){
                next(error);
            } else {
                db.get(`SELECT * FROM MenuItem WHERE MenuItem.id = ${req.params.menuItemId}`, (error, row) => {
                    res.status(200).json({menuItem: row});
                });
            }
        }
    );  
});

//delete method for removing a menu item by id
menuItemsRouter.delete('/:menuItemId', (req, res, next) => {
    const menuItemId = req.params.menuItemId;
    db.run(`DELETE FROM MenuItem WHERE MenuItem.id = ${menuItemId}`, (error) => {
        if(error){
            next(error);
        } else {
            res.sendStatus(204);
        }
    });
});

module.exports = menuItemsRouter;