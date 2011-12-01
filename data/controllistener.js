/* <copyright>
This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
(c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
</copyright> */
/**
	@module montage/data/controllistener
    @requires montage/core/core
    @requires montage/core/logger
*/
var Montage = require("montage").Montage;
var logger = require("core/logger").logger("controlListener");
/**
    @class module:montage/data/controllistener.ControlListener
    @extends module:montage/core/core.Montage
*/
var ControlListener = exports.ControlListener = Montage.create(Montage,/** @lends module:montage/data/controllistener.ControlListener# */ {
/**
    Description TODO
    @function
    @param {Property} delegate TODO
    @param {Property} key TODO
    @param {Property} identifier TODO
    @returns null
    */
    callbackForKey: {
        value: function(delegate, key, identifier) {
            if (typeof delegate !== "function") {
                return delegate;
            }
            if ((typeof delegate !== "object") || (typeof key !== "string")) {
                return null;
            }
            if (identifier) {
                var newKey = identifier + key.toCapitalized();
                if (typeof delegate[newKey] === "function") {
                    return delegate[newKey];
                }
            }
            if (typeof delegate[key] === "function") {
                return delegate[key];
            }
            return null;
        }
    }

});
