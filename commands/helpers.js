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

module.exports = exports = function(addCommand, u){
	user = u;
	addCommand('planets', get_planets);
	addCommand('ships.count', get_ships_count);
}