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

exports.Main = Montage.create(Component, {
    content: {
        value: null
    },

    sidebar: {
        value: null
    },

    // content.selectedItem and sidebar.selectedItem are bound to selectedItem
    _selectedItem: {value: null},
    selectedItem: {
        get: function() {return this._selectedItem;},
        set: function(value) {this._selectedItem = value; this.needsDraw = true;}
    },

    templateDidLoad: {
        value: function() {
            console.log("main templateDidLoad");
        }
    },

    deserializedFromTemplate: {
        value: function() {
            console.log("main deserializedFromTemplate");
        }
    },

    _extractItemFromHash: {
        value: function() {
            var hash = window.location.hash;
            if(hash) {
                return hash.substring(hash.indexOf('#')+1);
            }
            return null;
        }
    },

    prepareForDraw: {
        value: function() {
            console.log("main prepareForDraw");

            // routing logic
            this.selectedItem = this._extractItemFromHash();
            var self = this;
            window.onhashchange = function(event) {
                event.preventDefault();
                var hash = window.location.hash;
                if(hash) {
                    self.selectedItem = self._extractItemFromHash(); //window.location.hash;
                }

            };
        }
    },

    draw: {
        value: function() {
            console.log('main draw');
        }
    },

    didDraw: {
        value: function() {
            console.log('main didDraw');
        }
    }

});
