
var config = require('./config.js');

// Postgres connection
var pg = require('pg'),
    conn = "pg://"+config.username+":"+config.password+"@db.schemaverse.com:5432/schemaverse";

var UserModel = require('./models/user');
       
pg.connect(conn, function(err, client) {
    if (!err){
        var userModel = new UserModel.constructor(client);
    } else {
        console.log(err);
    }
});