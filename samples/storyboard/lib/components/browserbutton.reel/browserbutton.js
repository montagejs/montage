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
    Component   = require("montage/ui/component").Component;

exports.Browserbutton = Montage.create( Component, {

    width: {
        value: 132
    },

    height: {
        value: 97
    },

    _data: {
        value: null
    },

    data: {
        get: function(){
            return this._data;
        },
        set: function(val){

            this._data = val;
            this.updateSlide(val);


        }
    },

    parameter: {
        value: null
    },

    slide: {
        value: null
    },

    slideContainer: {
        value: null
    },


     prepareForDraw: {
        value: function(){

            this.addEventListener("action", this);

            this.updateSlide();

            if( this.data.index == 0 )
            {
                this.application.facade.selectSlide(0);
            }

        }
    },

    didDraw: {
        value: function(){

            this.addEventListener("action", this);

            this.updateSlide();

        }
    },


    handleAction: {
        value: function(event) {

            if( event.target.action == "selectSlide" )
            {
                console.log( "select this", this.data.data)
                dispatchEventWithType( "appAction", { parameter: event.target.action, index: this.data.index }  );
            }
            else if( event.target.action == "addNewSlide" )
            {
                dispatchEventWithType( "appAction", { parameter: event.target.action, index: this.data.index }  );
            }
            else if( event.target.action == "deleteSlide" )
            {
                dispatchEventWithType( "appAction", { parameter: event.target.action, index: this.data.index }  );
            }
            else if( event.target.action == "duplicateSlide" )
            {
                dispatchEventWithType( "appAction", { parameter: event.target.action, index: this.data.index }  );
            }

        }
    },


    select: {
        value: function() {
            this.element.classList.add( "selected-browser-button" );
        }
    },


    unselect: {
        value: function() {
            this.element.classList.remove( "selected-browser-button" );
        }
    },


    updateSlide: {
        value: function( val ) {

            if( this.slide )
            {


                var self = this;
                var data = val;


                setTimeout( function(){

                    if( self.data )
                    {

                        self.slide.element.outerHTML = self.data.data;
                        self.slide._element = self.element.getElementsByClassName("slide")[0];

                        var slide_width  = self.slide.element.style.width.replace( "px", "");
                        var slide_height = self.slide.element.style.height.replace( "px", "");

                        var width_ratio = self.width/slide_width;
                        var height_ratio = self.height/slide_height;


                        self.slideContainer.style.webkitTransformOrigin = "left top";
                        self.slideContainer.style.webkitTransform = "scale(" + height_ratio +")";

                        var new_width = slide_width*height_ratio;

                        var new_x = (self.width-new_width)/2;


                        self.slideContainer.style.left = new_x +"px";

                    }







                }, 10)

            }

        }
    }


});
