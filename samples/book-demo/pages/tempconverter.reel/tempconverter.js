/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    PressComposer = require("montage/ui/composer/press-composer").PressComposer;

exports.Tempconverter = Montage.create(Component, {

    converter: {
        serializable: true,
        value: null
    },

    _pressComposer: {
        value: null
    },

    didCreate: {
        value: function() {
            this._pressComposer = PressComposer.create();
            this._pressComposer.delegate = this;
            this.addComposer(this._pressComposer);
        }
    },

    surrenderPointer: {
        value: function() {
            return false;
        }
    }

});
