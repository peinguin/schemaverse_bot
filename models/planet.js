
var client = undefined;
var user = undefined;

var attackers_per_planet = 50;
var attackers_to_send = 40;

var ShipsModel = require('./ships');

module.exports = exports = function (c, p, u) {
	client = c;
    user = u;

    //private vars
    var id = p.id,
        name = p.name,
        mine_limit = p.mine_limit,
        location_x = p.location_x,
        location_y = p.location_y,
        conqueror_id = p.conqueror_id,
        location = p.location;

    //private methods
    var get_nearest_planet = function(success){

        client.query(
            "SELECT * FROM planets WHERE conqueror_id <> get_player_id(SESSION_USER) ORDER BY location <-> $1 asc LIMIT 1",
            [location],
            function(err, result){
                if (err){
                    throw err;
                }else{
                    if(result.rowCount > 0){
                        if(typeof(success) == "function"){
                            success(result.rows[0]);
                        }
                    }else{
                        throw 'You won ???';
                    }
                }                 
            }
        );
    }

    var toJSON = function(){return {
        id: id,
        name: name,
        mine_limit: mine_limit,
        location_x: location_x,
        location_y: location_y,
        conqueror_id: conqueror_id,
        location: location
    };};

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
                ShipsModel.create_miner(json,create_miners);
            }
        });
    }

    var create_attackers = function(){
        var json = toJSON();

        var attackers_ships = undefined,
            conquerers = undefined;

        var after_load = function(){
            if(
                attackers_ships !== undefined &&
                conquerers !== undefined &&
                user.toJSON().balance > user.get_money_to_build_attacker() &&
                attackers_ships < attackers_per_planet
            ){
                ShipsModel.create_attacker(json,create_attackers);
            }
        }

        ShipsModel.get_conquerers_count(function(c){
            conquerers = c;
            after_load();
        })

        ShipsModel.get_attackers_count(json, function(a){
            attackers_ships = a;
            after_load();
        });
    }

    var go_to_conqueror = function(){

        var json = toJSON();

        var attackers_ships = undefined,
            conquerers = undefined;

        var after_load = function(){
            if(
                attackers_ships !== undefined &&
                conquerers !== undefined &&
                attackers_ships >= attackers_per_planet &&
                conquerers < user.get_max_conquerers()
            ){
                get_nearest_planet(function(nearest_planet_location){
                    ShipsModel.send_attackers(nearest_planet_location.location, location, attackers_to_send);
                });
            }
        }

        ShipsModel.get_conquerers_count(function(c){
            conquerers = c;
            after_load();
        })

        ShipsModel.get_attackers_count(json, function(a){
            attackers_ships = a;
            after_load();
        });
    }

    client.query(
        "UPDATE my_ships SET action_target_id = $1 WHERE (location <-> $2) < 10 and name = 'miner'",
        [id, location],
        function(err, result){
            if (err){
                throw err;
            }else{
                if(err){
                    throw err;
                }
            }                 
        }
    );

    //public methods
    this.toJSON = toJSON;

    var tick = function(){
        repair_damaged();
        create_miners();
        create_attackers();
        go_to_conqueror();
    }

    //constructor
    user.on(tick);
}