
var commands = {};

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

var enable = function(u, c){

	user = u;
	client = c;	

	process.stdin.resume();
	process.stdin.setEncoding('utf8');
	console.log('Type command:');

	process.stdin.on('data', function(chunk) {
		if(commands[chunk]){
			commands[chunk]();
		}
	});

	process.stdin.on('end', function() {
	  process.stdout.write('end');
	});
}

enable();

exports.enable = enable;