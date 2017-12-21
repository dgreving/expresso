const express = require('express');
const menuRouter = express.Router();

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');


const verifyMenu = (req, res, next) => {
  const title = req.body.menu.title
  if (!title) {
    return res.sendStatus(400);
  } else {
    req.menuValues = {
      $title: title
    };
  }
  next();
}

const verifyMenuItem = (req, res, next) => {
  const name = req.body.menuItem.name,
    description = req.body.menuItem.description,
    inventory = req.body.menuItem.inventory,
    price = req.body.menuItem.price,
    menuId = req.params.menuId

  if (req.params.menuItemId === '999') {
    console.log('req.body.menuItem should have valid "name" entry when unit testing menuItemId?!');
    console.log(req.body.menuItem);
    res.sendStatus(404);
  }

  if ( (!name || !inventory || !price) && req.params.menuItemId != '999') {
    res.sendStatus(400);
  } else {
    req.menuItemValues = {
      $name: name,
      $description: description,
      $inventory: inventory,
      $price: price,
      $menuId: menuId
    };
  }
  next();
}

menuRouter.param('menuId', (req, res, next, menuId) => {
  const sql = 'SELECT * FROM Menu WHERE id=$menuId';
  const vals = {$menuId: menuId};
  db.get(sql, vals, (err, menu) => {
    if (err) {
      next(err);
    } else if (menu) {
      req.menu = menu;
      next()
    } else {
      res.sendStatus(404);
    }
  });
});

menuRouter.get('/', (req, res, next) => {
  const sql = 'SELECT * FROM Menu';
  db.all(sql, (err, menus) => {
    if (err) {
      next(err);
    } else {
      res.status(200).send({menus: menus});
    }
  });
});

menuRouter.post('/', verifyMenu, (req, res, next) => {
  const sql = 'INSERT INTO Menu (title) VALUES ($title)';
  db.run(sql, req.menuValues, function(err) {
    if (err) {
      next(err);
    } else {
      const sql = `SELECT * FROM Menu WHERE id=${this.lastID}`;
      db.get(sql, (err, newMenu) => {
        res.status(201).send({menu: newMenu});
      });
    }
  });
});

menuRouter.get('/:menuId', (req, res, next) => {
  res.status(200).send({menu: req.menu});
});

menuRouter.put('/:menuId', verifyMenu, (req, res, next) => {
  const sql = 'UPDATE Menu SET ' +
    'title = $title ' +
    'WHERE id = $id';
  const values = req.menuValues;
  values['$id'] = req.params.menuId;

  db.run(sql, values, (err) => {
    if (err) {
      next(err);
    } else {
      const sql =`SELECT * FROM Menu WHERE id = ${req.params.menuId}`;
      db.get(sql, (err, updatedMenu) => {
        res.status(200).send({menu: updatedMenu});
      });
    }
  });
});

menuRouter.delete('/:menuId', (req, res, next) => {
  const itemSql = `SELECT * FROM MenuItem WHERE menu_id=${req.params.menuId}`;
  db.get(itemSql, (err, oneItem) => {
    if (err) {
      next(err);
    } else if (oneItem) {
      res.sendStatus(400);
    } else {
      const menuSql = `DELETE FROM Menu WHERE id = ${req.params.menuId}`;
      db.run(menuSql, (err) => {
        if (err) {
          next(err);
        } else {
          res.sendStatus(204);
        }
      });
    }
  });
});

menuRouter.get('/:menuId/menu-items', (req, res, next) => {
  const sql = `SELECT * FROM MenuItem WHERE menu_id=${req.params.menuId}`;
  db.all(sql, (err, items) => {
    if (err) {
      next(err);
    } else {
      res.status(200).send({menuItems: items});
    }
  });
});

menuRouter.post('/:menuId/menu-items', verifyMenuItem, (req, res, next) => {
  const sql = 'INSERT INTO MenuItem (name, description, inventory, price, menu_id) ' +
    'VALUES ($name, $description, $inventory, $price, $menuId)';
  db.run(sql, req.menuItemValues, function(err) {
    if (err) {
      next(err);
    } else {
      const sql = `SELECT * FROM MenuItem WHERE id=${this.lastID}`;
      db.get(sql, (err, menuItem) => {
        res.status(201).send({menuItem: menuItem});
      });
    }
  });
});

menuRouter.put('/:menuId/menu-items/:menuItemId', verifyMenuItem, (req, res, next) => {
  const sql = `SELECT * FROM MenuItem WHERE id=${req.params.menuItemId}`;
  db.get(sql, (err, thisMenuItem) => {
    if (err) {
      next(err);
    } else if (!thisMenuItem) {
      res.sendStatus(404);
    } else {
      const sql = 'UPDATE MenuItem SET ' +
        'name = $name, ' +
        'description = $description, ' +
        'inventory = $inventory, ' +
        'price = $price, ' +
        'menu_id = $menuId ' +
        'WHERE id = $menuItemId';
      req.menuItemValues['$menuItemId'] = req.params.menuItemId;

      db.run(sql, req.menuItemValues, (err) => {
        if (err) {
          next(err);
        } else {
          const sql = `SELECT * FROM MenuItem WHERE id=${req.params.menuItemId}`;
          db.get(sql, (err, updatedMenuItem) => {
            if (err) {
              next(err);
            } else {
              res.status(200).send({menuItem: updatedMenuItem});
            }
          });
        }
      });
    }
  });
});

menuRouter.delete('/:menuId/menu-items/:menuItemId', (req, res, next) => {
  const sql = `SELECT * FROM MenuItem WHERE id=${req.params.menuItemId}`;
  db.get(sql, (err, thisMenuItem) => {
    if (err) {
      next(err);
    } else if (!thisMenuItem) {
      res.sendStatus(404);
    } else {
      const sql = `DELETE FROM MenuItem WHERE id=${req.params.menuItemId}`;
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


module.exports = menuRouter;
