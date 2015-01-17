/**
 * Simple gauge indicator.
 *
 * @module  gauge
 */

var Emitter = require('component-emitter');
var extend = require('xtend');
var css = require('mucss/css');


var doc = document;


/**
 * Gauge component constructor
 */
function Gauge(el, options) {
	//ensure proper el is passed
	if (!(el instanceof HTMLElement)) throw Error('Bad target element');

	//ensure instance
	if (!(this instanceof Gauge)) return new Gauge(el, options);

	//adopt options
	extend(this, options);

	//save element
	this.el = el;
	this.el.classList.add('gauge');
	this.el.innerHTML = [
		'<svg class="gauge-colors" version="1.1" xmlns="http://www.w3.org/2000/svg">',
		'<rect width="100%" height="100%" opacity="0"/>', //Firefix
		'</svg>',
		'<div class="gauge-marks"></div>',
		'<div class="gauge-values"></div>',
		'<div class="gauge-arrow"></div>'
	].join('');

	//save references
	this.colorsEl = this.el.querySelector('.gauge-colors');
	this.valuesEl = this.el.querySelector('.gauge-values');
	this.arrowEl = this.el.querySelector('.gauge-arrow');


	//economics
	this.createColors();
	this.createValues();
	this.createMarks();

	//render
	this.update();
	this.setValue(this.value);

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
 * Start/end angles
 */
proto.angle = [150, 390];


/**
 * List of marks values
 * `{ percent: value }`
 */
proto.values = (function(){
	var res = {};
	for (var i = 0; i < 10; i++) {
		res[~~(100*i/10)] = i;
	}
	return res;
})();
proto.values[100] = 10;


/**
 * List of marks to show
 */
proto.marks = Object.keys(proto.values).map(parseFloat);


/**
 * Colors for circumferent line, clockwise
 * `{ percent: color }`
 */
proto.colors = {
	0: '#666',
	60: '#ffa500',
	80: 'red'
};


/**
 * Current gauge value & setter
 */
proto.value = 0;
proto.setValue = function(v){
	//notify change
	this.emit('change');

	//find out proper angle, set it
	this.value = +v;
	var angle = getPercentAngle(this.value, this.angle);
	css(this.arrowEl, {
		transform: 'rotate(' + (angle + 90) + 'deg)'
	});

	this.value = v;
};


/**
 * Create notches
 */
proto.createMarks = function(){
	for (var i = 0; i < this.marks.length; i++){

	}
};



/**
 * Mark gauge according to values
 */
proto.createValues = function(){
	//for each mark value - place proper text label on a circle line
	var value, valueEl, d;

	//reset contents
	this.valuesEl.innerHTML = '';
	this.valuesEls = {};

	//for each value create text node
	for (var percent in this.values) {
		value = this.values[percent];

		valueEl = doc.createElement('span');
		valueEl.textContent = value;
		valueEl.setAttribute('class', 'gauge-value');

		//save values els
		this.valuesEls[percent] = valueEl;
		this.valuesEl.appendChild(valueEl);
	}
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
	var w = this.el.clientWidth, h = this.el.clientHeight;
	var cw = this.colorsEl.clientWidth || w, ch = this.colorsEl.clientHeight || h;

	//for each color update path coords
	var lastColor = '',
		lastAngle = this.angle[0],
		lastCoords = getAngleCoords(lastAngle, cw, ch),
		lastPath,
		reverse = this.angle[0] > this.angle[1];

	this.walk(this.colors, function(percent, angle){
		var d, coords = getAngleCoords(angle, cw, ch);

		//ignore first step
		if (lastPath) {
			//color arc to a new step
			d = 'M ' + lastCoords + ' A ' + cw/2 + ' ' + ch/2 + ' 0 ' + (Math.abs(angle - lastAngle) > 180 ? 1 : 0) + ' ' + (reverse ? 0 : 1) + ' ' + coords;
			lastPath.setAttribute('d', d);
			lastPath.setAttribute('stroke', lastColor);
		}

		lastPath = this.colorsEls[percent];
		lastCoords = coords;
		lastColor = this.colors[percent];
		lastAngle = angle;
	});

	//append max → 100 arc
	var endAngle = this.angle[1];
	lastPath.setAttribute('stroke', lastColor);
	lastPath.setAttribute('d', 'M ' + lastCoords + ' A ' + cw/2 + ' ' + ch/2 + ' 0 ' + (Math.abs(endAngle - lastAngle) > 180 ? 1 : 0) + ' 1 ' + getAngleCoords(endAngle, cw, ch));


	//for each color update marks
	var vw = this.valuesEl.clientWidth, vh = this.valuesEl.clientHeight;

	// if (this.inset) wGap = -wGap, hGap = -hGap;

	this.walk(this.values, function(percent, angle){
		var coords = getAngleCoords(angle, vw, vh);
		var valueEl = this.valuesEls[percent];

		css(valueEl, {
			left: coords[0] - valueEl.clientWidth/2,
			top: coords[1] - valueEl.clientHeight/2
		});
	});
};


/**
 * Walk by circle calling an fn with angle
 */
proto.walk = function(obj, fn){
	var angle, that = this;

	//sort percents
	var percents = Object.keys(obj).map(parseFloat).sort()

	.forEach(function(percent){
		angle = getPercentAngle(percent, that.angle);
		fn.call(that, percent, angle);
	});
};


/**
 * Get degrees angle for percent from range
 */
function getPercentAngle(percent, range){
	return ((percent * .01) * (range[1] - range[0]) + range[0]);
}


/**
 * Get coords of an angle
 */
function getAngleCoords(angle, w, h){
	//to rads
	angle *= Math.PI/180;
	return [
		Math.cos(angle) * w/2 + w/2,
		Math.sin(angle) * h/2 + h/2
	];
};


module.exports = Gauge;