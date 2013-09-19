
var client = undefined;

var fuel_to_save = 100000;
var fuel_to_sell = 10000;

var money_to_upgrade = 200000;

var tick_timeout = 160000;
var ship_upgrade_timeout = 10000;

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
var ShipsModel = require('./ships');;

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

                callback();
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

var tick = function(){
    get_tick(function(lt){
        if(lt != last_tick){
            last_tick = lt;

            tick_timeout -= 1000;
            if(tick_timeout < 1000){
                tick_timeout = 1000;
            }

            update(function(rows){
                if(fuel_reserve > fuel_to_save + fuel_to_sell){
                    fuel_sell(fuel_reserve - fuel_to_save, function(){setTimeout(tick, tick_timeout);});
                }else{
                    setTimeout(tick, tick_timeout);
                }
            });
        }else{
            setTimeout(tick, tick_timeout);
            tick_timeout += 1000;
        }
    });
}

var ship_upgrade_tick = function(){

    if(balance > money_to_upgrade){
        ShipsModel.upgrade_ship(json, function(){
            ship_upgrade_timeout -= 1000;
            if(ship_upgrade_timeout < 1000){
                ship_upgrade_timeout = 1000;
            }
            setTimeout(ship_upgrade_tick, ship_upgrade_timeout);
        });
    }else{
        setTimeout(ship_upgrade_tick, ship_upgrade_timeout);
        ship_upgrade_timeout += 1000;
    }
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

var constructor = function (c) {
	client = c;
    update(function(){
        planetsCollection = new require('./../collections/planets').constructor(client, this);
        tick();
        ship_upgrade_tick();
    })
                             
}

exports.constructor = constructor;

exports.toJSON = function(){
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