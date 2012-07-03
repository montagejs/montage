/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage;
exports.Task = Montage.create(Montage, {
    note: {
        enumerable: false,
        value: null
    },

    initWithNote: {
        enumerable: false,
        value: function(note) {
            this.note = note;
            return this;
        }
    },

    completedDate: {
        enumerable: false,
        value: null
    },

    completed: {
        dependencies: ["completedDate"],
        enumerable: false,
        get: function() {
            return !!this.completedDate;
        },
        set: function(value) {
            if ((value && this.completedDate) || (!value && !this.completedDate)) {
                return;
            }

            if (value) {
                this.completedDate = Date.now();
            } else {
                this.completedDate = null;
            }
        }
    },

    serializeSelf: {
        value: function(serializer) {
            serializer.setProperties(["note", "completedDate"]);
        }
    }
});
