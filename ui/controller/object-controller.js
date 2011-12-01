/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
 @module montage/ui/controller/object-controller
 @requires montage/core/core
 */
var Montage = require("montage").Montage;
/**
 @class module:montage/ui/controller/object-controller.ObjectController
 @classdesc Generic object controller.
 @extends module:montage/core/core.Montage
 */
var ObjectController = exports.ObjectController = Montage.create(Montage, /** @lends module:montage/ui/controller/object-controller.ObjectController# */ {
/**
        Description TODO
        @type {Property}
        @default null
    */
    objectPrototype: {
        enumerable: false,
        value: null
    },
 /**
    Description TODO
    @function
    @returns this.objectPrototype.create()
    */
    newObject: {
        enumerable: false,
        value: function() {
            return this.objectPrototype.create();
        }
    },

   /**
    Description TODO
    @function
    @param {Property} content TODO
    @returns itself
    */
    initWithContent: {
        value: function(content) {
            this.content = content;
            return this;
        }
    },
    /**
        Description TODO
        @type {Property}
        @default null
    */
    content: {
        enumerable: false,
        value: null
    }



});
