
var commands = {};
var history = [];
var curr_command = '';
var history_position = 0;

var user = undefined;
var client = undefined;

var addCommand = function(command, func){
	if(typeof(func) == 'function'){
		commands[command] = func;
	}
}

var print_map = function(){
	client.query();
}

var get_planets = function(){
	var planets = user.get_planets();console.log(planets)
	for(var i in planets){
		console.log(planets[i].toJSON());
	}
}

var get_ships_count = function(){
	user.get_ships_count(function(count){console.log(count);});;
}

addCommand('planets', get_planets);
addCommand('ships.count', get_ships_count);

var process_command = function(chunk){
	chunk = chunk.replace(/(\n|\r)/gm,"");

	if(commands[chunk]){
		commands[chunk]();
		history.push(chunk);
	}else{
		console.log(commands);
	}
}

var clean_line = function(){
	process.stdout.write("\r                                                           \r");
}

var enable = function(u, c){

	user = u;
	client = c;	

	process.stdin.setRawMode( true );
	process.stdin.resume();
	process.stdin.setEncoding('utf8');
	console.log('Type command:');

	process.stdin.on('data', function(key) {
		if ( key === '\u0003' ) {
			process.exit();
		}else if(key == "\r"){//enter
			process.stdout.write("\n");
			process_command(curr_command);
			history_position = history.length;
			curr_command = '';
		}else if(key == '\u001b[A'){//up
			history_position--;
			if(history_position < 0){
				history_position = -1;
				curr_command = '';
				clean_line();
			}else if(history[history_position]){
				curr_command = history[history_position];
				clean_line();
				process.stdout.write(curr_command);
			}
		}else if(key == '\u001b[B'){//down
			history_position++;
			if(history_position == history.length){
				history_position = history.length;
				curr_command = '';
				clean_line();
			}else if(history[history_position]){
				curr_command = history[history_position];
				clean_line();
				process.stdout.write(curr_command);
			}
		}else if ( key === '\u007f' ) {
			curr_command = curr_command.substr(0, curr_command.length - 1);
			clean_line();
			process.stdout.write(curr_command);
		}else{
			curr_command += key;
			process.stdout.write(key);
		}
	});

	process.stdin.on('end', function() {
	  process.stdout.write('end');
	});
}

exports.enable = enable;