console.log('ships model loaded');
var client = undefined;

exports.setClient = function(c) {
	client = c;
}

var set_once_action = function(action, who, whom, success){
	if(typeof(success) == "function"){
		success();
	}
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

}

var repair = function(planet, success){
	console.log('Check for repair needed');
	get_damaged(planet, function(damaged){
		console.log('damaged.length', damaged.length);
		if(damaged.length > 0){
			ShipsModel.get_engineer(planet, function(engineer){
				set_once_action(
					'repair',
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

	        		client.query(
						"UPDATE my_ships SET action = 'MINE', action_target_id = $1 WHERE id = $2;",
						[planet.id, result.rows[0].id],
						function(){
							if(typeof(success) == "function"){
			        			success();
			        		}
						}
					);
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