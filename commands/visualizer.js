var http = require('http'),
	Canvas = require('canvas'),
	fs = require('fs'),
	open = require('open'),
	path = require("path"),
	url = require("url");

var server_started = false;

var config = require('./../config');

var interval = undefined;

var user = undefined;

var max_x = 9701288,
	min_x = -9701288,
	max_y = 9700914,
	min_y = -9699897;

var width = max_x - min_x,
	height = max_y - min_y;

var to_local = function(x, y, w, h, img_w, img_h){
	return {x: x * (img_w / w), y: y*(img_h / h)};
}

var get_map = function(x, y, w, h, zoom, callback){

	var zoomed_w = Math.ceil(width/zoom),
		zoomed_h = Math.ceil(height/zoom),

		x1 = x - Math.ceil(zoomed_w/2),
		x2 = x + Math.ceil(zoomed_w/2),
		y1 = y - Math.ceil(zoomed_h/2),
		y2 = y + Math.ceil(zoomed_h/2);

	user.get_planets().find_planets(
		x1, x2, y1, y2, 1024, function(planets){

			var canvas = new Canvas(w, h),
				ctx = canvas.getContext('2d');

			ctx.strokeStyle = 'rgba(0,0,0,1)';
			
			for(i in planets){

				var local = to_local(planets[i].location_x, planets[i].location_y, zoomed_w, zoomed_h, w, h);
				ctx.beginPath();
				if(planets[i].own){
					ctx.strokeStyle = 'rgba(0,255,0,1)';
				}else{
					ctx.strokeStyle = 'rgba(255,0,0,1)';
				}
				ctx.arc(
					local.x,
					local.y,
					1,
					0,2*Math.PI
				);
				ctx.stroke();
			}

			callback(canvas);
		}
	);
}

var get_map_base64 = function(x, y, w, h, zoom, callback){
	get_map(x, y, w, h, zoom, function(canvas){
		callback(canvas.toDataURL());
	});
}

var interactive_map = function(){

	var handler = function (request, response) {
		var uri = url.parse(request.url).pathname,
			filename = path.join(process.cwd()+'/static/', uri);

		if(!fs.existsSync(filename)){
			response.writeHead(404);
		    response.end();
		}else{
			if (fs.statSync(filename).isDirectory()){
				filename += '/index.html';
			}

		    fs.readFile(filename, "binary", function(err, file) {
		      if(err) {        
		        response.writeHead(500, {"Content-Type": "text/plain"});
		        response.write(err + "\n");
		        response.end();
		        return;
		      }

		      response.writeHead(200);
		      response.write(file, "binary");
		      response.end();
		    });
		}

		
	}

	if(!server_started){
		server_started = true;

		var app = require('http').createServer(handler),
			io = require('socket.io').listen(app);

		io.set('log level', 1);

		app.listen(config.port);

		io.sockets.on('connection', function (socket) {
			socket.on('get_map_base64', function (data) {
				if(data.zoom >= 1 && data.w > 0 && data.h > 0){
					get_map_base64(data.x, data.y, data.w, data.h, data.zoom, function(img){
						socket.emit('draw', img);
					});
				}
			});
		});
	}

	open('http://localhost:'+config.port);
}

module.exports = exports = function(addCommand, u){
	user = u;

	addCommand('get_map', get_map);
	addCommand('map', interactive_map);
}