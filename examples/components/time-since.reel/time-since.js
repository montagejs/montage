/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

var TimeSince = exports.TimeSince = Montage.create(Component, {
    hasTemplate: {
        value: false
    },

    didCreate: {
        value: function() {
            this._time = new Date;
        }
    },

    _time: {
        value: null
    },

    time: {
        serializable: true,
        get: function() {
            return this._time;
        },
        set: function(value) {
            this._time = new Date(value);
            this._lastTimeDelta = null;
            this.needsDraw = true;
        }
    },

    _lastTimeDelta: {
        value: null
    },

    _timeInterval: {
        value: null
    },

    prepareForDraw: {
        value: function() {
            this.element.setAttribute("title", this.time);
        }
    },

    _drawClock: {
        value: function(type, typeDelta, typeStart) {
            var self = this,
                interval;

            if (type === "now") {
                this._element.textContent = type;
                interval = 1;
            } else {
                this._element.textContent = typeDelta + " " + type + (typeDelta == 1 ? "" : "s") + " ago";
                if (this._lastTimeDelta < typeStart) {
                    interval = typeStart;
                }
            }

            if (interval) {
                clearInterval(this._timeInterval);
                self._timeInterval = setInterval(function() {
                    self.needsDraw = true;
                }, interval * 1000);
            }
        }
    },

    draw: {
        value: function() {
            var seconds = ~~(((+new Date) - +this.time) / 1000),
                minutes = ~~(seconds/60),
                hours = ~~(minutes/60),
                days = ~~(hours/24);

            if (seconds === 0) {
                this._drawClock("now", 0, 0);
            } else if (seconds < 60) {
                this._drawClock("second", seconds, 1);
            } else if (minutes < 60) {
                this._drawClock("minute", minutes, 60);
            } else if (hours < 24) {
                this._drawClock("hour", hours, 3600);
            } else  {
                this._drawClock("day", days, 86400);
            }

            this._lastTimeDelta = seconds;
        }
    }
});