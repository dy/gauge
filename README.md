# gauge [![Code Climate](https://codeclimate.com/github/dfcreative/gauge/badges/gpa.svg)](https://codeclimate.com/github/dfcreative/gauge) ![size](https://img.shields.io/badge/size-1.35kb-brightgreen.svg) <a href="UNLICENSE"><img src="http://upload.wikimedia.org/wikipedia/commons/6/62/PD-icon.svg" width="20"/></a>

A simple circular gauge component.

[image]

[demo]

## Installation

`$ npm install component-gauge`

## Example

```js
var Gauge = require('component-gauge');
var q = require('query');

var gauge = new Gauge(q('.gauge'), options);
```


# API

### new Gauge(el, options)

Create a new Gauge component.

### Gauge.prototype.update()

Update gauge rings & marks position.


# Options

| Param | Default | Description |
|---|---|---|
| `angle` | `[150, 390]` | Start and end angles defining gauge’s aperture |
| `values` | `{}` | Dict of labels corresponding to percentage values |
| `colors` | `{}` | Dict of colors corresponding to values |
| `inset` | `false` | Start and end angles defining gauge’s aperture |
| `value` | `50` | Current percentage value |


[![NPM](https://nodei.co/npm/component-gauge.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/component-gauge/)