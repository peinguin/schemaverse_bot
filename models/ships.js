console.log('ships model loaded');
var client = undefined;

exports.setClient = function(c) {
	client = c;
}

var set_once_action = function(action, who, whom, success){
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
	client.query("SELECT * FROM my_ships WHERE current_health < max_health AND Location ~= $1;", 
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
				        		if(typeof(error) == "function"){
				        			error();
				        		}
				        	}
				        }                 
			    	}
			    );
			}
		}
	);
}

var repair = function(planet, success){
	console.log('Check for repair needed');
	get_damaged(planet, function(damaged){
		console.log('damaged.length', damaged.length);
		if(damaged.length > 0){
			get_engineer(planet, function(engineer){
				set_once_action(
					'REPAIR',
					engineer,
					damaged[0].id,
					success
				);
			});
	    }else{
	    	if(typeof(success) == "function"){
    			success();
    		}
	    }
	});
}

exports.repair = repair;

exports.get_mining_count = function(planet, callback){
	client.query(
		"SELECT COUNT(id) count FROM my_ships WHERE action = 'MINE' AND Location ~= $1;",
		[planet.location],
		function(err, result){
			console.log('Miners count', result.rows[0].count);
	        if (!err){
	            callback(result.rows[0].count);
	        } else {
	            throw err;
	        }                      
    	}
    );
}

exports.create_miner = function(planet, success, error){
	client.query(
		"INSERT INTO my_ships(name, attack, defense, engineering, prospecting , location) values ('miner',0,0,0,20,$1) RETURNING id;",
		[planet.location],
		function(err, result){
	        if (err){
	            throw err;
	        }else{
	        	if(result.rowCount > 0){
	        		console.log('Miner created');
	        		set_once_action('MINE', result.rows[0].id, planet.id, success);
	        	}else{
	        		console.log('Miner not created');
	        		if(typeof(error) == "function"){
	        			error();
	        		}
	        	}
	        }                 
    	}
    );
}