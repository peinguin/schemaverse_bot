
var client = undefined;

var fuel_to_save = 100000;

var money_to_upgrade = 200000;
var money_to_build_attacker = 10000;
var max_conquerers = 500;
var conquerers_per_planet = 50;

var last_tick = undefined;

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

var planetsCollection = undefined;
var ShipsModel = require('./ships');
var PlanetsCollection = require('./../collections/planets');

var events = [];
var last_monitored_tick = undefined;
var events_monitor = function(){

    var params = [];
    var conditions = [
        "(player_id_2 = get_player_id(SESSION_USER) OR player_id_1 = get_player_id(SESSION_USER))",
        "((ship1.name = 'attacker' AND event.action = 'MINE_SUCCESS') OR (event.action <> 'MINE_SUCCESS'))",
        "event.action not in ('UPGRADE_SHIP', 'REFUEL_SHIP')",
    ];

    params.push(last_monitored_tick);
    conditions.push("event.tic >= $"+(params.indexOf(last_monitored_tick) + 1))

    client.query(
        "SELECT\
            event.*\
        FROM my_events event \
            LEFT JOIN my_ships ship1 ON (ship1.id = event.ship_id_1) \
            LEFT JOIN my_ships ship2 ON (ship2.id = event.ship_id_2) \
        WHERE "+conditions.join(' AND ')+" \
        ORDER BY event.tic desc, event.id desc;",
        params,
        function(err, result){
            if (!err){
                if(result.rowCount > 0){
                    events += result.rows;
                    for(var i in result.rows){

                        if(result.rows[i].tic > last_monitored_tick){
                            last_monitored_tick = result.rows[i].tic;
                        }

                        if(result.rows[i].action.indexOf('CONQUER')>-1){
                            console.log('CONQUER', result.rows[i]);
                            planetsCollection.add(result.rows[i].referencing_id);
                        }
                    }
                }
            }else{
                if(err != 'error: canceling statement due to user request'){
                    throw err;
                }
            }
        }
    );
}

var update = function(callback){
    client.query("SELECT * from my_player", function(err, result){
    
        if (!err){
            if(result.rows.length > 0){

                id             = result.rows[0].id;
                username       = result.rows[0].username;
                created        = result.rows[0].created;
                balance        = result.rows[0].balance;
                fuel_reserve   = result.rows[0].fuel_reserve;
                password       = result.rows[0].password;
                error_channel  = result.rows[0].error_channel;
                starting_fleet = result.rows[0].starting_fleet;
                symbol         = result.rows[0].symbol;
                rgb            = result.rows[0].rgb;

                if(typeof(callback) == 'function'){
                    callback();
                }
            }
        }else{
            throw 'Login error';
        }
    });  
}

var fuel_sell = function(FUEL, success){

    client.query(
        "SELECT CONVERT_RESOURCE('FUEL',$1) as Converted FROM my_player;",
        [FUEL],
        function(err, result){
            if (err){
                throw err;
            }else{
                if(typeof(success) == 'function'){
                    success();
                }
            }
        }
    );  
}

var ship_upgrade = function(){
    if(balance > money_to_upgrade){
        ShipsModel.upgrade_ship(function(){
            update(ship_upgrade);
        });
    }
}

var get_tick = function(success){
    client.query(
        "SELECT * FROM tic_seq;",
        function(err, result){
            if (err){
                throw err;
            }else{
                if(typeof(success) == 'function'){
                    success(result.rows[0].last_value);
                }
            }
        }
    );  
}

var attack_enemy_ships = function(){
    ShipsModel.get_enemy_ship_in_range(function(ship, enemy){
        ShipsModel.attack(ship, enemy, function(){
            attack_enemy_ships();
        });
    });
}

var conquer_enemy_planet = function(){
    ShipsModel.get_enemy_planet_in_range(function(ship, planet){
        ShipsModel.set_long_action('MINE', ship, planet, conquer_enemy_planet);
    });
}

var autorepair_traveled = function(){
    ShipsModel.get_damaged_in_travel(function(damaged){
        if(damaged){
            ShipsModel.autorepair(damaged, autorepair_traveled);
        }
    });
}

