
var id = undefined,
	username = undefined,
	created = undefined,
	balance = undefined,
	fuel_reserve = undefined,
	password = undefined,
	error_channel = undefined,
	starting_fleet = undefined,
	symbol = undefined,
	rgb = undefined;

var planetsModel = undefined;
var shipsModel = undefined;

var constructor = function (pg) {
	client.query("SELECT * from my_player", function(err, result){
   
        if (!err){
            console.log("Row count: %d", result.rows.length);
           
            if(result.rows.length > 0){
            	console.log(result.rows[i].balance);
            	id             = result.rows[0].id;
            	username       = result.rows[0].created;
            	created        = result.rows[0].created;
            	balance        = result.rows[0].balance;
            	fuel_reserve   = result.rows[0].fuel_reserve;
            	password       = result.rows[0].password;
            	error_channel  = result.rows[0].error_channel;
            	starting_fleet = result.rows[0].starting_fleet;
            	symbol         = result.rows[0].symbol;
            	rgb            = result.rows[0].rgb;
            }


               
        } else {
            console.log(err);
        }                      
    });
}

exports.constructor = constructor;