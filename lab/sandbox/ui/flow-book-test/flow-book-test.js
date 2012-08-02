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

exports.FlowBookTest = Montage.create(Montage, {

    flowBook: {
        serializable: true,
        value: null
    },

    pageWidth: {
        value: 512
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
            var oddPagesKnots = [], // the odd pages are at the right side in a book
                evenPagesKnots = [],
                bezierHandlerLength = .130976446, // magic number, optimized length of a handler to create a 16-segments cubic bezier unit radius circle
                point,
                tangent,
                angle,
                halfPageWidth = this.pageWidth / 2,
                i;

            oddPagesKnots.push(
                {
                        "knotPosition": [-halfPageWidth, 0, -2],
                        "previousHandlerPosition": [-halfPageWidth, 0, -2],
                        "nextHandlerPosition": [-halfPageWidth, 0, -2],
                        "previousDensity": 15 / 8,
                        "nextDensity": 15 / 8,
                        "rotateY": -Math.PI,
                        "opacity": .999
                }
            );
            for (i = 0; i <= 8; i++) {
                angle = Math.PI - i * Math.PI / 8;
                point = this.scaleVector(this.pointInCircleAt(angle), halfPageWidth);
                tangent = this.scaleVector(this.tangentInCircleAt(angle), halfPageWidth * bezierHandlerLength);
                oddPagesKnots.push(
                    {
                        "knotPosition": [point[0], 0, point[1]],
                        "previousHandlerPosition": [point[0] + tangent[0], 0, point[1] + tangent[1]],
                        "nextHandlerPosition": [point[0] - tangent[0], 0, point[1] - tangent[1]],
                        "previousDensity": 1 / 8,
                        "nextDensity": 1 / 8,
                        "rotateY": -angle,
                        "opacity": .999
                    }
                );
            }
            oddPagesKnots[1].previousHandlerPosition = [-halfPageWidth, 0, 0];
            oddPagesKnots[9].nextHandlerPosition = [halfPageWidth, 0, 0];
            oddPagesKnots.push(
                {
                        "knotPosition": [halfPageWidth, 0, -1],
                        "previousHandlerPosition": [halfPageWidth, 0, -1],
                        "nextHandlerPosition": [halfPageWidth, 0, -1],
                        "previousDensity": 7 / 8,
                        "nextDensity": 7 / 8,
                        "rotateY": 0,
                        "opacity": .85
                }
            );
            oddPagesKnots.push(
                {
                        "knotPosition": [halfPageWidth, 0, -1],
                        "previousHandlerPosition": [halfPageWidth, 0, -1],
                        "nextHandlerPosition": [halfPageWidth, 0, -1],
                        "previousDensity": 0,
                        "nextDensity": 0,
                        "rotateY": 0,
                        "opacity": 0
                }
            );
            oddPagesKnots.push(
                {
                        "knotPosition": [halfPageWidth, 0, -1],
                        "previousHandlerPosition": [halfPageWidth, 0, -1],
                        "nextHandlerPosition": [halfPageWidth, 0, -1],
                        "previousDensity": 1 / 2,
                        "nextDensity": 1 / 2,
                        "rotateY": 0,
                        "opacity": 0
                }
            );

            // even

            evenPagesKnots.push(
                {
                        "knotPosition": [-halfPageWidth, 0, -2],
                        "previousHandlerPosition": [-halfPageWidth, 0, -2],
                        "nextHandlerPosition": [-halfPageWidth, 0, -2],
                        "previousDensity": 1 / 8,
                        "nextDensity": 1 / 8,
                        "rotateY": 0,
                        "opacity": 0
                }
            );
            evenPagesKnots.push(
                {
                        "knotPosition": [-halfPageWidth, 0, -2],
                        "previousHandlerPosition": [-halfPageWidth, 0, -2],
                        "nextHandlerPosition": [-halfPageWidth, 0, -2],
                        "previousDensity": 7 / 8,
                        "nextDensity": 7 / 8,
                        "rotateY": 0,
                        "opacity": .85
                }
            );
            for (i = 0; i <= 8; i++) {
                angle = Math.PI - i * Math.PI / 8;
                point = this.scaleVector(this.pointInCircleAt(angle), halfPageWidth);
                tangent = this.scaleVector(this.tangentInCircleAt(angle), halfPageWidth * bezierHandlerLength);
                evenPagesKnots.push(
                    {
                        "knotPosition": [point[0], 0, point[1]],
                        "previousHandlerPosition": [point[0] + tangent[0], 0, point[1] + tangent[1]],
                        "nextHandlerPosition": [point[0] - tangent[0], 0, point[1] - tangent[1]],
                        "previousDensity": 1 / 8,
                        "nextDensity": 1 / 8,
                        "rotateY": -angle + Math.PI,
                        "opacity": .999
                    }
                );
            }
            evenPagesKnots[2].previousHandlerPosition = [-halfPageWidth, 0, 0];
            evenPagesKnots[10].nextHandlerPosition = [halfPageWidth, 0, 0];
            evenPagesKnots.push(
                {
                        "knotPosition": [halfPageWidth, 0, -1],
                        "previousHandlerPosition": [halfPageWidth, 0, -1],
                        "nextHandlerPosition": [halfPageWidth, 0, -1],
                        "previousDensity": 15 / 8,
                        "nextDensity": 15 / 8,
                        "rotateY": Math.PI,
                        "opacity": .999
                }
            );
            this.flowBook.paths = [
                {
                    "knots": oddPagesKnots,
                    "headOffset": 2,
                    "tailOffset": 2,
                    "units": {
                        "rotateY": "rad",
                        "opacity": ""
                    }
                },
                {
                    "knots": evenPagesKnots,
                    "headOffset": 2,
                    "tailOffset": 1,
                    "units": {
                        "rotateY": "rad",
                        "opacity": ""
                    }
                }
            ];
        }
    }

});