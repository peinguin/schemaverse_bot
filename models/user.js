
var client = undefined;

var fuel_to_save = 100000;
var fuel_to_sell = 10000;

var money_to_upgrade = 200000;
var money_to_build_attacker = 150000;

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

                console.log('balance', balance, '. ', 'fuel_reserve', fuel_reserve);
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

var ship_refuel = function(){
    if(fuel_reserve > 0){
        ShipsModel.get_fuel_empty_ship(function(ship){
            if(ship){
                ShipsModel.refuel(ship, function(){
                    update(ship_refuel);
                });
            }
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

toJSON = function(){
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
}

var attack_enemy_ships = function(){
    ShipsModel.get_enemy_ship_in_range(function(ship, enemy){
        ShipsModel.attack(ship, enemy, function(){
            attack_enemy_ships();
        });
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
    var after_tick = function(){console.log(actions_rejected, fuel_sells,attack_rejected)
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
            console.log('Tick '+lt, '. ','tick_timeout', tick_timeout);
            if(lt != last_tick){
                last_tick = lt;

                actions_rejected = false;
                attack_rejected = false;
                fuel_sells = false;

                tick_timeout -= 1000;
                if(tick_timeout < 1000){
                    tick_timeout = 1000;
                }

                update(function(rows){
                    if(fuel_reserve > fuel_to_save + fuel_to_sell){
                        fuel_sell(fuel_reserve - fuel_to_save, function(){
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
                ship_refuel();
                ship_upgrade();

                for(var i in on){
                    on[i]();
                }

                for(var i in once){
                    once[i]();
                }
                once = [];

            }else{
                tick_timeout += 1000;
                setTimeout(tick, 1000);
            }
        });
    }
    
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

    update(function(){
        planetsCollection = new require('./../collections/planets').constructor(client, user);
        tick();
    });

    this.on(ShipsModel.amendment_course);
}

exports.constructor = constructor;

exports.toJSON = toJSON;

exports.updateRequest = update;

exports.get_money_to_build_attacker = function(){
    return money_to_build_attacker;
};