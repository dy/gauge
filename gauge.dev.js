!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.Gauge=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
	this.marksEl = this.el.querySelector('.gauge-marks');


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
 * List of marks to show.
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
 * CSS-rotated rectangles are far more customizable than SVG-lines
 */
proto.createMarks = function(){
	var markEl;

	//list of marks els per angle
	this.marksEls = {};

	for (var i = 0; i < this.marks.length; i++){
		markEl = doc.createElement('span');
		markEl.className = 'gauge-mark';

		this.marksEls[this.marks[i]] = markEl;
		this.marksEl.appendChild(markEl);
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

	//1. Update colors
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


	//2. Update values
	var vw = this.valuesEl.clientWidth, vh = this.valuesEl.clientHeight;

	this.walk(this.values, function(percent, angle){
		var coords = getAngleCoords(angle, vw, vh);
		var valueEl = this.valuesEls[percent];

		css(valueEl, {
			left: coords[0] - valueEl.clientWidth/2,
			top: coords[1] - valueEl.clientHeight/2
		});
	});


	//3. Update marks
	var mw = this.marksEl.clientWidth, mh = this.marksEl.clientHeight;
	this.walk(this.marksEls, function(percent, angle){
		var coords = getAngleCoords(angle, mw, mh);
		var markEl = this.marksEls[percent];

		css(markEl, {
			transform: 'rotate(' + (angle + 90) + 'deg)',
			left: coords[0] - markEl.clientWidth/2,
			top: coords[1] - markEl.clientHeight/2
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
},{"component-emitter":2,"mucss/css":3,"xtend":6}],2:[function(require,module,exports){

/**
 * Expose `Emitter`.
 */

module.exports = Emitter;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks[event] = this._callbacks[event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  var self = this;
  this._callbacks = this._callbacks || {};

  function on() {
    self.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks[event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks[event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks[event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks[event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

},{}],3:[function(require,module,exports){
var fakeStyle = require('./fake-element').style;
var prefix = require('./prefix').dom;

/**
 * Apply styles to an element.
 *
 * @param    {Element}   el   An element to apply styles.
 * @param    {Object|string}   obj   Set of style rules or string to get style rule.
 */
module.exports = function(el, obj){
	if (!el || !obj) return;

	var name, value;

	//return value, if string passed
	if (typeof obj === 'string') {
		name = obj;

		//return value, if no value passed
		if (arguments.length < 3) {
			return el.style[prefixize(name)];
		}

		//set style, if value passed
		value = arguments[2] || '';
		obj = {};
		obj[name] = value;
	}

	for (name in obj){
		//convert numbers to px
		if (typeof obj[name] === 'number' && /left|right|bottom|top|width|height/i.test(name)) obj[name] += 'px';

		value = obj[name] || '';

		el.style[prefixize(name)] = value;
	}
};


/**
 * Return prefixized prop name, if needed.
 *
 * @param    {string}   name   A property name.
 * @return   {string}   Prefixed property name.
 */
function prefixize(name){
	var uName = name[0].toUpperCase() + name.slice(1);
	if (fakeStyle[name] !== undefined) return name;
	if (fakeStyle[prefix + uName] !== undefined) return prefix + uName;
	return '';
}

},{"./fake-element":4,"./prefix":5}],4:[function(require,module,exports){
module.exports = document.createElement('div');
},{}],5:[function(require,module,exports){
//vendor-prefix method, http://davidwalsh.name/vendor-prefix
var styles = getComputedStyle(document.documentElement, '');

var pre = (Array.prototype.slice.call(styles)
	.join('')
	.match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o'])
)[1];

dom = ('WebKit|Moz|MS|O').match(new RegExp('(' + pre + ')', 'i'))[1];

module.exports = {
	dom: dom,
	lowercase: pre,
	css: '-' + pre + '-',
	js: pre[0].toUpperCase() + pre.substr(1)
};
},{}],6:[function(require,module,exports){
module.exports = extend

function extend() {
    var target = {}

    for (var i = 0; i < arguments.length; i++) {
        var source = arguments[i]

        for (var key in source) {
            if (source.hasOwnProperty(key)) {
                target[key] = source[key]
            }
        }
    }

    return target
}

},{}]},{},[1])(1)
});