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

var Montage = require("montage/core/core").Montage,
    MutableEvent = require("montage/core/event/mutable-event").MutableEvent,
    Component = require("montage/ui/component").Component;

exports.Inputcontroller = Montage.create(Component, {

    isScrolling: {
        value: false
    },

    deserializedFromSerialization: {
        value: function() {

            document.addEventListener( "keydown", this, false );
            document.body.addEventListener('mousewheel', this, false);

        }
    },

    handleKeydown: {
        value: function( e ){

            // dispatch event "inputEvent", with the keyCode attached to it
            var KEYCODE_LEFT = 37;
            var KEYCODE_RIGHT = 39;
            var KEYCODE_ESC = 27;

            if( event.keyCode == KEYCODE_LEFT )
            {
                dispatchEventWithType( "inputEvent", "left" );
                e.preventDefault();
            }
            else if( event.keyCode == KEYCODE_RIGHT )
            {
                dispatchEventWithType( "inputEvent", "right" );
                e.preventDefault();
            }
            else if( event.keyCode == KEYCODE_ESC )
            {
                dispatchEventWithType( "inputEvent", "escape" );
                e.preventDefault();
            }


        }
    },

    handleMousewheel: {
        value: function( e ){

            var self = this;

            if( !this.isScrolling )
            {

                this.isScrolling = true;
                setTimeout( function(){ self.isScrolling = false }, 1000 )

                var xDelta = e.wheelDeltaX;
                var yDelta = e.wheelDeltaY;

                var xAbs = Math.abs(xDelta);
                var yAbs = Math.abs(yDelta);

                if( xAbs > yAbs  )
                {
                    //horizontal
                    if( xDelta > 0 )
                    {
                        dispatchEventWithType( "inputEvent", "left" );
                    }
                    else
                    {
                        dispatchEventWithType( "inputEvent", "right" );
                    }
                }
                else
                {
                    //vertical
                    if( yDelta > 0 )
                    {
                        dispatchEventWithType( "inputEvent", "up" );
                    }
                    else
                    {
                        dispatchEventWithType( "inputEvent", "down" );
                    }
                }
            }



        }
    }

});

