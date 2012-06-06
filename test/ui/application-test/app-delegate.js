/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage;

exports.AppDelegate = Montage.create(Montage, {

    willFinishLoadingCalled: {
        value: false
    },

    willFinishLoading: {
        value: function(application) {
            this.willFinishLoadingCalled = true;
        }
    }

});