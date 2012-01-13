var Montage = require("montage").Montage;
    
var FlowPath = exports.FlowPath = Montage.create(Montage, {

    _translateX: {
	    enumerable: false,
	    value: null
    },
    translateX: {
        get: function () {
            return this._translateX;
        },
        set: function (value) {
            this._translateX = value;
            this._updatePath();
        }
    },
    
    _translateY: {
	    enumerable: false,
	    value: null
    },
    translateY: {
        get: function () {
            return this._translateY;
        },
        set: function (value) {
            this._translateY = value;
            this._updatePath();
        }
    },

    _translateZ: {
	    enumerable: false,
	    value: null
    },
    translateZ: {
        get: function () {
            return this._translateZ;
        },
        set: function (value) {
            this._translateZ = value;
            this._updatePath();
        }
    },
    
    _rotateX: {
	    enumerable: false,
	    value: null
    },
    rotateX: {
        get: function () {
            return this._rotateX;
        },
        set: function (value) {
            this._rotateX = value;
            this._updatePath();
        }
    },
    
    _rotateY: {
	    enumerable: false,
	    value: null
    },
    rotateY: {
        get: function () {
            return this._rotateY;
        },
        set: function (value) {
            this._rotateY = value;
            this._updatePath();
        }
    },
    
    _rotateZ: {
	    enumerable: false,
	    value: null
    },
    rotateZ: {
        get: function () {
            return this._rotateZ;
        },
        set: function (value) {
            this._rotateZ = value;
            this._updatePath();
        }
    },

    _scale: {
	    enumerable: false,
	    value: null
    },
    scale: {
        get: function () {
            return this._scale;
        },
        set: function (value) {
            this._scale = value;
            this._updatePath();
        }
    },
    
    _opacity: {
	    enumerable: false,
	    value: null
    },
    opacity: {
        get: function () {
            return this._opacity;
        },
        set: function (value) {
            this._opacity = value;
            this._updatePath();
        }
    },
    
	_updatePath: {
	    enumerable: false,
	    value: function () {
	        var path = [];
	        
	        if (this._translateX) {
	            path.push("path.translateX="+this._translateX);
	        }
	        if (this._translateY) {
	            path.push("path.translateY="+this._translateY);
	        }
	        if (this._translateZ) {
	            path.push("path.translateZ="+this._translateZ);
	        }
	        if (this._rotateX) {
	            path.push("path.rotateX="+this._rotateX);
	        }
	        if (this._rotateY) {
	            path.push("path.rotateY="+this._rotateY);
	        }
	        if (this._rotateZ) {
	            path.push("path.rotateZ="+this._rotateZ);
	        }
	        if (this._scale) {
	            path.push("path.scale="+this._scale);
	        }
	        if (this._opacity) {
	            path.push("path.style.opacity="+this._opacity);
	        }
	        this.evalPath=path;
	    }
	},
	
	// we should be cautious with this eval, but I wanted to try serializing paths directly
	
	_evalPath: {
	    enumerable: false,
	    value: null
	},
	
	evalPath: {
	    get: function () {
	        return this._evalPath;
	    },
	    set: function (value) {
	        var error=false;
	        
	        if (typeof value === "string") {
	            try {
	                eval("var func=function(slide){var path={};path.style={};"+value+";return path;}");
	                func({
	                    time:0,
	                    speed:0,
	                    index:0
	                });
	            } catch (e) {
	                error=true;
	            }
	            if (!error) {
	                this._evalPath = value;
	            }
	        } else {
	            this._evalPath = value.join(";\r\n")+";";	        
    	        eval("var func=function(slide){var path={};path.style={};"+this._evalPath+"return path;}");	        
    	    }
	        
	        if (!error) {
	            this.path = {
	                value: func
    	        };
    	    }
	    }
	},
	
    _path: {
        enumerable: false,
        value: {
            value: function (slide) {
                 return {};
            }
        }
    },
    
    path: {
        get: function () {
            return this._path;
        },
        set: function (value) {         
            this._path = value;
        }
    }
    
});