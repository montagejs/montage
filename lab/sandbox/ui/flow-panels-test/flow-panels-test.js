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
var Montage = require("montage").Montage;

exports.FlowPanelsTest = Montage.create(Montage, {

    flowPanels: {
        serializable: true,
        value: null
    },

    pageWidth: {
        value: 800
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
            var pagesKnots = [],
                point,
                tangent,
                angle,
                halfPageWidth = this.pageWidth / 2,
                i;

            pagesKnots.push(
                {
                        "knotPosition": [-halfPageWidth * 2, 0, 0],
                        "nextHandlerPosition": [-halfPageWidth * 5 / 3, 0, 0],
                        "previousDensity": 1/2,
                        "nextDensity": 1/2,
                        "opacity": 0
                }
            );
            pagesKnots.push(
                {
                        "knotPosition": [-halfPageWidth, 0, 0],
                        "previousHandlerPosition": [-halfPageWidth * 4 / 3, 0, 0],
                        "nextHandlerPosition": [-halfPageWidth * 2 / 3, 0, 0],
                        "previousDensity": 1/2,
                        "nextDensity": 1/2,
                        "opacity": .999
                }
            );
            pagesKnots.push(
                {
                        "knotPosition": [0, 0, 0],
                        "previousHandlerPosition": [-halfPageWidth / 3, 0, 0],
                        "nextHandlerPosition": [0, 0, -100],
                        "previousDensity": 1/2,
                        "nextDensity": 1/2,
                        "opacity": .999
                }
            );
            pagesKnots.push(
                {
                        "knotPosition": [0, 0, -300],
                        "previousHandlerPosition": [0, 0, -200],
                        "previousDensity": 1.5001,
                        "nextDensity": 1.5001,
                        "opacity": 0
                }
            );
            this.flowPanels.cameraPosition = [0, 0, 1300];
            this.flowPanels.paths = [
                {
                    "knots": pagesKnots,
                    "headOffset": 1,
                    "tailOffset": 1,
                    "units": {
                        "opacity": ""
                    }
                }
            ];
        }
    }

});