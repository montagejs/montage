/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
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
        },
        serializable: true
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
        },
        serializable: true
    },

    rangeStart: {
        value: 0,
        serializable: true
    },

    rangeEnd: {
        value: null,
        serializable: true
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
        },
        serializable: true
    },

    container: {
        value: null,
        serializable: true
    },

    positionText: {
        value: null,
        serializable: true
    },

    savedPositionText: {
        value: null,
        serializable: true
    },

    distanceText: {
        value: null,
        serializable: true
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
