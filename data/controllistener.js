/*
<copyright>
Copyright (c) 2012, Motorola Mobility, Inc

All Rights Reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

  - Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
  - Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
  - Neither the name of Motorola Mobility nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
</copyright>
*/
/**
	@module montage/data/controllistener
    @requires montage/core/core
    @requires montage/core/logger
*/
var Montage = require("montage").Montage;
var logger = require("core/logger").logger("controlListener");
/**
    @class module:montage/data/controllistener.ControlListener
    @extends module:montage/core/core.Montage
*/
var ControlListener = exports.ControlListener = Montage.create(Montage,/** @lends module:montage/data/controllistener.ControlListener# */ {
/**
    Description TODO
    @function
    @param {Property} delegate TODO
    @param {Property} key TODO
    @param {Property} identifier TODO
    @returns null
    */
    callbackForKey: {
        value: function(delegate, key, identifier) {
            if (typeof delegate !== "function") {
                return delegate;
            }
            if ((typeof delegate !== "object") || (typeof key !== "string")) {
                return null;
            }
            if (identifier) {
                var newKey = identifier + key.toCapitalized();
                if (typeof delegate[newKey] === "function") {
                    return delegate[newKey];
                }
            }
            if (typeof delegate[key] === "function") {
                return delegate[key];
            }
            return null;
        }
    }

});
