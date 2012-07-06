/* <copyright>
Copyright (c) 2012, Motorola Mobility, Inc
All Rights Reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

  - Redistributions of source code must retain the above copyright notice,
    this list of conditions and the following disclaimer.
  - Redistributions in binary form must reproduce the above copyright
    notice, this list of conditions and the following disclaimer in the
    documentation and/or other materials provided with the distribution.
  - Neither the name of Motorola Mobility nor the names of its contributors
    may be used to endorse or promote products derived from this software
    without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
</copyright> */
var Montage = require("montage/core/core").Montage,
    List = require("montage/ui/list.reel").List;

exports.FauxFlow = Montage.create(List, {

    __repetition :{
        value: null
    },

    objects: {
        value: null
    },

    _repetition: {
        get: function() {
            return this.__repetition;
        },
        set: function(value) {
            this.__repetition = value;

            if (value) {
                this.shuffle();
            }
        }
    },

    shuffle: {
        value: function() {

            var content = this.contentController.organizedObjects,
                    points = [],
                    point,
                    i,
                    iContent,
                    contentCount,
                    repetitionIndex = 0;

            this._repetition.clearIndexMap();

            if ("random" === this.mode) {

                for (i = 0; (iContent = content[i]); i++) {
                    point = {x: (Math.random() * 350) - 150,
                        y: (Math.random() * 100) - 50};

                    if (this.doesIntersect(point.x, point.y, this._tileWidth, this._tileHeight)) {
                        this._repetition.mapIndexToIndex(repetitionIndex, i);
                        repetitionIndex++;
                        points.push(point);
                    }
                }

            } else if ("linear" === this.mode) {

                for (i = 0; (iContent = content[i]); i++) {
                    point = {x: (i * this._tileWidth) + 10, y: 0};

                    if (this.doesIntersect(point.x, point.y, this._tileWidth, this._tileHeight)) {
                        this._repetition.mapIndexToIndex(repetitionIndex, i);
                        repetitionIndex++;
                        points.push(point);
                    }
                }

            } else if ("bookends" === this.mode) {

                contentCount = content.length;

                var firstContent = content[0],
                        lastContent = content[contentCount - 1];

                if (firstContent) {
                    point = {x: 10, y: 0};
                    this._repetition.mapIndexToIndex(repetitionIndex, 0);
                    repetitionIndex++;
                    points.push(point);
                }

                if (lastContent && lastContent !== firstContent) {
                    point = {x: this._tileWidth + 100, y: 0};
                    this._repetition.mapIndexToIndex(repetitionIndex, contentCount - 1);
                    points.push(point)
                }
            }

            this._repetition.refreshIndexMap();
            this.points = points;
            this.needsDraw = true;
        }
    },

    mode: {
        value: "random"
    },

    _tileWidth: {
        value: null
    },

    _tileHeight: {
        value: null
    },

    handleMouseup: {
        value: function(evt) {
            if (evt.target === this.element) {
                this.contentController.selectedIndexes = null;
            }
        }
    },

    prepareForActivationEvents: {
        value: function() {
            if (typeof List.prepareForActivationEvents === "function") {
                List.prepareForActivationEvents.apply(this, Array.prototype.slice.call(arguments));
            }

            this.element.addEventListener("mouseup", this, false);
        }
    },

    prepareForDraw: {
        value: function() {
            var content = this.element.getElementsByClassName("content")[0];

            if (content) {
                this._tileWidth = content.offsetWidth;
                this._tileHeight = content.offsetHeight;
            }

            this.contentController.addPropertyChangeListener("organizedObjects", this, false);
        }
    },

    draw: {
        value: function(timestamp) {

            if (!this.points) {
                return;
            }

            var tiles = this.element.getElementsByClassName("content"),
                iTile,
                i;

            for (i = 0; (iTile = tiles[i]); i++) {
                iTile.style.left = this.points[i].x + "px";
                iTile.style.top = this.points[i].y + "px";
            }
        }
    },

    handleChange: {
        value: function(notification) {
            if ("organizedObjects" === notification.currentPropertyPath) {
                this.shuffle();
            }
        }
    },

    doesIntersect: {
        value: function(x, y, width, height) {
            //TODO this is a very naive implementation that does not account for rotation at all and really
            // only caters to elements that are children of this element

            var containerMinX = 0,
                containerMaxX = this.element.offsetWidth,
                containerMinY = 0,
                containerMaxY = this.element.offsetHeight,
                elementMinX = x,
                elementMaxX = elementMinX + width,
                elementMinY = y,
                elementMaxY = elementMinY + height,
                xOverlap,
                yOverlap;

            xOverlap =  (elementMaxX >= containerMinX && elementMinX <= containerMaxX);
            yOverlap = (elementMaxY >= containerMinY && elementMinY <= containerMaxY);

            return (xOverlap && yOverlap);
        }
    }

});
