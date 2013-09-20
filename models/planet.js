
var client = undefined;
var user = undefined;

var attackers_per_planet = 50;

var ShipsModel = require('./ships');

var id = undefined,
    name = undefined,
    mine_limit = undefined,
    location_x = undefined,
    location_y = undefined,
    conqueror_id = undefined,
    location = undefined;

var toJSON = function(){return {
    id: id,
    name: name,
    mine_limit: mine_limit,
    location_x: location_x,
    location_y: location_y,
    conqueror_id: conqueror_id,
    location: location
};};

var get_nearest_planet = function(success){

    client.query(
        "SELECT * FROM planets WHERE conqueror_id <> get_player_id(SESSION_USER) ORDER BY location <-> $1 LIMIT 1",
        [location],
        function(err, result){
            if (err){
                throw err;
            }else{
                if(result.rowCount > 0){
                    if(typeof(success) == "function"){
                        success(result.row[0]);
                    }
                }else{
                    throw 'You won ???';
                }
            }                 
        }
    );
}

var repair_damaged = function(){
    var json = toJSON();
    ShipsModel.get_damaged(json, function(damaged){
        if(damaged.length > 0){
            ShipsModel.repair(damaged[0].id, json, repair_damaged);
        }
    });
}

var create_miners = function(){
    var json = toJSON();
    ShipsModel.get_mining_count(json, function(mining_ships){
        if(mining_ships < mine_limit){
            console.log('Miners count', mining_ships);
            ShipsModel.create_miner(json,create_miners);
        }
    });
}

var create_attackers = function(){
    var json = toJSON();
    ShipsModel.get_attackers_count(json, function(attackers_ships){
        if(attackers_ships < attackers_per_planet){
            console.log('Attackers count', attackers_ships);
            ShipsModel.create_attacker(json,create_attackers);
        }
    });
}

var tick = function(){
    repair_damaged();
    create_miners();
    create_attackers();
}

var constructor = function (c, p, u) {
	client = c;
    user = u;

	id = p.id;
    name = p.name;
    mine_limit = p.mine_limit;
    location_x = p.location_x;
    location_y = p.location_y;
    conqueror_id = p.conqueror_id;
    location = p.location;

    user.on(tick);
}

exports.constructor = constructor;