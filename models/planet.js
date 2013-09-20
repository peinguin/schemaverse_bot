
var client = undefined;
var user = undefined;

var tick_time = 1000;

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

var repair_finish = false;
var get_mining_count_finish = false;
var build_attacker_finish = false;

var after_tick = function(){
    if(
        repair_finish &&
        get_mining_count_finish &&
        build_attacker_finish
    ){
        setTimeout(tick,tick_time);
    }
}

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

var tick = function(){

    repair_finish = false;
    get_mining_count_finish = false;
    build_attacker_finish = false;
    var json = toJSON();

    ShipsModel.get_damaged(json, function(damaged){
        if(damaged.length > 0){
            console.log('damaged.length', damaged.length);
            ShipsModel.repair(damaged[0].id, json, function(){
                tick_time = 1000;

                repair_finish = true;
                after_tick();
            });
        }else{
            tick_time += 1000;
            repair_finish = true;
            after_tick();
        }
    });

    ShipsModel.get_mining_count(json, function(mining_ships){
        if(mining_ships < mine_limit){
            console.log('Miners count', mining_ships);
            ShipsModel.create_miner(
                json,
                function(){

                    tick_time -= 1000;
                    if(tick_time < 1000){
                        tick_time = 1000;
                    }

                    get_mining_count_finish = true;
                    after_tick();
                }
            );
        }else{
            tick_time += 1000;
            get_mining_count_finish = true;
            after_tick();
        }
    });

    ShipsModel.get_attackers_count(json, function(attackers_ships){
        if(attackers_ships < attackers_per_planet){
            console.log('Attackers count', attackers_ships);
            ShipsModel.create_attacker(
                json,
                function(){

                    tick_time -= 1000;
                    if(tick_time < 1000){
                        tick_time = 1000;
                    }

                    build_attacker_finish = true;
                    after_tick();
                }
            );
        }else{
            build_attacker_finish = true;
            tick_time += 1000;
            after_tick();
        }
    });
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

    tick();
}

exports.constructor = constructor;