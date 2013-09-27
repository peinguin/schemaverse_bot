var sprintf = require('sprintf-js').sprintf;

var user = undefined,
	client = undefined;

var dislay_in_table = function(rows){

	if(rows.length == 0){
		return false;
	}

	var columns = {};

	for(var j in rows){
		for(var i in rows[j]){
			var col = rows[j][i].toString();

			if(!columns[i]){
				columns[i] = i.length;
			}
			if(columns[i] < col.length){
				columns[i] = col.length;
			}
		}
	}

	var row = [];

	for(var i in columns){
		row.push(sprintf("%"+columns[i]+"s", i));
	}

	console.log(row.join('|'));

	for(var j in rows){
		row = [];
		for(var i in rows[j]){
			row.push(sprintf("%"+columns[i]+"s", rows[j][i]));
		}
		console.log(row.join('|'));
	}
	
}

var get_planets = function(){
	var planets = user.get_planets().get_planets();
	for(var i in planets){
		console.log(planets[i].toJSON());
	}
}

var get_ships_count = function(){
	user.get_ships_count(function(count){console.log(count);});
}

var get_balance = function(){
	user.update(function(){
		var json = user.toJSON();
		console.log({balance: json.balance, fuel: json.fuel_reserve});
	});
}

var get_all_ships = function(){
	client.query(
		"SELECT\
		    name,\
		    COUNT (id),\
		    avg(range)::integer,\
		    avg(PROSPECTING)::integer PROSPECTING,\
		    avg(ENGINEERING)::integer ENGINEERING,\
		    avg(DEFENSE)::integer DEFENSE,\
		    avg(ATTACK)::integer ATTACK,\
		    avg(MAX_SPEED)::integer MAX_SPEED,\
		    avg(MAX_FUEL)::integer MAX_FUEL,\
		    avg(MAX_HEALTH)::integer MAX_HEALTH\
		  FROM my_ships GROUP BY name",
		function(err, result){
	        if (!err){
	        	dislay_in_table(result.rows);
	        } else {
	            throw err;
	        }                      
    	}
	);
}

var watch_ships = function(){
	client.query(
		"SELECT\
			my_ships.id, \
			name,\
			curr.tic,\
			round((curr.location <-> destination)::numeric,2) dist,\
			round(((current_fuel::float)/max_fuel*100)::numeric,2) as pb_fuel,\
			round(((current_health::float)/max_health*100)::numeric ,2) as pb_health,\
			round(((prev.location <-> destination) - (curr.location <-> destination))::numeric,2) speed\
		FROM my_ships_flight_recorder curr, my_ships, my_ships_flight_recorder prev\
		WHERE\
			my_ships.id = curr.ship_id AND\
			(my_ships.location <-> my_ships.destination) > 10 AND\
			prev.ship_id = curr.ship_id AND prev.tic = curr.tic - 1\
		ORder BY tic desc, dist asc, my_ships.id\
		LIMIT 25",
		function(err, result){
	        if (!err){
	        	dislay_in_table(result.rows);
	        } else {
	            throw err;
	        }                      
    	}
	);
}

module.exports = exports = function(addCommand, u, c){
	user = u;
	client = c;

	addCommand('planets', get_planets);
	addCommand('money', get_balance);
	addCommand('ships.all', get_all_ships);
	addCommand('ships.watch', watch_ships);
}