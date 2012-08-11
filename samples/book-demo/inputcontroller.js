/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
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

