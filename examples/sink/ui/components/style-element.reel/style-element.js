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
    Component = require("montage/ui/component").Component;

exports.StyleElement = Montage.create(Component, {
    hasTemplate: {value: false},

    _bold: {
        value: false
    },
    bold: {
        get: function() {
            return this._bold;
        },
        set: function(val) {
            this._bold = !!val;
            this.needsDraw = true;
        }
    },
    _underline: {
        value: false
    },
    underline: {
        get: function() {
            return this._underline;
        },
        set: function(val) {
            this._underline = !!val;
            this.needsDraw = true;
        }
    },
    _italic: {
        value: false
    },
    italic: {
        get: function() {
            return this._italic;
        },
        set: function(val) {
            this._italic = !!val;
            this.needsDraw = true;
        }
    },

    draw: {
        value: function() {
            this.element.style.fontWeight = (this._bold) ? "bold" : "normal";
            this.element.style.textDecoration = (this._underline) ? "underline" : "none";
            this.element.style.fontStyle = (this._italic) ? "italic" : "normal";
        }
    }
});
