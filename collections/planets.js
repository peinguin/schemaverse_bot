
var client = undefined;
var user = undefined;

var PlanetModel = require('./../models/planet');

module.exports = exports = function (c, u) {
	client = c;
    user = u;

    //private variables
    var planets = [];

    //public methods
    this.get_planets = function(){
        return planets;
    };

    //find_planets
    this.find_planets = function(x1, x2, y1, y2, count, callback){
        client.query(
            "SELECT \
                location_x, \
                location_y, \
                id, \
                conqueror_id = get_player_id(SESSION_USER) own \
            FROM ( \
                    SELECT \
                        * \
                    FROM planets \
                    WHERE \
                        location_x > $1 AND location_x < $2 AND location_y > $3 AND location_y < $4 \
                    ORDER BY location_x desc, location_y desc\
                ) ordered \
            ORDER BY RANDOM() \
            limit $5",
            [x1, x2, y1, y2, count],
            function(err, result){
                if (!err){
                    callback(result.rows);
                }else{
                    throw err;
                }
            }
        );
    };

    this.add = function(id){
        client.query(
            "SELECT *, conqueror_id = get_player_id(SESSION_USER) own \
            FROM planets \
            WHERE id = $1",
            [id],
            function(err, result){
                if (!err){
                    if(result.rowCount > 0){
                        if(result.rows[0].own){
                            planets.push(new PlanetModel(
                                client,
                                {
                                    id: result.rows[0].id,
                                    name: result.rows[0].name,
                                    mine_limit: result.rows[0].mine_limit,
                                    location_x: result.rows[0].location_x,
                                    location_y: result.rows[0].location_y,
                                    conqueror_id: result.rows[0].conqueror_id,
                                    location: result.rows[0].location
                                },
                                user
                            ));
                        }
                    }
                }else{
                    throw err;
                }
            }
        );
    };

    //constructor
    (require('./../models/ships')).setClient(client);

	// Get user planets
	client.query("SELECT * FROM planets WHERE conqueror_id=GET_PLAYER_ID(SESSION_USER);", function(err, result){
   
        if (!err){
            console.log("Planets count: %d", result.rows.length);
           
            if(result.rows.length > 0){
            	for(var i = 0; i < result.rows.length; i++){
            		planets.push(new PlanetModel(
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