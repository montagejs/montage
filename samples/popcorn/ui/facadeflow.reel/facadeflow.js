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
var Montage     = require("montage").Montage,
    Component   = require("montage/ui/component").Component,
    ArrayController = require("montage/ui/controller/array-controller").ArrayController;

exports.Facadeflow = Montage.create( Component, {
    didCreate: {
        value: function() {
            var controller = ArrayController.create();

            controller.automaticallyOrganizeObjects = true;
            Object.defineBinding(controller, "content", {
                boundObject: this,
                boundObjectPropertyPath: "category",
                oneway: true
            });
            this.buttonController = controller;
        }
    },

    selectedMovie: {
        value: null
    },

    _scroll: {
        value: null
    },

    scroll: {
        set: function(val) {
            this._scroll = val;
            if ( val%1 == 0 && this.category ) {
                this.selectedMovie = this.category[val];
                this.detailsFadeIn = true;
                this.needsDraw = true;
            } else if ( val%1 != 0 && this.category ){
                this.detailsFadeOut = true;
                this.needsDraw = true;
            }
        },
        get: function() {
            return this._scroll;
        }
    },

    _fadeIn: {
        value: false
    },

    _fadeOut: {
        value: false
    },

    latestBoxofficeMovies: {
        value: null
    },

    upcomingMovies: {
        value: null
    },

    inTheaters: {
        value: null
    },

    topDvdRentals: {
        value: null
    },

    category: {
        value: null
    },

    buttonController: {
        value: null
    },

    _switchValue: {
        value: null
    },

    switchValue: {
        set: function(val){
            this._switchValue = val;
        },
        get: function(){
            return this._switchValue;
        }
    },

    pointInCircleAt: { // returns a point in a unit radius circle with center at origin for a given angle
        value: function (angle) {
            return [Math.cos(angle), Math.sin(angle)];
        }
    },

    tangentInCircleAt: { // returns normalized tangent vector for a point in a circle at a given angle
        value: function (angle) {
            return [-Math.sin(angle), Math.cos(angle)];
        }
    },

    scaleVector: {
        value: function (vector, scale) {
            return [
                vector[0] * scale,
                vector[1] * scale
            ];
        }
    },

    templateDidLoad: {
        value: function () {
            this.application.addEventListener( "dataReceived", this, false);
        }
    },

    changeCategory: {
        value: function(category) {
            var self = this;

            this.detailsFadeOut = true;
            this._fadeOut = true;
            this.needsDraw = true;

            // wait .5s until the fade out effect is completed
            setTimeout( function(){
                self.templateObjects.flow.scroll = 0;
                self.category = self[category];
                self.selectedMovie = self.category[0];

                self._fadeIn = true;
                self.detailsFadeIn = true;
                self.needsDraw = true;
            }, 500 );
        }
    },

    handleLaunchApp: {
        value: function (event) {
            // do it manually to avoid fade out effect
            this.category = this.latestBoxofficeMovies;
            this.selectedMovie = this.category[0];
            this.detailsFadeIn = true;
            this._fadeIn = true;
            this.needsDraw = true;
        }
    },

    draw: {
        value: function (event) {
            var flow = this.templateObjects.flow,
                details = this.templateObjects.details;

            if( this._fadeIn ){
                flow.element.classList.remove( 'flow-fade-out');
                this._fadeIn = false;
            }

            if( this._fadeOut ){
                flow.element.classList.add( 'flow-fade-out');
                this._fadeOut = false;
            }

            if( this.detailsFadeIn ){
                details.element.classList.remove('details-fade-out');
                this.detailsFadeIn = false;
            }

            if( this.detailsFadeOut ){
                if( details.element.classList.contains('details-fade-out') == false ){
                    details.element.classList.add('details-fade-out');
                }
                this.detailsFadeOut = false;
            }

        }
    },

    prepareForDraw: {
        value: function() {
            var pagesKnots = [],
                point,
                tangent,
                angle,
                radius = 480,
                bezierHandlerLength = .130976446, // magic number, optimized length of a handler to create a 16-segments cubic bezier unit radius circle
                i,
                flow = this.templateObjects.flow;

            for (i = 0; i <= 8; i++) {
                angle = Math.PI - i * Math.PI / 8;
                point = this.scaleVector(this.pointInCircleAt(angle), radius);
                tangent = this.scaleVector(this.tangentInCircleAt(angle), radius * bezierHandlerLength);
                pagesKnots.push(
                    {
                        "knotPosition": [point[0], 0, -point[1]],
                        "previousHandlerPosition": [point[0] + tangent[0], 0, -point[1] - tangent[1]],
                        "nextHandlerPosition": [point[0] - tangent[0], 0, -point[1] + tangent[1]],
                        "previousDensity": 1,
                        "nextDensity": 1,
                        "rotateY": angle - Math.PI / 2
                    }
                );
            }
            pagesKnots[4].knotPosition[2] = -200;
            pagesKnots[4].nextHandlerPosition[2] = -200;
            pagesKnots[4].previousHandlerPosition[2] = -200;
            flow.cameraPosition = [0, 0, 400];

            var y = 0, z = 0;
            flow.paths = [
                {
                    "knots": pagesKnots,
                    "headOffset": 4,
                    "tailOffset": 4,
                    "units": {
                        "rotateY": "rad"
                    }
                }
            ];
        }
    }
});
