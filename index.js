/**
 * Simple gauge indicator.
 *
 * @module  gauge
 */


var Emitter = require('component-emitter');
var extend = require('xtend');


var doc = document;


/**
 * Gauge component constructor
 */
function Gauge(options) {
	//ensure instance
	if (!this instanceof Gauge) return new Gauge(options);

	//save element
	this.el = doc.createElement('div');
	this.el.className = 'gauge';
	this.el.innerHTML = [
		'<svg class="gauge-colors" version="1.1" xmlns="http://www.w3.org/2000/svg"></svg>'
	].join('');

	//save references
	this.colorsEl = this.el.querySelector('.gauge-colors');

	//adopt options
	extend(this, options);

	//economics
	this.createColors();
	this.createMarks();

	//render
	this.update();

	//bind to window resize
	var that = this;
	window.addEventListener('resize', function(){
		that.update();
	});
}


/**
 * Gauge prototype
 */
var proto = Gauge.prototype = Object.create(Emitter.prototype);


/**
 * Marks placement
 */
proto.inset = false;


/**
 * Start/end angles
 */
proto.leftAngle = -30;
proto.rightAngle = 210;


/**
 * List of marks values
 * `{ percent: value }`
 */
proto.values = {
	0: 0,
	50: 3,
	100: 6
};


/**
 * Colors for circumferent line, clockwise
 * `{ percent: color }`
 */
proto.colors = {
	0: 'gray',
	70: 'red'
};


/**
 * Current gauge value & setter
 */
proto.value = 30;
proto.setValue = function(v){
	//notify change
	this.emit('change');

	this.value = v;
};


/**
 * Mark gauge according to values
 */
proto.createMarks = function(){
	//for each mark value - place proper text label on a circle line
};


/**
 * Create colors based on marks list
 */
proto.createColors = function(){
	var color, colorEl, d;

	//reset contents
	this.colorsEl.innerHTML = '';
	this.colorsEls = {};

	//for each color create svg arc path of the according color
	for (var percent in this.colors) {
		color = this.colors[percent];

		colorEl = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
		colorEl.setAttribute('class', 'gauge-color');

		//save colors els
		this.colorsEls[percent] = colorEl;
		this.colorsEl.appendChild(colorEl);
	}
};


/**
 * Update colors & marks size/position
 */
proto.update = function(){
	var color, colorEl, d;

	//for each color update path coords
	for (var percent in this.colors) {
		color = this.colors[percent];
		colorEl = this.colorsEls[percent];

		//setup color arc
		d = 'M 20 20 A 40 40 0 0 0 200 200';
		colorEl.setAttribute('d', d);
		colorEl.setAttribute('stroke', color);
	}
};




module.exports = Gauge;