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

exports.Browser = Montage.create( Component, {

    buttonController: {
        value: null,
        serializable: true
    },

	selectedSlide: {
		value: null
	},

    list: {
        value: null
    },

    prepareForDraw: {
        value: function(){

            this.buttonController.addPropertyChangeListener("selectedIndexes", function(event) {
                var idx = event.plus[0];
                console.log( "selected", idx)
            }, false);


        	/*
        	//themes
        	var themesButton = document.querySelector("#btn-themes");
			if (window.touch) {
			   themesButton.addEventListener("touchend", function(event) {
			    	document.body.classList.add('themesPicker');
			   }, false);
			} else {
			    themesButton.addEventListener("click", function(event) {
			    	document.body.classList.add('themesPicker');
			    }, false);
			}


			//templates
			var templatesButton = document.querySelector("#btn-templates");
			if (window.touch) {
			   templatesButton.addEventListener("touchend", function(event) {
			    	document.body.classList.add('themesPicker');
			   }, false);
			} else {
			    templatesButton.addEventListener("click", function(event) {
			    	document.body.classList.add('templatesPicker');
			    }, false);
			}
			*/

        }
    },

    didDraw: {
        value: function(){


        }
    },


    show: {
    	value: function(){
    		this.element.classList.add( "showBrowser" );
    	}
    },


    hide: {
    	value: function(){
    		this.element.classList.remove( "showBrowser" );
    	}
    },

    selectSlideByIndex: {
    	value: function( index ){

    		if( this.selectedSlide )
    		{
    			this.selectedSlide.unselect();
    		}

            this.selectedSlide = this.getSlideByIndex(index);
    		this.selectedSlide.select();

//            console.log( "selecting", index );


    	}
    },

    getSlideByIndex: {
        value: function( index ){

            var slides = this.list._repetition.childComponents;

//            console.log( slides );

            var indexedSlide = null;

            for( var i=0, length = slides.length; i<length; i++ )
            {
                var slide = slides[i];

                if( slide.data.index == index )
                {
                    indexedSlide = slide;
                    break;
                }
            }

            return indexedSlide;

        }
    }



});



