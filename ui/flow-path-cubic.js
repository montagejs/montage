var Montage = require("montage").Montage;
    
var FlowPathCubic = exports.FlowPathCubic = Montage.create(Montage, {
	
    _variable: {
        enumerable: false,
        value: "time"
    },
    
    variable: {
        get: function () {
            return this._variable;
        },
        set: function (value) {
            switch (value) {
                case "speed":
                case "index":
                    this._variable = value;
                    break;
                default:
                    this._variable = "time";
            }
            this._updatePath();
        }
    },
    
    _a: {
        enumerable: false,
        value: 0
    },
    
    a: {
        get: function () {
            return this._a;
        },
        set: function (value) {
            this._a = value;
            this._updatePath();
        }
    },

    _b: {
        enumerable: false,
        value: 0
    },
    
    b: {
        get: function () {
            return this._b;
        },
        set: function (value) {
            this._b = value;
            this._updatePath();
        }
    },

    _c: {
        enumerable: false,
        value: 0
    },
    
    c: {
        get: function () {
            return this._c;
        },
        set: function (value) {
            this._c = value;
            this._updatePath();
        }
    },

    _d: {
        enumerable: false,
        value: 0
    },
    
    d: {
        get: function () {
            return this._d;
        },
        set: function (value) {
            this._d = value;
            this._updatePath();
        }
    },
    
    _path: {
        enumerable: false,
        value: "0"
    },
    
    path: {
        get: function () {
            return this._path;
        },
        set: function (value) {
            this._path = value;
        }
    },
    
    _updatePath: {
        enumerable: false,
        value: function () {
            var s = "slide."+this._variable;
            
            this.path = "("+this._a+")*"+s+"*"+s+"*"+s+"+("+this._b+")*"+s+"*"+s+"+("+this._c+")*"+s+"+("+this._d+")";
        }
    }
});