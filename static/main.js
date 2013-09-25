var $map = undefined;
var $window = undefined;
var socket = undefined;

var getting_image = false;

var old = {
		x: 0,
		y: 0,
		zoom: 1
	},
	oldzoom = undefined,
	changeZoomTimeout = undefined;

var max_zoom = 70;
var play_zone_size = 40000000;

function AppViewModel() {

	var self = this;

    self.x = ko.observable(0);
    self.y = ko.observable(0);
    self.zoom = ko.observable(1);

    var zoom_changed = function(){
		changeZoomTimeout = undefined;
		if(
			old.zoom == self.zoom() &&
			old.y == self.y() &&
			old.x == self.x()
		){
			get_image();
		}else{
			changed();
		}
	}

	var changed = function(){
		if(changeZoomTimeout){
    		clearTimeout(changeZoomTimeout);
    	}
    	changeZoomTimeout = setTimeout(
			zoom_changed,
			1000
		);
	}

    self.zoom.subscribe(function() {
    	if(self.zoom() < 1){
    		self.zoom(1);
    	}
    	if(self.zoom() > max_zoom){
    		self.zoom(max_zoom);
    	}
    	old.zoom = self.zoom();
    	changed();
	});

	self.x.subscribe(function() {
		old.x = self.x();
	    changed();
	});

	self.y.subscribe(function() {
		old.y = self.y();
	    changed();
	});
}

var appViewModel = new AppViewModel;

var get_image = function(){
	if(!getting_image){
		$loagind.show();
		getting_image = true;

		var data = {
			x: appViewModel.x(),
			y: appViewModel.y(),
			zoom: appViewModel.zoom(),
			w: $map.width(),
			h: $map.height()
		};
		socket.emit('get_map_base64', data);
	}
}

$(function(){
	$loagind = $('#loading');	
	$map = $('#map');
	$window = $(window);

	old_size = [$map.width(), $map.height()];

	socket = io.connect(window.location.origin);
	socket.on('connect', function () {

		socket.on('tick', function () {
			get_image();
		});

		socket.on('draw', function(data){
			getting_image = false;
			$loagind.hide();
			$map.css('background-image', 'url('+data+')');
		});

		get_image();
	});

	$map.mousewheel(function(event, delta, deltaX, deltaY) {
    	if(!getting_image){
    		appViewModel.zoom(parseInt(appViewModel.zoom()) + delta);
    	}
	});

	$map.bind('move', function(e) {
		if(!getting_image){
    		appViewModel.y(parseInt(appViewModel.y()) - e.deltaY * ((play_zone_size/appViewModel.zoom())/$map.height()));
    		appViewModel.x(parseInt(appViewModel.x()) - e.deltaX * ((play_zone_size/appViewModel.zoom())/$map.width()));
    	}
	});

	ko.applyBindings(appViewModel);
});