var constructor = function (c) {
    
    //constants
    var tick_timeout = 1000;
    
    // vars
    var on = [],
        once = [],
        actions_rejected = false,
        attack_rejected = false,
        fuel_sells = false;
    
    //constructor vars
    var user = this;
	client = c;

    //private methods
    var after_tick = function(){
        if(
            actions_rejected &&
            fuel_sells &&
            attack_rejected
        ){
            setTimeout(tick, tick_timeout);
        }
    }

    var tick = function(){
        get_tick(function(lt){

            if(!last_monitored_tick){
                last_monitored_tick = lt;
            }

            if(lt != last_tick){

                if(lt < last_tick){
                    console.log('lt < last_tick',lt, last_tick, lt < last_tick, parseInt(lt) < parseInt(last_tick));
                    last_tick = undefined;
                    tick_timeout = 1000;
                    update(function(){
                        console.log('New move');
                        on = [];
                        once = [];
                        planetsCollection = new PlanetsCollection(client, user);
                        tick();
                    });
                }else{

                    console.log('Tick '+lt, '. ','tick_timeout', tick_timeout);

                    last_tick = lt;

                    actions_rejected = false;
                    attack_rejected = false;
                    fuel_sells = false;

                    tick_timeout -= 1000;
                    if(tick_timeout < 1000){
                        tick_timeout = 1000;
                    }

                    if(lt != last_tick + 1){
                        tick_timeout = 1000;
                    }

                    update(function(rows){
                        if(fuel_reserve > fuel_to_save * planetsCollection.get_planets().length){
                            fuel_sell(fuel_reserve - fuel_to_save * planetsCollection.get_planets().length, function(){
                                fuel_sells = true;
                                after_tick();
                            });
                        }else{
                            fuel_sells = true;
                            after_tick();
                        }
                    });

                    ShipsModel.reject_long_action('REPAIR', undefined, undefined, function(){
                        actions_rejected = true;
                        after_tick();
                    });

                    ShipsModel.reject_long_action('ATTACK', undefined, undefined, function(){
                        attack_rejected = true;
                        after_tick();
                    });

                    attack_enemy_ships();
                    ShipsModel.refuel();
                    ship_upgrade();
                    autorepair_traveled();
                    events_monitor();
                    ShipsModel.amendment_course();
                    conquer_enemy_planet();

                    for(var i in on){
                        on[i]();
                    }

                    var len = once.length;
                    for(var i = 0; i < len; i++){
                        (once.pop())();
                    }
                }

            }else{
                tick_timeout += 1000;
                setTimeout(tick, 1000);
            }
        });
    }
    // public methods
    this.on = function(callback){
        if(typeof(callback) == 'function'){
            on.push(callback);
        }
    }

    this.once = function(callback){
        if(typeof(callback) == 'function'){
            once.push(callback);
        }
    }

    this.get_planets = function(){
        if(planetsCollection){
            return planetsCollection;
        }
    }

    this.toJSON = function(){
        return {
            id:id,
            username:username,
            created:created,
            balance:balance,
            fuel_reserve:fuel_reserve,
            password:password,
            error_channel:error_channel,
            starting_fleet:starting_fleet,
            symbol:symbol,
            rgb:rgb
        };
    };

    this.get_ships_count = function(callback){
        client.query(
            "SELECT COUNT(my_ships.id) count FROM my_ships;",
            function(err, result){
                if (err){
                    throw err;
                }else{
                    if(typeof(callback) == 'function'){
                        callback(result.rows[0].count);
                    }
                }
            }
        );
    };
    this.get_money_to_build_attacker = function(){
        return money_to_build_attacker;
    };

    this.update = update;

    this.get_max_conquerers = function(){
        return max_conquerers * planetsCollection.get_planets().length;
    };

    this.get_conqurers_per_planet = function(){
        return conquerers_per_planet;
    };

    //constructor
    update(function(){
        planetsCollection = new PlanetsCollection(client, user);
        tick();
    });
}

exports.constructor = constructor;

exports.updateRequest = update;

exports.get_events = function(count){
    if(!count)
        count = events.length;
    return events.slise(events.length - count, events.length);
}