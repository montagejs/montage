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
var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component;

exports.DynamicTextExample = Montage.create(Component, {

    _currentTime: {value: null},
    currentTime: {
        set: function(value) {this._currentTime = value; this.needsDraw = false;},
        get: function() {return this._currentTime;}
    },

    _intervalId: {value: null},

    draw: {
        value: function() {
            console.log('draw DynamicTextExample');
        }
    },

    didBecomeInactiveInSlot: {
        value: function() {
            if(this._intervalId) {
                clearInterval(this._intervalId);
                this._intervalId = null;
            }
        }
    },

    didBecomeActiveInSlot: {
        value: function() {
            var self = this;
            if(this._intervalId) {
                clearInterval(this._intervalId);
            }
            this._intervalId = setInterval(function() {
                self.currentTime = new Date(Date.now());
            }, 1000);
        }
    },
    prepareForDraw: {
        value: function() {
            // Invoke Google pretty printer on source code samples
            prettyPrint();
        }
    },

    logger: {
        value: null
    }

});
