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

function Gauge(el, options) {
	//ensure proper el is passed
	if (!(el instanceof HTMLElement)) throw Error('Bad target element');

	//ensure instance
	if (!(this instanceof Gauge)) return new Gauge(el, options);

	//save element
	this.el = el;
	this.el.className = 'gauge';
	this.el.innerHTML = [
		'<svg class="gauge-colors" version="1.1" xmlns="http://www.w3.org/2000/svg"></svg>',
		'<div class="gauge-values"></div>'
	].join('');

	//save references
	this.colorsEl = this.el.querySelector('.gauge-colors');
	this.valuesEl = this.el.querySelector('.gauge-values');

	//adopt options
	extend(this, options);

	//economics
	this.createColors();
	this.createValues();

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
 * Values placement
 */

proto.inset = true;


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
	for (var i = 0; i < 9; i++) {
		res[~~(100*i/9)] = i;
	}
	return res;
})();
proto.values[100] = 10;


/**
 * Colors for circumferent line, clockwise
 * `{ percent: color }`
 */

proto.colors = {
	0: 'gray',
	60: 'yellow',
	85: 'red'
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

	//for each color update path coords
	var lastColor = '',
		lastAngle = this.angle[0],
		lastCoords = getAngleCoords(lastAngle, w, h),
		lastPath,
		reverse = this.angle[0] > this.angle[1];

	this.walk(this.colors, function(percent, angle){
		var d, coords = getAngleCoords(angle, w, h);

		//ignore first step
		if (lastPath) {
			//color arc to a new step
			d = 'M ' + lastCoords + ' A ' + w/2 + ' ' + h/2 + ' 0 ' + (Math.abs(angle - lastAngle) > Math.PI ? 1 : 0) + ' ' + (reverse ? 0 : 1) + ' ' + coords;
			lastPath.setAttribute('d', d);
			lastPath.setAttribute('stroke', lastColor);
		}

		lastPath = this.colorsEls[percent];
		lastCoords = coords;
		lastColor = this.colors[percent];
		lastAngle = angle;
	});

	//append max → 100 arc
	var endAngle = this.angle[1] * Math.PI/180;
	lastPath.setAttribute('stroke', lastColor);
	lastPath.setAttribute('d', 'M ' + lastCoords + ' A ' + w/2 + ' ' + h/2 + ' 0 ' + (Math.abs(endAngle - lastAngle) > 180 ? 1 : 0) + ' 1 ' + getAngleCoords(endAngle, w, h));

	console.log('---')

	//for each color update marks
	var wGap = w * .2, hGap = h * .2;

	if (this.inset) wGap = -wGap, hGap = -hGap;

	this.walk(this.values, function(percent, angle){
		var coords = getAngleCoords(angle, w + wGap, h + hGap);
		var valueEl = this.valuesEls[percent];

		valueEl.style.left = coords[0] - wGap/2 - valueEl.clientWidth/2 + 'px';
		valueEl.style.top = coords[1] - hGap/2 - valueEl.clientHeight/2 + 'px';
	});
};


/**
 * Walk by circle calling an fn with angle
 */

proto.walk = function(obj, fn){
	var angle, aRange = this.angle[1] - this.angle[0], that = this;

	//sort percents
	var percents = Object.keys(obj).map(parseFloat).sort()

	.forEach(function(percent){
		angle = ((percent * .01) * aRange + that.angle[0]) * Math.PI/180;
		fn.call(that, percent, angle);
	});
};


/** Get clean angle */
function ang(a){
	return (a + 360)%360;
}


/**
 * Get coords of an angle
 */

function getAngleCoords(angle, w, h){
	return [
		Math.cos(angle) * w/2 + w/2,
		Math.sin(angle) * h/2 + h/2
	];
};


module.exports = Gauge;