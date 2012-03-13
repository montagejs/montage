var Montage = require("montage/core/core").Montage;
var Component = require("montage/ui/component").Component;

exports.RangeInputExample2 = Montage.create(Component, {

	_red: {
		value: 125
	},

	_green: {
		value: 125
	},

	_blue: {
		value: 125
	},

	_opacity: {
		value: 1.0
	},

	colorchip: {
		value: null
	},

	red: {
		get: function() {
			return this._red;
		},
		set: function(value) {
			this._red = Math.round(value);
			this.needsDraw = true;
		}
	},

	blue: {
		get: function() {
			return this._blue;
		},
		set: function(value) {
			this._blue = Math.round(value);
			this.needsDraw = true;
		}
	},

	green: {
		get: function() {
			return this._green;
		},
		set: function(value) {
			this._green = Math.round(value);
			this.needsDraw = true;
		}
	},

	opacity: {
		get: function() {
			return this._opacity;
		},
		set: function(value) {
			this._opacity = value;
			this.needsDraw = true;
		}
	},

	prepareForDraw: {
		value: function() {
			// Prettify code examples
			prettyPrint();
		}
	},


	draw: {
		value: function() {
			this.colorchip.style.background = "rgb(" + this.red + "," + this.green + ", " + this.blue + ")";
			this.colorchip.style.opacity = this.opacity;
			console.log(this.colorchip.style.background);
		}
	}

});