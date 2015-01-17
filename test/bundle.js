require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/** @module query-relative/closest */
var doc = document, root = doc.documentElement;
var matches = require('matches-selector');
var isNode = require('mutype/is-node');


/**
* Get closest parent matching selector (or self)
*/
module.exports = function(e, q, checkSelf, within){
	if (!(isNode(e))) throw Error('Bad argument ' + e);

	within = within || doc;

	//root el is considered the topmost
	if (e === doc) return root;

	if (checkSelf) {
		if (!q || (isNode(q) ? e == q : matches(e, q))) return e;
	}

	while ((e = e.parentNode) && e !== doc) {
		if (!q || (isNode(q) ? e == q : matches(e, q))) return e;
	}
};
},{"matches-selector":4,"mutype/is-node":8}],2:[function(require,module,exports){
/** @module query-relative/next */
var matches = require('matches-selector');
var isNode = require('mutype/is-node');

/**
 * Find next sibling matching selector
 */
module.exports = function(e, q){
	if (!isNode(e)) throw Error('Bad argument ' + e);

	while (e = e.nextSibling) {
		if (e.nodeType === 1 && (!q || (isNode(q) ? e === q : matches(e, q)))) return e;
	}
};
},{"matches-selector":4,"mutype/is-node":8}],3:[function(require,module,exports){
(function (global){
'use strict';

// there's 3 implementations written in increasing order of efficiency

// 1 - no Set type is defined
function uniqNoSet(arr) {
	var ret = [];

	for (var i = 0; i < arr.length; i++) {
		if (ret.indexOf(arr[i]) === -1) {
			ret.push(arr[i]);
		}
	}

	return ret;
}

// 2 - a simple Set type is defined
function uniqSet(arr) {
	var seen = new Set();
	return arr.filter(function (el) {
		if (!seen.has(el)) {
			seen.add(el);
			return true;
		}
	});
}

// 3 - a standard Set type is defined and it has a forEach method
function uniqSetWithForEach(arr) {
	var ret = [];

	(new Set(arr)).forEach(function (el) {
		ret.push(el);
	});

	return ret;
}

// V8 currently has a broken implementation
// https://github.com/joyent/node/issues/8449
function doesForEachActuallyWork() {
	var ret = false;

	(new Set([true])).forEach(function (el) {
		ret = el;
	});

	return ret === true;
}

if ('Set' in global) {
	if (typeof Set.prototype.forEach === 'function' && doesForEachActuallyWork()) {
		module.exports = uniqSetWithForEach;
	} else {
		module.exports = uniqSet;
	}
} else {
	module.exports = uniqNoSet;
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],4:[function(require,module,exports){
'use strict';

var proto = Element.prototype;
var vendor = proto.matches
  || proto.matchesSelector
  || proto.webkitMatchesSelector
  || proto.mozMatchesSelector
  || proto.msMatchesSelector
  || proto.oMatchesSelector;

module.exports = match;

/**
 * Match `el` to `selector`.
 *
 * @param {Element} el
 * @param {String} selector
 * @return {Boolean}
 * @api public
 */

function match(el, selector) {
  if (vendor) return vendor.call(el, selector);
  var nodes = el.parentNode.querySelectorAll(selector);
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i] == el) return true;
  }
  return false;
}
},{}],5:[function(require,module,exports){
var isString = require('./is-string');
var isArray = require('./is-array');
var isFn = require('./is-fn');

//FIXME: add tests from http://jsfiddle.net/ku9LS/1/
module.exports = function (a){
	return isArray(a) || (a && !isString(a) && !a.nodeType && (typeof window != 'undefined' ? a != window : true) && !isFn(a) && typeof a.length === 'number');
}
},{"./is-array":6,"./is-fn":7,"./is-string":9}],6:[function(require,module,exports){
module.exports = function(a){
	return a instanceof Array;
}
},{}],7:[function(require,module,exports){
module.exports = function(a){
	return !!(a && a.apply);
}
},{}],8:[function(require,module,exports){
module.exports = function(target){
	return typeof document !== 'undefined' && target instanceof Node;
};
},{}],9:[function(require,module,exports){
module.exports = function(a){
	return typeof a === 'string' || a instanceof String;
}
},{}],10:[function(require,module,exports){
/**
 * @module parenthesis
 */
module.exports = {
	parse: require('./parse'),
	stringify: require('./stringify')
};
},{"./parse":11,"./stringify":12}],11:[function(require,module,exports){
/**
 * @module  parenthesis/parse
 *
 * Parse a string with parenthesis.
 *
 * @param {string} str A string with parenthesis
 *
 * @return {Array} A list with parsed parens, where 0 is initial string.
 */

//TODO: implement sequential parser of this algorithm, compare performance.
module.exports = function(str, bracket){
	//pretend non-string parsed per-se
	if (typeof str !== 'string') return [str];

	var res = [], prevStr;

	bracket = bracket || '()';

	//create parenthesis regex
	var pRE = new RegExp(['\\', bracket[0], '[^\\', bracket[0], '\\', bracket[1], ']*\\', bracket[1]].join(''));

	function replaceToken(token, idx, str){
		//save token to res
		var refId = res.push(token.slice(1,-1));

		return '\\' + refId;
	}

	//replace paren tokens till there’s none
	while (str != prevStr) {
		prevStr = str;
		str = str.replace(pRE, replaceToken);
	}

	//save resulting str
	res.unshift(str);

	return res;
};
},{}],12:[function(require,module,exports){
/**
 * @module parenthesis/stringify
 *
 * Stringify an array/object with parenthesis references
 *
 * @param {Array|Object} arr An array or object where 0 is initial string
 *                           and every other key/value is reference id/value to replace
 *
 * @return {string} A string with inserted regex references
 */

//FIXME: circular references causes recursions here
//TODO: there’s possible a recursive version of this algorithm, so test it & compare
module.exports = function (str, refs, bracket){
	var prevStr;

	//pretend bad string stringified with no parentheses
	if (!str) return '';

	if (typeof str !== 'string') {
		bracket = refs;
		refs = str;
		str = refs[0];
	}

	bracket = bracket || '()';

	function replaceRef(token, idx, str){
		return bracket[0] + refs[token.slice(1)] + bracket[1];
	}

	while (str != prevStr) {
		prevStr = str;
		str = str.replace(/\\[0-9]+/, replaceRef);
	}

	return str;
};
},{}],13:[function(require,module,exports){
var slice = [].slice;

module.exports = function (selector, multiple) {
  var ctx = this === window ? document : this;

  return (typeof selector == 'string')
    ? (multiple) ? slice.call(ctx.querySelectorAll(selector), 0) : ctx.querySelector(selector)
    : (selector instanceof Node || selector === window || !selector.length) ? (multiple ? [selector] : selector) : slice.call(selector, 0);
};
},{}],14:[function(require,module,exports){
/** @module query-relative/prev */
var matches = require('matches-selector');
var isNode = require('mutype/is-node');

/**
 * Find prev sibling matching selector
 */
module.exports = function(e, q){
	if (!(isNode(e))) throw Error('Bad argument ' + e);

	while (e = e.previousSibling) {
		if (e.nodeType === 1 && (!q || (isNode(q) ? e === q : matches(e, q)))) return e;
	}
};
},{"matches-selector":4,"mutype/is-node":8}],15:[function(require,module,exports){
/**
 * Custom :pseudos
 *
 * @module  query-relative/pseudos
 */

var closest = require('./closest');

module.exports = {
	closest: function(el, selector){
		return closest(el, selector, true);
	},
	parent: function(el, selector){
		return closest(el, selector, false);
	},
	prev: require('./prev'),
	next: require('./next')
};
},{"./closest":1,"./next":2,"./prev":14}],"query-relative":[function(require,module,exports){
/**
 * @module query-relative
 */

var doc = document;


//TODO: implement third, restricting argument, like jquery: closest(target, '.thing', within);


var _q = require('tiny-element');
var pseudos = require('./pseudos');
var isList = require('mutype/is-array-like');
var isString = require('mutype/is-string');
var isNode = require('mutype/is-node');
var paren = require('parenthesis');
var unique = require('array-uniq');



//detect `:scope`
var scopeAvail = true;
try {
	doc.querySelector(':scope');
}
//scope isn’t supported
catch (e){
	scopeAvail = false;
}



/**
 * Perform query.
 *
 * @param {Array|Element} targets A target elements to perform query from
 * @param {string} str Selector to query
 *
 * @return {Array|Element|null} Queried set or none
 */
function query(str, targets) {
	//we cannot just query first element - relative pseudos are tricky bit
	return query.all(str, targets)[0];
}


/** Perform multiple query */
query.all = function (str, targets) {
	//if str is undefined, ignore query
	if (!str) return [];

	//no target means global target
	if (!targets) targets = [doc];

	var res = q(str, targets);

	return unique(res);
};


/**
 * Query selector including initial pseudos, return list
 *
 * @param {string} str A query string
 * @param {Element}? targets A query context element[s]
 *
 * @return {Array} List of queried elements
 */
function q(str, targets) {
	//treat empty string as a target itself
	if (!str) {
		return isList(targets) ? targets : [targets];
	}

	//filter window etc non-queryable objects
	if (targets === window) {
		targets === [doc];
	}
	else if (!isNode(targets) && !isList(targets)) {
		return [targets];
	}

	//scopify children selector
	str = scopify(targets, str);

	//escape parentheses
	var m, result, parens = paren.parse(str);

	//detect whether query includes special pseudos
	if (m = /:(parent|closest|next|prev)(?:\\([0-9]+))?/.exec(parens[0])) {
		var pseudo = m[1], idx = m.index, param = paren.stringify(parens[m[2]], parens), token = m[0];

		//1. pre-query
		if (idx) {
			targets = queryList(targets, paren.stringify(parens[0].slice(0, idx), parens), true);
		}

		//2. query
		result = transformSet(targets, pseudos[pseudo], param);

		if (!result) {
			return null;
		}
		if (isList(result) && !result.length) return result;

		//2.1 if rest str starts with >, add scoping
		var strRest = paren.stringify(parens[0].slice(idx + token.length).trim(), parens);

		//scopify children selector
		strRest = scopify(result, strRest);

		//3. Post-query or die
		result = q(strRest, result);
	}

	//make default query
	else {
		result = queryList(targets, str);
	}

	return result;
}

/** Query elements from a list of targets, return list of queried items */
function queryList (targets, query) {
	if (isList(targets)) {
		return transformSet(targets, function(item, query){
			return _q.call(item, query, true);
		}, query);
	}
	//q single
	else return _q.call(targets, query, true);
}


/** Apply transformaion function on each element from a list, return resulting set */
function transformSet(list, fn, arg) {
	var res = [];
	if (!isList(list)) list = [list];
	for (var i = list.length, el, chunk; i--;) {
		el = list[i];
		if (el) {
			chunk = fn(el, arg);
			if (chunk) {
				res = [].concat(chunk, res);
			}
		}
	}
	return res;
}


/**
 * Ensure selector string is properly scoped
 *
 * @param {Array|NodeList|Node} list A list of elements or a target node
 * @param {string} str Selector with "bad" symbols
 *
 * @return {string} Fixed selector
 */
function scopify(list, str){
	if (!isString(str)) return str;

	str = str.trim();

	if (!scopeAvail) {
		if (str.slice(0,6) === ':scope') {
			//take off :scope
			str = str.slice(6);
		}

		//ignore ok selector
		else if (str[0] !== '>') return str;

		//fake selector via fake data-attr on selected elements
		var id = genId();
		transformSet(list, function(el, id){
			el.setAttribute('data-__qr', id);
			return el;
		}, id);
		str = '[data-__qr="' + id + '"]' + str;
	}

	else {
		if (str[0] === '>') return ':scope ' + str;
	}

	return str;
}


/** generate unique id for selector */
var counter = Date.now() % 1e9;
function genId(){
	return (Math.random() * 1e9 >>> 0) + (counter++);
}


module.exports = query;

//export pseudos
for (var pseudo in pseudos) {
	module.exports[pseudo] = pseudos[pseudo];
}
},{"./pseudos":15,"array-uniq":3,"mutype/is-array-like":5,"mutype/is-node":8,"mutype/is-string":9,"parenthesis":10,"tiny-element":13}]},{},[]);
