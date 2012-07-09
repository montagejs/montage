/* <copyright>
Copyright (c) 2012, Motorola Mobility, Inc
All Rights Reserved.
BSD License.

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

var Montage = require("montage").Montage,
    Component = require("ui/component").Component;

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
