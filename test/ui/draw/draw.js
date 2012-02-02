/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    _root = require("montage/ui/component")._root,
    logger = require("montage/core/logger").logger("Draw");

var FirstDrawListenerComponent = Montage.create(Component, {
   handleFirstDraw: {
       value: function(event) {
       }
   }
});


var Draw = exports.Draw = Montage.create(Montage, {
    loadComponents: {
        enumerable: false,
        value: function() {
            this.componentA = Montage.create(Component);
            this.componentA.hasTemplate = false;
            this.componentA.element = document.getElementsByClassName("componentA")[0];
            this.componentA1 = Montage.create(Component);
            this.componentA1.hasTemplate = false;
            this.componentA1.element = document.getElementsByClassName("componentA1")[0];
            this.componentB = Montage.create(FirstDrawListenerComponent);
            this.componentB.hasTemplate = false;
            this.componentB.element = document.getElementsByClassName("componentB")[0];
            this.componentB1 = Montage.create(FirstDrawListenerComponent);
            this.componentB1.hasTemplate = false;
            this.componentB1.element = document.getElementsByClassName("componentB1")[0];
            this.componentB2 = Montage.create(Component);
            this.componentB2.hasTemplate = false;
            this.componentB2.element = document.getElementsByClassName("componentB2")[0];
            return this;
        }
    },
    deserializedFromTemplate: {
        value: function() {
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
    }
});