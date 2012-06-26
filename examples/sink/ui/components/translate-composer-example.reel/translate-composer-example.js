/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

exports.TranslateComposerExample = Montage.create(Component, {

    mover: {
        value: null
    },

    _x: {value: null},
    x: {
        get: function() {
            return this._x;
        },
        set: function(value) {
            this._x = value;
            this.needsDraw = true;
        }
    },

    _y: {value: null},
    y: {
        get: function() {
            return this._y;
        },
        set: function(value) {
            this._y = value;
            this.needsDraw = true;
        }
    },

    draw: {
        value: function() {
            this.example.element.style.top = this._y + "px";
            this.example.element.style.left = this._x + "px";
        }
    },

    prepareForDraw: {
        value: function() {
            // Invoke Google pretty printer on source code samples
            prettyPrint();
        }
    },

    handleEvent: {
        value: function(event) {
            console.log(event.type);
        }
    },

    translate_composer: {
        value: null,
        serializable: true
    },

    example: {
        value: null,
        serializable: true
    },

    logger: {
        value: null,
        serializable: true
    }
});
