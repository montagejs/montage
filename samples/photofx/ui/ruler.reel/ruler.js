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
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    Point = require("montage/core/geometry/point").Point,
    dom = require("montage/ui/dom");

exports.Ruler = Montage.create(Component, {

    _position: {
        value: null
    },

    position: {
        get: function() {
            return this._position;
        },
        set: function(value) {
            if (value === this._position) {
                return;
            }

            this._position = value;
            this.needsDraw = true;
        }
    },

    _savedPosition: {
        value: null
    },

    savedPosition: {
        get: function() {
            return this._savedPosition;
        },
        set: function(value) {
            if (value === this._savedPosition) {
                return;
            }

            this._savedPosition = value;
            this.needsDraw = true;
        }
    },

    rangeStart: {
        value: 0
    },

    rangeEnd: {
        value: null
    },

    _axis: {
        value: "x"
    },

    axis: {
        get: function() {
            return this._axis;
        },
        set: function(value) {
            if (value === this._axis) {
                return;
            }

            this._axis = value;
            this.needsDraw = true;
        }
    },

    container: {
        value: null
    },

    positionText: {
        value: null
    },

    savedPositionText: {
        value: null
    },

    distanceText: {
        value: null
    },

    prepareForDraw: {
        value: function() {
            if (window.Touch) {
                // TODO add touch support
            } else {
                document.addEventListener("mousemove", this);
            }
        }
    },

    handleMousemove: {
        value: function(evt) {
            var containerPoint = Point.create().init(evt.pageX, evt.pageY);
            if (this.container) {
                containerPoint = dom.convertPointFromPageToNode(this.container, containerPoint);
            }
            this.position = containerPoint[this.axis];
        }
    },

    distance: {
        dependencies: ["savedPosition", "position"],
        get: function() {
            if (null != this.savedPosition && null != this.position) {
                return this.position - this.savedPosition;
            }

            return null;
        }
    },

    draw: {
        value: function() {

            if ("x" === this.axis) {
                this.element.classList.add("horizontal");
                this.element.classList.remove("vertical");
            } else {
                this.element.classList.add("vertical");
                this.element.classList.remove("horizontal");
            }


            var offset = this.position > this.rangeStart ? this.position : this.rangeStart;

            if (null != this.rangeEnd && offset > this.rangeEnd) {
                offset = this.rangeEnd;
            }

            this.positionText.element.style.left = offset + "px";

            var savedOffset = this.savedPosition > this.rangeStart ? this.savedPosition : this.rangeStart;

            if (null != this.rangeEnd && savedOffset > this.rangeEnd) {
                savedOffset = this.rangeEnd;
            }

            this.savedPositionText.element.style.left = savedOffset + "px";

            if (null != this.distance) {
                this.distanceText.element.style.width = Math.abs(this.distance) + "px";

                if (this.distance < 0) {
                    this.distanceText.element.style.left = offset + "px";
                } else {
                    this.distanceText.element.style.left = savedOffset + "px";
                }
            } else {
                this.distanceText.element.style.width = "0";
            }
        }
    }

});
