
var client = undefined;

var tick_time = 10000;

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

var after_tick = function(){
    if(repair_finish && get_mining_count_finish){
        setTimeout(tick,tick_time);
    }
}

var tick = function(){

    repair_finish = false;
    get_mining_count_finish = false;

    var json = toJSON();

    ShipsModel.repair(json, function(){
        repair_finish = true;
        after_tick();
    });

    ShipsModel.get_mining_count(json, function(mining_ships){
        if(mining_ships < mine_limit){
            ShipsModel.create_miner(
                json,
                function(){
                    tick_time -= 1000;
                    if(tick_time < 1000){
                        tick_time = 1000;
                    }

                    get_mining_count_finish = true;
                    after_tick();
                },
                function(){
                    tick_time += 1000;
                }
            );
        }else{
            get_mining_count_finish = true;
            after_tick();
        }
    });
}

var constructor = function (c, p) {
	client = c;

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