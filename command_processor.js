
var commands = {};
var history = [];
var curr_command = '';
var history_position = undefined;

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

var enable = function(u, c){

	user = u;
	client = c;	

	var stdin = process.openStdin(); 
	require('tty').setRawMode(true);    

	stdin.on('keypress', function (chunk, key) {
	  process.stdout.write('Get Chunk: ' + chunk + '\n');
	  if (key && key.ctrl && key.name == 'c') process.exit();
	});

	/*process.stdin.setRawMode( true );
	//process.stdin.resume();
	//process.stdin.setEncoding('utf8');
	console.log('Type command:');

	process.stdin.on('keypress', function(chunk, key) {
process.stdout.write('Get Chunk: ' + chunk +'\n');*/
		/*if(key == ''){//enter
			process_command(curr_command);
			history.push(curr_command);
			history_position = history.length - 1;
			curr_command = '';
		}else if(key == ''){//up
			history_position--;
			if(history[history_position]){
				curr_command = history[history_position];
				process.stdout.write("\r                                                           ");
				process.stdout.write(curr_command);
			}else{
				history_position = history.length - 1;
			}
		}else if(key == ''){//down
			history_position++;
			if(history[history_position]){
				curr_command = history[history_position];
				process.stdout.write("\r                                                           ");
				process.stdout.write(curr_command);
			}else{
				history_position = history.length - 1;
			}
		}else{
			curr_command += key;
			process.stdout.write(chunk);
		}*/
	});

	process.stdin.on('end', function() {
	  process.stdout.write('end');
	});
}

exports.enable = enable;