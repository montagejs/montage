/* <copyright>
Copyright (c) 2012, Motorola Mobility, Inc

All Rights Reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

  - Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
  - Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
  - Neither the name of Motorola Mobility nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
</copyright> */
var Montage = require("montage").Montage,
    Textfield = require("montage/ui/textfield.reel").Textfield;

var TextfieldTest = exports.TextfieldTest = Montage.create(Montage, {
    deserializedFromTemplate: {
        enumerable: false,
        value: function() {

            var element1 = document.getElementById("textfield1"),
            element2 = document.getElementById("textfield2"),
            element3 = document.getElementById("textfield3");

            this.textfield1 = Textfield.create();
            this.textfield2 = Textfield.create();
            this.textfield3 = Textfield.create();

            this.textfield1.element = element1;
            this.textfield2.element = element2;
            this.textfield3.element = element3;

            this.textfield1.needsDraw = true;
            this.textfield2.needsDraw = true;
            this.textfield3.needsDraw = true;

            return this;
        }
    },

    textfield1: {
        value: null
    },

    textfield2: {
        value: null
    },

    textfield3: {
        value: null
    }
});
