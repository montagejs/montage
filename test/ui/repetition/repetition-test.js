/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var querySelector = function(e){return document.querySelector(e);}

var Montage = require("montage").Montage;
var Component = require("montage/ui/component").Component;

var RepetitionTest = exports.RepetitionTest = Montage.create(Montage, {
    listener: {value: function() {

    }},
    simpleArrayController: {value: null}
});
