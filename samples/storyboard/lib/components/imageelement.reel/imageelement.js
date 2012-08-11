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

exports.TextElement = Montage.create(Component, {

    serializeProperties: {
        value: function(serializer, propertyNames) {
            Component.serializeProperties.apply(this, arguments);

            serializer.set("_isTemplateInstantiated", this._isTemplateInstantiated);
            serializer.set("_isTemplateLoaded", this._isTemplateLoaded);
            serializer.set("_isTemplateLoading", this._isTemplateLoading);
        }
    },

	_positionX: {
		value: null
	},

	positionX: {
		get: function() {
			return this._positionX;
		},
		set: function( val ) {
			this._positionX = val;
			console.log( "positionX", val );
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


	    }

	},

	didDraw: {
	  	value: function(){

	  		this.element.draggable = true;

	  //		console.log( "drawing text element", this.element );

	  //  	Drag.init( this.element );

	 //   	this.element.addEventListener( "dblclick", this, false );

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

  handleDblclick: {
	  	value: function(){


	  		console.log( "dbl click", this.element );

	  		this.richText.focus();


	  	}

  }


});
