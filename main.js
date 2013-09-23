
var config = require('./config.js');

// Postgres connection
var pg = require('pg'),
    conn = "pg://"+config.username+":"+config.password+"@db.schemaverse.com:5432/schemaverse";

var UserModel = require('./models/user');
var CommandProcessor = require('./command_processor');
       
pg.connect(conn, function(err, client) {
    if (!err){
        var userModel = new UserModel.constructor(client);
        CommandProcessor(userModel);
    } else {
        console.log(err);
    }
});