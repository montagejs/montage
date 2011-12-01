/* <copyright>
This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
(c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
</copyright> */
/**
	@module montage/data/ldapaccess/ldapstore
    @requires montage/core/core
    @requires montage/data/store
    @requires montage/core/logger
*/
var Montage = require("montage").Montage;
var Store = require("data/store").Store;
var logger = require("core/logger").logger("ldapstore");
/**
    @class module:montage/data/ldapaccess/ldapstore.LdapStore
    @extends module:montage/core/core.Montage
*/
var LdapStore = exports.LdapStore = Montage.create(Store,/** @lends module:montage/data/ldapaccess/ldapstore.LdapStore# */ {

/**
    Description TODO
    @function
    @param {Property} binder TODO
    @returns {Boolean} true or false
    */
    canServiceBlueprintBinder: {
        value: function(binder) {
            if ((binder !== null) && (binder.storePrototypeName === "LdapStore")) {
                // TODO [PJYF Apr 28 2011] We need to check that the connection url points to the same DB
                return true;
            }
            return false;
        }
    }


});
