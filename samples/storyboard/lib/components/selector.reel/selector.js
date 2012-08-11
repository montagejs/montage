/* <copyright>
Copyright (c) 2012, Motorola Mobility LLC.
All Rights Reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice,
  this list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of Motorola Mobility LLC nor the names of its
  contributors may be used to endorse or promote products derived from this
  software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
</copyright> */
var Montage = require("montage/core/core").Montage;
var Component = require("montage/ui/component").Component;

exports.Selector = Montage.create(Component, {

	 _x: {
        value: null
    },

    x: {
        get: function(){
            return this._x;
        },
        set: function(value){
            this._x = value;
            this.needsDraw = true;
        }
    },

    _y: {
        value: null
    },

    y: {
        get: function(){
            return this._y;
        },
        set: function(value){
            this._y = value;
            this.needsDraw = true;
        }
    },

    _width: {
        value: null
    },

    width: {
        get: function(){
            return this._width;
        },
        set: function(value){
            this._width = value;
            this.needsDraw = true;
        }
    },

    _height: {
        value: null
    },

    height: {
        get: function(){
            return this._height;
        },
        set: function(value){
            this._height = value;
            this.needsDraw = true;
        }
    },

    _rotation: {
        value: 0
    },

    rotation: {
        get: function(){
            return this._rotation;
        },
        set: function(value){
            this._rotation = value;
            this.needsDraw = true;
        }
    },

    draw: {
        value: function () {

            this.element.style.left     = this.x + "px";
            this.element.style.top      = this.y + "px";
            this.element.style.width    = this.width + "px";
            this.element.style.height   = this.height + "px";

            this.element.style.webkitTransform = "rotate("+this.elementAngle+"rad)";

            if( this.isActivating ){
            	this.element.classList.add("selector_active");
            	this.isActivating = false;
            }

        }
    },

    isActivating: {
	    value: false
	},

	moveHandle: {
	    value: null
	},

	isMoving: {
	    value: false
	},

    resizingOption: {
        value: null
    },

    isRotating: {
        value: false
    },

	activate: {
	    value: function( left, top, width, height ) {
	    	this.x = left;
	    	this.y = top;
	    	this.width = width;
	    	this.height = height;
	    	this.isActivating = true;
	    }
	},

	prepareForDraw: {
	    value: function() {

	    	if ( window.Touch ){
            	console.log( "touch")
                this.element.addEventListener("touchstart", this, false);
            }
            else{
            	console.log( "mouse")
                this.element.addEventListener("mousedown", this, false);
            }

	    }

	},

	handleMousedown: {
	  	value: function(event){

            this.oldX       = this.x;
            this.oldY       = this.y;
            this.oldWidth   = this.width;
            this.oldHeight  = this.height;

	  		if( event.target.classList.contains("move_handle")  ){
            	this.isMoving 	= true;
            	this.start( event.screenX, event.screenY );
            }else if( event.target.classList.contains("lr_handle")  ){
                this.resizingOption   = "lr_handle";
                this.start( event.screenX, event.screenY );
            }else if( event.target.classList.contains("ul_handle")  ){
                this.resizingOption   = "ul_handle";
                this.start( event.screenX, event.screenY );
            }else if( event.target.classList.contains("ur_handle")  ){
                this.resizingOption   = "ur_handle";
                this.start( event.screenX, event.screenY );
            }else if( event.target.classList.contains("ll_handle")  ){
                this.resizingOption   = "ll_handle";
                this.start( event.screenX, event.screenY );
            }else if( event.target.classList.contains("rotate_handle")  ){
                console.log( "rotation")
                this.isRotating   = true;
                this.rectangleToRotateProperties = this.getRectangleProperties(this.element);
                this.rotationX = event.pageX - this.rectangleToRotateProperties.centerX,
                this.rotationY = event.pageY - this.rectangleToRotateProperties.centerY;
                this.initialAngle = Math.atan2(this.rotationY, this.rotationX);
                this.start( event.screenX, event.screenY );
            }

	  	}
  	},

    handleTouchstart: {
        value: function (event) {

            if( event.touches.length == 1 )
            {
                var touch           = event.touches[0];

                this.oldX       = this.x;
                this.oldY       = this.y;
                this.oldWidth   = this.width;
                this.oldHeight  = this.height;

                if( event.target.classList.contains("move_handle")  ){
                    this.isMoving   = true;
                    this.start( touch.pageX, touch.pageY );
                }else if( event.target.classList.contains("lr_handle")  ){
                    this.resizingOption   = "lr_handle";
                    this.start( touch.pageX, touch.pageY );
                }else if( event.target.classList.contains("ul_handle")  ){
                    this.resizingOption   = "ul_handle";
                    this.start( touch.pageX, touch.pageY );
                }else if( event.target.classList.contains("ur_handle")  ){
                    this.resizingOption   = "ur_handle";
                    this.start( touch.pageX, touch.pageY );
                }else if( event.target.classList.contains("ll_handle")  ){
                    this.resizingOption   = "ll_handle";
                    this.start( touch.pageX, touch.pageY );
                }

            }
        }
    },

  	start: {
        value: function (x, y) {
            this._pointerX = x;
            this._pointerY = y;

            if (window.Touch){
                document.addEventListener("touchend", this, false);
                document.addEventListener("touchmove", this, false);
            }
            else{
                document.addEventListener("mouseup", this, false);
                document.addEventListener("mousemove", this, false);
            }
        }
    },

    handleMousemove: {
        value: function (event) {

            if( this.isMoving ){
                this.draggingAction( event.screenX, event.screenY );
            }else if( this.isRotating ){
                this.rotatingAction( event.screenX, event.screenY );
            }else{
                this.resizingAction( event.screenX, event.screenY );
            }
        }
    },

    handleTouchmove: {
        value: function (event) {

            if( event.touches.length == 1 )
            {
                event.preventDefault();

                var touch           = event.touches[0];

                if( !this.isMoving ){
                    this.resizingAction( touch.pageX, touch.pageY );
                }
                else{
                    this.draggingAction( touch.pageX, touch.pageY );
                }

            }

        }
    },

    handleMouseup: {
        value: function (event) {

            this.releaseInterest();
        }
    },

    handleTouchend: {

        value: function (event) {
            this.releaseInterest();
        }
    },


    draggingAction: {
        value: function (x, y) {

            var moveX = ( x - this._pointerX );
            var moveY = ( y - this._pointerY );

            this._pointerX = x;
            this._pointerY = y;

            this.x += moveX;
            this.y += moveY;

            this.application.facade.editor.selectedElement.move( moveX, moveY );

            this.needsDraw = true;

        }
    },



    resizingAction: {

        value: function (x, y) {

            var moveX = x - this._pointerX;
            var moveY = y - this._pointerY;

            this._pointerX = x;
            this._pointerY = y;

            if( this.resizingOption == "lr_handle"){
                this.width += moveX;
                this.height += moveY;

                this.application.facade.editor.selectedElement.resize( moveX, moveY );
            }else if( this.resizingOption == "ul_handle" ){
                this.x += moveX;
                this.y += moveY;
                this.width -= moveX;
                this.height -= moveY;

                this.application.facade.editor.selectedElement.move( moveX, moveY );
                this.application.facade.editor.selectedElement.resize( -moveX, -moveY );
            }else if( this.resizingOption == "ur_handle" ){

                this.y += moveY;
                this.width += moveX;
                this.height -= moveY;

                this.application.facade.editor.selectedElement.move( 0, moveY );
                this.application.facade.editor.selectedElement.resize( moveX, -moveY );
            }else if( this.resizingOption == "ll_handle" ){

                this.x += moveX;
                this.width -= moveX;
                this.height += moveY;

                this.application.facade.editor.selectedElement.move( moveX, 0 );
                this.application.facade.editor.selectedElement.resize( -moveX, moveY );
            }
            this.needsDraw = true;
        }
    },


  	releaseInterest: {

        value: function () {

            if (window.Touch){
                document.removeEventListener("touchend", this, false);
                document.removeEventListener("touchmove", this, false);
            }
            else{
                document.removeEventListener("mouseup", this, false);
                document.removeEventListener("mousemove", this, false);
            }

            if( this.isMoving ){
            	this.isMoving = false;
            }

            if( this.resizingOption ){
                this.resizingOption = null;
            }

            if( this.isRotating ){
                this.isRotating = false;
            }
        }
    },

    //ROTATION

    rotatingAction: {
        value: function (x, y) {

            var x = event.pageX - this.rectangleToRotateProperties.centerX,
                    y = event.pageY - this.rectangleToRotateProperties.centerY,
                    angle = Math.atan2(y, x) - this.initialAngle
                    this.elementAngle = angle + this.rectangleToRotateProperties.rotationAngle;

                    console.log( this.elementAngle)

              //  this.element.style.webkitTransform = "rotate(" + elementAngle + "rad)";

            this.needsDraw = true;

        }
    },

    rectangleToRotateProperties: {
        value: null
    },

    rotationX: {
        value: null
    },

    rotationY: {
        value: null
    },

    initialAngle: {
        value: null
    },

    elementAngle: {
        value: 0
    },



    getElementCornerPoints: {
        value: function(element) {

            // Returns the top-left corner position relative to the page of an element including border.
            // The computation is done without the possible css transforms applied to the element
            // and/or their parents

            var x = 0,
                y = 0;

            do {
                x += element.offsetLeft;
                y += element.offsetTop;
            } while (element = element.offsetParent);
            return {
                x: x,
                y: y
            };
        }
    },

    getRectangleProperties: {
        value: function(element) {
            var width = element.offsetWidth,
                height = element.offsetHeight,
                cornerPoint = this.getElementCornerPoints(element),
                matrix = new WebKitCSSMatrix(window.getComputedStyle(element, null).webkitTransform);

            return {
                width: width,  // width and height including border and padding
                height: height,
                x: cornerPoint.x,
                y: cornerPoint.y,
                centerX: cornerPoint.x + width * .5,  // center point of the element
                centerY: cornerPoint.y + height * .5,
                // angle is computed assuming there are no 3d transforms applied, only 2d rotation
                rotationAngle: Math.atan2(matrix.m12, matrix.m11)  // angle in radians
            };
        }

    }



});
