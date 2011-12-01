/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage;var Uuid = require("montage/core/uuid").Uuid;

exports.AppDelegate = Montage.create(Montage, {

    _generateUUIDForm: {
        enumerable: false,
        value: null
    },

    generateUUIDForm: {
        enumerable: false,
        get: function() {
            return this._generateUUIDForm;
        },
        set: function(value) {
            if (this._generateUUIDForm) {
                throw "generateUUIDForm already set!";
            }

            this._generateUUIDForm = value;
            this._generateUUIDForm.identifier = "generateUUID";
        }
    },

    uuids: {
        enumerable: false,
        value: null
    },

    deserializedFromTemplate: {
        enumerable: false,
        value: function() {

            this.uuids = [];

            if (this.generateUUIDForm) {
                this.generateUUIDForm.addEventListener("submit", this, false);
            }

        }
    },

    handleGenerateUUIDSubmit: {
        enumerable: false,
        value: function(event) {
            event.preventDefault();
            this.uuids.push(Uuid.generate());
        }
    }


});
