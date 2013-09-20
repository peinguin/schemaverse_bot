
var client = undefined;

var fuel_to_save = 100000;
var fuel_to_sell = 10000;

var money_to_upgrade = 200000;
var money_to_build_attacker = 150000;

var tick_timeout = 160000;
var ship_upgrade_timeout = 10000;
var ship_refuel_timeout = 10000;

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
                console.log('Sell '+FUEL+ ' FUEL');
                if(typeof(success) == 'function'){
                    success();
                }
            }
        }
    );  
}

var actions_rejected = false;
var fuel_sells = false;

var after_tick = function(){
    if(actions_rejected && fuel_sells){
        setTimeout(tick, tick_timeout);
    }
}

var tick = function(){
    get_tick(function(lt){

        actions_rejected = false;
        fuel_sells = false;

        if(lt != last_tick){
            last_tick = lt;

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
                console.log('Repairs rejected');
                actions_rejected = true;
                after_tick();
            });
        }else{
            actions_rejected = true;
            fuel_sells = true;

            tick_timeout += 1000;

            after_tick();
        }
    });
}

var ship_upgrade_tick = function(){

    if(balance > money_to_upgrade){
        ShipsModel.upgrade_ship(function(){
            ship_upgrade_timeout = 1000;
            setTimeout(ship_upgrade_tick, ship_upgrade_timeout);
            update();
        });
    }else{
        setTimeout(ship_upgrade_tick, ship_upgrade_timeout);
        ship_upgrade_timeout += 1000;
    }
}

var ship_refuel_tick = function(){
    ShipsModel.get_fuel_empty_ship(function(ship){
        if(ship){
            console.log('Ship',ship,'is empty');
            ShipsModel.refuel(ship, function(){
                console.log('Ship',ship,'refuled');
                ship_refuel_timeout = 1000;
                setTimeout(ship_refuel_tick, ship_refuel_timeout);
            });
        }else{
            ship_refuel_timeout += 1000;
            setTimeout(ship_refuel_tick, ship_refuel_timeout);
        }
    });
}


var get_tick = function(success){
    client.query(
        "SELECT * FROM tic_seq;",
        function(err, result){
            if (err){
                throw err;
            }else{
                var last_tick = result.rows[0].last_value;
                console.log('Tick '+last_tick, '. ','tick_timeout', tick_timeout);
                if(typeof(success) == 'function'){
                    success(last_tick);
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

var constructor = function (c) {
	client = c;
    update(function(){
        planetsCollection = new require('./../collections/planets').constructor(client, this);
        tick();
        ship_upgrade_tick();
        ship_refuel_tick();
    })                          
}

exports.constructor = constructor;

exports.toJSON = toJSON;

exports.updateRequest = update;

exports.get_money_to_build_attacker = function(){
    return money_to_build_attacker;
};