/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage/core/core").Montage,
    List = require("montage/ui/list.reel").List;

exports.FauxFlow = Montage.create(List, {

    __repetition :{
        serializable: true,
        enumerable: false,
        value: null
    },

    objects: {
        serializable: true,
        value: null
    },

    _repetition: {
        serializable: true,
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
        serializable: true,
        value: "random"
    },

    _tileWidth: {
        enumerable: false,
        value: null
    },

    _tileHeight: {
        enumerable: false,
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
