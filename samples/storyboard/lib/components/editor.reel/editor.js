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
var Montage     = require("montage/core/core").Montage;
var Component 	= require("montage/ui/component").Component;

exports.Editor = Montage.create( Component, {

	slide: {
		value: null
	},

	isSelectingElement: {
		value: false
	},

	_translateX: {
		value: 0
	},

	translateX: {
		set: function(val){
			this._translateX = val;
			this.needsDraw = true;
			console.log( "translateX", val)
		},
		get: function(){
			return this._translateX;
		}
	},

	_translateY: {
		value: 0
	},

	translateY: {
		set: function(val){
			this._translateY = val;
			this.needsDraw = true;
		},
		get: function(){
			return this._translateY;
		}
	},

	selector: {
		value: null
	},

	_selectedElement: {
		value: null
	},

	selectedElement: {
		set: function(val){
			this._selectedElement = val;
			this.selectingElement(val);

		},
		get: function(){
			return this._selectedElement;
		}
	},


	templateDidLoad: {
	  	value: function(){
	  		this.eventManager.addEventListener( "selectElement", this, false );
	  	}
	},

	handleSelectElement: {
	  	value: function(event){
	  		this.selectedElement = event.detail;
	  	}
	},

	draw: {
	  	value: function(){

	  		if( this.isSelectingElement ){

	  			this.selector.element.style.height = this.initialHeight+"px";
	  			this.selector.element.style.width = this.initialWidth+"px";
	  			this.selector.element.style.left = this.initialLeft+"px";
		  		this.selector.element.style.top = this.initialTop+"px";

		  		this.selector.element.style.display = "block";

		  		this.isSelectingElement = false;

	  		} else if( this.selectedElement ){


	  			if( this.selector.isMoving ){

	  				this.selector.element.style.left = this.initialLeft+this.translateX+"px";
		  			this.selector.element.style.top = this.initialTop+this.translateY+"px";

		  			this.selectedElement.translateX = this.translateX;
		  			this.selectedElement.translateY = this.translateY;

		  			console.log( "moving", this.initialLeft, this.initialTop )

	  			}


	  		}
	  	}
	},

	setInitialPosition: {
	  	value: function( val ){





	  	}
	},

	selectingElement: {
	  	value: function( val ){

	  		if( val != null ) {

	  			var slide = val.parentComponent;

	  			var slideOffsetLeft = slide.element.offsetLeft;
		  		var slideOffsetTop = slide.element.offsetTop;

	  			var elementOffsetLeft = val.element.offsetLeft;
	  			var elementOffsetTop = val.element.offsetTop;

	  			var height = val.element.clientHeight;
	  			var width = val.element.clientWidth;
	  			var left = slideOffsetLeft+elementOffsetLeft;
	  			var top = slideOffsetTop+elementOffsetTop;

	  			this.selector.activate( left, top, width+2, height+2 );

	  		//	val.initialLeft = elementOffsetLeft;
	  		//	val.initialTop = elementOffsetTop;



	  		} else {
	  			this.translateX = 0;
				this.translateY = 0;
				this.slide = null;
	  		}


	  	}
	},

	resetEditor: {
	  	value: function( val ){

	  		this.selectedElement = null;


	  	}
	}

});
