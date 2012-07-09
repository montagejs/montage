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
var Montage = require("montage").Montage;

exports.MixedList = Montage.create(Montage, {

    handleAddButtonAction: {
        value: function(event) {
            var length = this.choices.length;
            this.objectList.push(this.choices[Math.floor ( Math.random() * length )]);
        }
    },

    choices: {
        value: [
            {
                "type": "boolean",
                "value": false
            },
            {
                "type": "boolean",
                "value": true
            },
            {
                "type": "range",
                "value": 0
            },
            {
                "type": "range",
                "value": 20
            },
            {
                "type": "range",
                "value": 75
            },
            {
                "type": "range",
                "value": 100
            },
            {
                "type": "check",
                "value": false
            },
            {
                "type": "check",
                "value": true
            }
        ]
    },

    objectList: {
        value: null
    },

    templateDidLoad: {
        value: function() {
            this.objectList = [{"type": "boolean","value": true}];
        }
    }
});

exports.SubstitutionDelegate = Montage.create(Montage, {

    slotElementForComponent: {
        value: function(contentToAppend, nodeToAppend) {
            var element = document.createElement("div");
            if (contentToAppend.switchValue === "boolean") {
                element = document.createElement("input");
                element.setAttribute("type", "radio");
            } else if (contentToAppend.switchValue === "check") {
                element = document.createElement("input");
                element.setAttribute("type", "checkbox");
            } else if (contentToAppend.switchValue === "range") {
                element = document.createElement("input");
                element.setAttribute("type", "range");
            }
            return element;
        }
    }

});
