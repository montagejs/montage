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
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    _root = require("montage/ui/component")._root,
    logger = require("montage/core/logger").logger("Draw");
var TestController = require("montage-testing/test-controller").TestController;

var FirstDrawListenerComponent = Component.specialize( {
   handleFirstDraw: {
       value: function (event) {
       }
   }
});


var Draw = exports.Draw = TestController.specialize( {
    loadComponents: {
        enumerable: false,
        value: function () {
            if (this.componentA) {
                this.componentA.dispose();
            }
            if (this.componentA1) {
                this.componentA1.dispose();
            }
            if (this.componentB) {
                this.componentB.dispose();
            }
            if (this.componentB1) {
                this.componentB1.dispose();
            }
            if (this.componentB2) {
                this.componentB2.dispose();
            }

            this.componentA = new Component();
            this.componentA.hasTemplate = false;
            this.componentA.element = document.getElementsByClassName("componentA")[0];
            this.componentA.attachToParentComponent();
            this.componentA1 = new Component();
            this.componentA1.hasTemplate = false;
            this.componentA1.element = document.getElementsByClassName("componentA1")[0];
            this.componentA1.attachToParentComponent();
            this.componentB = new FirstDrawListenerComponent();
            this.componentB.hasTemplate = false;
            this.componentB.element = document.getElementsByClassName("componentB")[0];
            this.componentB.attachToParentComponent();
            this.componentB1 = new FirstDrawListenerComponent();
            this.componentB1.hasTemplate = false;
            this.componentB1.element = document.getElementsByClassName("componentB1")[0];
            this.componentB1.attachToParentComponent();
            this.componentB2 = new Component();
            this.componentB2.hasTemplate = false;
            this.componentB2.element = document.getElementsByClassName("componentB2")[0];
            this.componentB2.attachToParentComponent();
            return this;
        }
    },
    deserializedFromTemplate: {
        value: function () {
            window.test = this;
            this.loadComponents();
            this.componentA.needsDraw = true;
            this.componentA1.needsDraw = true;
            this.componentB.needsDraw = true;
            this.componentB1.needsDraw = true;
            this.componentB2.needsDraw = true;
        }
    },

    _root: {
        value: _root
    },
    componentA: {
        value: null
    },
    componentA1: {
        value: null
    },
    componentB: {
        value: null
    },
    componentB1: {
        value: null
    },
    componentB2: {
        value: null
    },
    componentC: {
        value: null
    },
    componentC1: {
        value: null
    },

    class1: {
        value: true
    },

    class2: {
        value: false
    },

    classListTemplate1: {
        value: true
    },

    classListTemplate2: {
        value: false
    }
});
