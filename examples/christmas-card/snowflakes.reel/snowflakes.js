/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage;
var Component = require("montage/ui/component").Component;

exports.Snowflakes = Montage.create(Component, {

    _isAnimating: {
        enumerable: false,
        value: true
    },

    isAnimating: {
        get: function () {
            return this._isAnimating;
        },
        set: function (value) {
            this._previousTime = new Date().getTime();
            this._isAnimating = value;
            this.needsDraw = true;
        }
    },

    snowflakes: {
        enumerable: false,
        value: []
    },

    _previousTime: {
        enumerable: false,
        value: null
    },

    _boundingRadius: {
        enumerable: false,
        value: 83
    },

    _width: {
        enumerable: false,
        value: 800
    },

    _height: {
        enumerable: false,
        value: 450
    },

    _perspective: {
        enumerable: false,
        value: 800
    },

    _ly: {
        enumerable: false,
        value: null
    },

    _ty: {
        enumerable: false,
        value: null
    },

    prepareForDraw: {
        enuemrable: false,
        value: function () {
            var i = 0,
                snowflake = [],
                mod = Math.sqrt(this._perspective * this._perspective + this._width * this._width * .25),
                mod2 = Math.sqrt(this._perspective * this._perspective + this._height * this._height * .25),
                leftX = -this._perspective / mod,
                leftY = this._width / (mod * 2),
                topX = -this._perspective / mod2,
                topY = this._height / (mod2 * 2),
                tx = this._perspective + this._boundingRadius / leftY,
                lx = leftX / leftY,
                x,
                y,
                z;
                
            this._ty = this._perspective + this._boundingRadius / topY;
            this._ly = topX / topY;

            while (i<60) {
                x = Math.random()*1600-800;
                y = Math.random()*1600-800;
                z = Math.random()*800-500;
                if ( ((x>0?z-x*lx:z+x*lx)<tx) && ((y>0?z-y*this._ly:z+y*this._ly)<this._ty) ) {
                    snowflake[i] = {};
                    snowflake[i].x = x;
                    snowflake[i].y = y;
                    snowflake[i].z = z;
                    snowflake[i].time = 0;
                    snowflake[i].opacity = (Math.random() + .4) / 1.4;
                    i++;
                }
            }

            this.snowflakes = snowflake;
            this._previousTime = new Date().getTime();
        }
    },

    _snowflakeElements: {
        enumerable: false,
        value: null
    },

    setFlake: {
        enumerable: false,
        value: function(id, x, y, z, rotationY, rotationZ, opacity) {
            var integer,
                fractional,
                blur,
                element = this._snowflakeElements[id],
                i;

            // if ((y>0?z-y*this._ly:z+y*this._ly)>this._ty) {
			if ((y>0) && ((z-y*this._ly)>this._ty)) {
                this.snowflakes[id].y = -this.snowflakes[id].y;
                y = this.snowflakes[id].y;
            }
            blur = Math.abs(Math.floor(z/-10));
            if (blur<0) {
                blur = 0;
            } else {
                if (blur>24) {
                    blur = 24;
                }
            }
            if (element.style.opacity !== opacity) {
                element.style.opacity = opacity;
            }
            if (this.snowflakes[id].blur !== blur) {
                element.style.backgroundPosition = ((blur%5)*-102) + "px " + ((Math.floor(blur/5))*-102) + "px";
                this.snowflakes[id].blur = blur;
            }
            element.style.webkitTransform = "translate3d("+x+"px,"+y+"px, "+z+"px) rotateY("+rotationY+"rad) rotateZ("+rotationZ+"rad) scale3d("+(1/(1-blur*.02))+", "+(1/(1-blur*.02))+", 1)";
        }
    },

    draw: {
        enumerable: false,
        value: function() {
            var time = new Date().getTime(),
                time2 = time - this._previousTime,
                snowflakes = this.snowflakes,
                i;
            if (time2>200) {
                time2 = 200;
            }
            this._previousTime = time;
            this._snowflakeElements = this.snowflakeRepetition.element.querySelectorAll(".snowflake");
            for (i=0; i<this._snowflakeElements.length; i++) {
                snowflakes[i].time += time2;
                snowflakes[i].y += time2 / 60;
                this.setFlake(
                    i,
                    snowflakes[i].x + Math.sin((i+snowflakes[i].time)/(7000+i*200)) * 60,
                    snowflakes[i].y,
                    snowflakes[i].z,
                    Math.sin(i + snowflakes[i].time / 2500) / 3,
                    i + snowflakes[i].time/7000,
                    snowflakes[i].opacity
                );
            }
            if (this._isAnimating) {
                this.needsDraw = true;
            }
        }
    }

});