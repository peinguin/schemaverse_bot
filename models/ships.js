
var client = undefined;

var max = 500;
var MAX_HEALTH = 1000;
var MAX_FUEL = 200000;
var MAX_SPEED = 800000;
var RANGE = 5000;

var upgrade_cost = 2375;

exports.setClient = function(c) {
	client = c;
}

var set_long_action = function(action, who, whom, success){
	client.query(
		"UPDATE my_ships SET action = $1, action_target_id = $2 WHERE id = $3;",
		[action, whom, who],
		function(){
			if(typeof(success) == "function"){
    			success();
    		}
		}
	);
}

var get_damaged = function(planet, callback){
	client.query(
		"SELECT *\
		FROM my_ships damaged\
		WHERE\
			damaged.current_health < damaged.max_health AND\
			damaged.Location ~= $1 AND\
			(SELECT COUNT(engineers.id) FROM my_ships engineers WHERE engineers.action = 'REPAIR' AND engineers.action_target_id = damaged.id) = 0;", 
		[planet.location],
		function(err, result){
	        if (!err){
	            callback(result.rows);
	        } else {
	            throw err;
	        }                      
   		}
   	);
}

var get_engineer = function(planet, callback){
	client.query(
		"SELECT * FROM my_ships WHERE name = 'engineer' AND action is NULL AND Location ~= $1 LIMIT 1;",
		[planet.location],
		function(err, result){
			if(result.rows.length > 0){
				callback(result.rows[0].id);
			}else{
				client.query(
					"INSERT INTO my_ships(name, attack, defense, engineering, prospecting , location) values ('engineer',0,0,20,0,$1) RETURNING id;",
					[planet.location],
					function(err, result){
				        if (err){
				            throw err;
				        }else{
				        	if(result.rowCount > 0){
				        		console.log('Engineer created');
				        		callback(result.rows[0].id);
				        	}else{
				        		console.log('Engineer not created');
				        		if(typeof(callback) == "function"){
				        			callback();
				        		}
				        	}
				        }                 
			    	}
			    );
			}
		}
	);
}

var repair = function(damaged, planet, success){	
	console.log('Repair requested for', damaged);
	get_engineer(planet, function(engineer){
		set_long_action(
			'REPAIR',
			engineer,
			damaged,
			success
		);
	});
}

exports.get_attackers_count = function(planet, callback){
	client.query(
		"SELECT COUNT(id) count FROM my_ships WHERE name = 'attacker' AND Location ~= $1;",
		[planet.location],
		function(err, result){
	        if (!err){
	            callback(result.rows[0].count);
	        } else {
	            throw err;
	        }                      
    	}
    );
}

exports.repair = repair;

exports.get_mining_count = function(planet, callback){
	client.query(
		"SELECT COUNT(id) count FROM my_ships WHERE action = 'MINE' AND Location ~= $1;",
		[planet.location],
		function(err, result){
	        if (!err){
	            callback(result.rows[0].count);
	        } else {
	            throw err;
	        }                      
    	}
    );
}

exports.create_miner = function(planet, callback){
	client.query(
		"INSERT INTO my_ships(name, attack, defense, engineering, prospecting , location) values ('miner',0,0,0,20,$1) RETURNING id;",
		[planet.location],
		function(err, result){
	        if (err){
	            throw err;
	        }else{
	        	if(result.rowCount > 0){
	        		console.log('Miner created');
	        		set_long_action('MINE', result.rows[0].id, planet.id, callback);
	        	}else{
	        		console.log('Miner not created');
	        		if(typeof(callback) == "function"){
	        			callback();
	        		}
	        	}
	        }                 
    	}
    );
}

exports.upgrade_ship = function(success){
	client.query(
		"SELECT id, name, max_health, max_fuel, max_speed, range, attack, defense, engineering, prospecting FROM my_ships\
		WHERE\
			max_health < $1 OR max_fuel < $2 OR max_speed < $3 OR range < $4 OR (attack < $5 AND defense < $5 AND engineering < $5 AND prospecting < $5)\
		LIMIT 1;",
		[MAX_HEALTH, MAX_FUEL, MAX_SPEED, RANGE, max],
		function(err, result){
			if (err){
	            throw err;
	        }else{
	        	if(result.rowCount > 0){

	        		if(result.rows[0].name == 'miner'){
	        			var skill = 'PROSPECTING';
	        		}else if(result.rows[0].name == 'engineer'){
	        			var skill = 'ENGINEERING';
	        		}else if(result.rows[0].name == 'attacker'){
	        			var skill = 'ATTACK';
	        		}else{
	        			var skill = 'DEFENSE';
	        		}

	        		client.query(
	        			"SELECT id,\
						   UPGRADE(id, 'MAX_HEALTH', 2), \
						   UPGRADE(id, 'MAX_FUEL', 400), \
						   UPGRADE(id, 'MAX_SPEED', 1600), \
						   UPGRADE(id, 'RANGE', 10), \
						   UPGRADE(id, $2, 1)\
						 FROM my_ships \
						 WHERE id=$1;",
						[result.rows[0].id, skill],
						function(err, result){
							if (err){
					            throw err;
					        }else{
					        	console.log('Upgrade',skill,'success');
					        	success();
					        }
						}
					);
	        	}else{
	        		success();
	        	}
	        }     
		}
	);
}

exports.get_damaged = get_damaged;

exports.create_attacker = function(planet, callback){
	client.query(
		"INSERT INTO my_ships(name, attack, defense, engineering, prospecting , location) values ('attacker',0,0,0,20,$1) RETURNING id;",
		[planet.location],
		function(err, result){
	        if (err){
	            throw err;
	        }else{
	        	if(result.rowCount > 0){
	        		console.log('Attacker created');
	        	}else{
	        		console.log('Attacker not created');
	        	}
	        	if(typeof(callback) == "function"){
        			callback();
        		}
	        }                 
    	}
    );
}

exports.reject_long_action = function(action, who, whom, success){

	var params = [];
	if(who){
		params.push(who);
	}
	if(whom){
		params.push(whom);
	}
	if(action){
		params.push(action);
	}

	client.query(
		"UPDATE my_ships SET action = NULL WHERE True"+
		(who?' AND id = $'+(params.indexOf(who)+1):'')+
		(whom?' AND action_target_id = $'+(params.indexOf(whom)+1):'')+
		(action?' AND action = $'+(params.indexOf(action)+1):'')+";",
		params,
		function(err, result){
			if (err){
	            throw err;
		    }else{
				if(typeof(success) == "function"){
	    			success();
	    		}
	    	}
		}
	);
}