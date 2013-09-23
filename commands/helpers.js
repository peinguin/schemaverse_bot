var user;

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

module.exports = exports = function(addCommand, u){
	user = u;
	addCommand('planets', get_planets);
	addCommand('ships.count', get_ships_count);
	addCommand('money', get_balance);
}