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

exports.Textelement = Montage.create(Component, {

    serializeProperties: {
        value: function(serializer, propertyNames) {
            Component.serializeProperties.apply(this, arguments);

            serializer.set("_isTemplateInstantiated", this._isTemplateInstantiated);
            serializer.set("_isTemplateLoaded", this._isTemplateLoaded);
            serializer.set("_isTemplateLoading", this._isTemplateLoading);
        }
    },

	_x: {
		value: null
	},

	x: {
		get: function() {
			return this._x;
		},
		set: function( val ) {
			this._x = val;
			this.needsDraw = true;
		}

	},

	_y: {
		value: null
	},

	y: {
		get: function() {
			return this._y;
		},
		set: function( val ) {
			this._y = val;
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

	move: {
		value: function( x, y ){
			this.x += x;
			this.y += y;
		}
	},

	resize: {
		value: function( width, height ){
			this.width += width;
			this.height += height;
		}
	},



	richText: {
		value: null
	},

	templateDidLoad: {
	    value: function() {



	    }

	},

	prepareForDraw: {
	    value: function() {

	    	this.x = this.element.offsetLeft;
	    	this.y = this.element.offsetTop;
	    	this.width = this.element.clientWidth;
	    	this.height = this.element.clientHeight;
	    }

	},

	didDraw: {
	  	value: function(){

	  	//	this.element.draggable = true;

	  		//this.element.draggable = true;


	  //		console.log( "drawing text element", this.element );

	  //  	Drag.init( this.element );

	    	this.element.addEventListener( "dblclick", this, false );
	    	this.element.addEventListener( "mousedown", this, false );

/*
	  		this.element.onmousedown	= this.mouseDown;

	  		this.element.addEventListener( "click", this.mouseDown, false );

	  		this.element.onDrag = this.mouseDown;

	  		this.element.onClick = function(){ console.log("clicking")};



	  		var el = this.parentComponent.element.getElementsByClassName("textElement")[0];

	  		console.log( "el", el );

	  		el.onClick = function(){ console.log("clicking 2")};
*/
	  	}
  	},

  	draw: {
	  	value: function(){
	  		this.element.style.left = this.x+"px";
	  		this.element.style.top = this.y+"px";
	  		this.element.style.width = this.width+"px";
	  		this.element.style.height = this.height+"px";
	  	}
  	},



  handleDblclick: {
	  	value: function(){


	  //		console.log( "dbl click", this.element );

	  	//	this.richText.focus();


	  	}

  },

  handleMousedown: {
	  	value: function(){

	  	//	console.log( "mousedown", this.element );
	  		dispatchEventWithType( "selectElement", this );

	  	}

  }


});
