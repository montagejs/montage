/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
	@module test/ui/composer/simple-test-composer
    @requires montage
    @requires montage/ui/composer/composer
*/
var Montage = require("montage").Montage,
    Composer = require("montage/ui/composer/composer").Composer;
/**
 @module test/ui/composer/simple-test-composer
 */
/**
 @class module:test/ui/composer/simple-test-composer.SimpleTestComposer
 @classdesc Used to test that the framework is calling a composer's methods
 @extends module:montage/ui/composer/composer.Composer
 */
exports.SimpleTestComposer = Montage.create(Composer, {

    _loadWasCalled: {
        value: false
    },

/**
    Description TODO
    @function
    @param {Element}
    */
    load: {
        value: function() {
            this._loadWasCalled = true;
        }
    },

/**
    Description TODO
    @function
    */
    unload: {
        value: function() {

        }
    },

    frame: {
        value: function(timestamp) {

        }
    }

});

exports.LazyLoadTestComposer = Montage.create(Composer, {

    lazyLoad: {
        value: true
    },

    _loadWasCalled: {
        value: false
    },

/**
    Description TODO
    @function
    @param {Element}
    */
    load: {
        value: function() {
            this._loadWasCalled = true;
        }
    },

/**
    Description TODO
    @function
    */
    unload: {
        value: function() {

        }
    },

    frame: {
        value: function(timestamp) {

        }
    }

});
