var express = require('express'),
subtract = require('./lib/subtract'),
app = express();

app.get('/add', require('./routes/add'));
app.get('/subtract', require('./routes/subtract'));

app.listen(3000, function(){
  console.log('App is now listening');
});
module.exports = app;
