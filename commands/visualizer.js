var http = require('http'),
	Canvas = require('canvas'),
	fs = require('fs'),
	open = require('open'),
	path = require("path"),
	url = require("url");

var ShipsModel = require('./../models/ships');
var config = require('./../config');

var server_started = false;

var interval = undefined;

var user = undefined;

var max_x = 10000000,
	min_x = -10000000,
	max_y = 10000000,
	min_y = -10000000;

var width = max_x - min_x,
	height = max_y - min_y;

var to_local = function(x, y, x1, x2, y1, y2, img_w, img_h){
	return {x: (x - x1) * (img_w / (x2 - x1)), y: (y - y1) * (img_h / (y2 - y1))};
}

var render_planets = function(ctx, planets, x1, x2, y1, y2, w, h){
	for(i in planets){

		var local = to_local(planets[i].location_x, planets[i].location_y, x1, x2, y1, y2, w, h);
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

	return ctx;
}

var render_ships = function(ctx, ships, x1, x2, y1, y2, w, h){
	for(i in ships){
		var local = to_local(ships[i].location_x, ships[i].location_y, x1, x2, y1, y2, w, h);
		ctx.beginPath();
		if(ships[i].own){
			ctx.strokeStyle = 'rgba(0,255,0,1)';
		}else{
			ctx.strokeStyle = 'rgba(255,0,0,1)';
		}
		ctx.rect(
			local.x - 1 ,
			local.y - 1,
			3,
			3
		);
		ctx.stroke();
	}

	return ctx;
}

var get_map = function(x, y, w, h, zoom, show_planets, show_ships, callback){

	var zoomed_w = Math.ceil(width/zoom),
		zoomed_h = Math.ceil(height/zoom),

		x1 = x - Math.ceil(zoomed_w/2),
		x2 = x + Math.ceil(zoomed_w/2),
		y1 = y - Math.ceil(zoomed_h/2),
		y2 = y + Math.ceil(zoomed_h/2);

	var planets = undefined,
		own_ships = undefined,
		enemy_ships = undefined;

	var planets_rendered = false,
		own_ships_rendered = false,
		enemy_ships_rendered = false;

	var canvas = new Canvas(w, h),
		ctx = canvas.getContext('2d');

	var after_render = function(){
		if(
			(!show_planets || planets_rendered) &&
			(!show_ships || own_ships_rendered) &&
			(!show_ships || enemy_ships_rendered)
		){
			callback(canvas);
		}
	}

	if(show_planets){
		user.get_planets().find_planets(
			x1, x2, y1, y2, 5000000, function(planets){
				render_planets(ctx, planets, x1, x2, y1, y2, w, h);
				planets_rendered = true;
				after_render();
			}
		);
	}

	if(show_ships){
		ShipsModel.get_own_not_near_own_planets(x1, x2, y1, y2, function(ships){
			render_ships(ctx, ships, x1, x2, y1, y2, w, h);
			own_ships_rendered = true;
			after_render();
		});

		ShipsModel.get_enemy_ships(x1, x2, y1, y2, function(ships){
			render_ships(ctx, ships, x1, x2, y1, y2, w, h);
			enemy_ships_rendered = true;
			after_render();
		});
	}
}

var get_map_base64 = function(x, y, w, h, zoom, render_planets, render_ships, callback){
	get_map(x, y, w, h, zoom, render_planets, render_ships, function(canvas){
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
			io = require('socket.io').listen(app, { log: false });

		app.listen(config.port);

		io.sockets.on('connection', function (socket) {

			var subscribe = function(){
				user.once(function(){
					socket.emit('tick');
				});
			}

			socket.on('get_map_base64', function (data) {
				subscribe();
				if(!data.render_ships){
					data.render_ships = true;
				}

				if(!data.render_planets){
					data.render_planets = true;
				}

				data.x = parseInt(data.x);
				data.y = parseInt(data.y);
				data.w = parseInt(data.w);
				data.h = parseInt(data.h);
				data.zoom = parseInt(data.zoom);

				if(data.x > max_x){
					data.x = max_x
				}
				if(data.x > min_x){
					data.x = min_x
				}
				if(data.y > max_y){
					data.y = max_y;
				}
				if(data.y > min_y){
					data.y = min_y;
				}

				if(data.zoom >= 1 && data.w > 0 && data.h > 0){
					get_map_base64(
						data.x,
						data.y,
						data.w,
						data.h,
						data.zoom,
						data.render_planets,
						data.render_ships,
						function(img){
							socket.emit('draw', img);
						}
					);
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