
var client = undefined;
var user = undefined;

var PlanetModel = require('./../models/planet');

var constructor = function (c, u) {
	client = c;
    user = u;

    //private variables
    var planets = [];

    //public methods
    this.get_planets = function(){console.log(planets)
        return planets;
    };

    //constructor
    (require('./../models/ships')).setClient(client);

	// Get user planets
	client.query("SELECT * FROM planets WHERE conqueror_id=GET_PLAYER_ID(SESSION_USER);", function(err, result){
   
        if (!err){
            console.log("Planets count: %d", result.rows.length);
           
            if(result.rows.length > 0){
            	for(var i = 0; i < result.rows.length; i++){
            		planets.push(new PlanetModel.constructor(
                        client,
                        {
                			id: result.rows[i].id,
                			name: result.rows[i].name,
                			mine_limit: result.rows[i].mine_limit,
                			location_x: result.rows[i].location_x,
                			location_y: result.rows[i].location_y,
                			conqueror_id: result.rows[i].conqueror_id,
                			location: result.rows[i].location
                        },
                        user
                    ));
            	}

            }else{
            	throw 'You lose';
            }

        } else {
            console.log(err);
        }                      
    });
}

exports.constructor = constructor;