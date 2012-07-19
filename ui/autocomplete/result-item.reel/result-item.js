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

/**
    @module "montage/ui/autocomplete/result-item.reel"
    @requires montage
    @requires montage/ui/component
    @requires "montage/ui/dynamic-text.reel"
*/
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    DynamicText = require("ui/dynamic-text.reel").DynamicText;

/**
    @class module:"montage/ui/autocomplete/result-item.reel".ResultItem
    @extends module:"montage/ui/dynamic-text.reel".DynamicText
*/
exports.ResultItem = Montage.create(DynamicText, {

    textPropertyPath: {value: null},

    _object: {value: null},
    object: {
        get: function() {
            return this._object;
        },
        set: function(aValue) {
            if(aValue) {
               this._object = aValue;
            }
            if(this._object) {
                if(this.textPropertyPath) {
                    this.value = this._object[this.textPropertyPath];
                } else {
                    this.value = this._object;
                }
            }
        }
    }

});
