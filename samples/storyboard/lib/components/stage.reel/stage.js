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
var Montage     = require("montage/core/core").Montage,
	Component 	= require("montage/ui/component").Component,
	Slide 	= require("lib/components/slide.reel").Slide,
	Template 	= require("montage/ui/template").Template;

exports.Stage = Montage.create( Component, {

	slide: {
	    value: null
	},

	_currentSlideIdx: {
	    value: null
	},
	currentSlideIdx: {
	    set: function(val){
	    	if ( val != this._currentSlideIdx ){
	    		this._currentSlideIdx = val;
	      		this.needsDraw = true;
	    	}
	    },
	    get: function(){
	      return this._currentSlideIdx;
	    }
	},

	loadSlide: {
	    value: function( index ) {

	    	this.currentSlideIdx = index;

	    }

	},

	draw: {
	    value: function( index ) {


	    	if( this.slide ) {
	    		//console.log( "slide", this.slide, this.element)
	    		this.removeChildComponent( this.slide );
	    		this.element.removeChild( this.slide.element );
	    		this.slide = null;
	    	}

	    	if( this.currentSlideIdx != null ){
	    		var data = this.application.facade.appData.documentData.slides[this.currentSlideIdx].data;
	    		//	console.log( "data on stage", data);

	            // recuperating the template
		    	var template = Template.create();
		    	template.initWithHtmlString( data );

		    	// deserializing the reel and adding it to stage
		    	this.slide = Slide.create();
		    	this.slide._template = template;
		    	this.slide._isTemplateLoaded = true;
		    	this.slide.element = this.element.appendChild(document.createElement("div"));
		    	this.slide.needsDraw = true;

		    //	console.log( "slide on stage", this.slide);
	    	}

	    }

	}

});
