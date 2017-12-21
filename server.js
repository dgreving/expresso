const bodyParser = require('body-parser');
const errorhandler = require('errorhandler');
const morgan = require('morgan');
const express = require('express');

const apiRouter = require('./api/api');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(bodyParser.json());
//app.use(morgan('dev'));

app.use('/api', apiRouter);

app.use(errorhandler());

app.listen(PORT, () => {
  console.log('listening on port: ' + PORT);
});

module.exports = app
