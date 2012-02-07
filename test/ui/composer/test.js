/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    logger = require("montage/core/logger").logger("Simple"),
    SimpleTestComposer = require("ui/composer/simple-test-composer").SimpleTestComposer,
    LazyLoadComposer = require("ui/composer/simple-test-composer").LazyLoadTestComposer;

exports.Test = Montage.create(Montage, {
});

exports.ProgrammaticTest = Montage.create(Montage, {

    simpleTestComposer: {
        value: null
    },

    deserializedFromTemplate: {
        value: function() {
            this.simpleTestComposer = SimpleTestComposer.create();
            this.dynamicTextC.addComposer(this.simpleTestComposer);
        }
    }

});

exports.ProgrammaticLazyTest = Montage.create(Montage, {

    simpleTestComposer: {
        value: null
    },

    deserializedFromTemplate: {
        value: function() {
            this.simpleTestComposer = LazyLoadComposer.create();
            this.dynamicTextC.addComposer(this.simpleTestComposer);
        }
    }

});