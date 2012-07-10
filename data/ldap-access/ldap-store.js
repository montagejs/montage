/* <copyright>
Copyright (c) 2012, Motorola Mobility LLC.
All Rights Reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice,
  this list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of Motorola Mobility LLC nor the names of its
  contributors may be used to endorse or promote products derived from this
  software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
</copyright> */
/**
 @module montage/data/ldap-access/ldap-store
 @requires montage/core/core
 @requires montage/data/store
 @requires montage/core/logger
 @requires data/ldap-access/ldap-mapping
 */
var Montage = require("montage").Montage;
var Store = require("data/store").Store;
var LdapBinderMapping = require("data/ldap-access/ldap-mapping").LdapBinderMapping;
var LdapBlueprintMapping = require("data/ldap-access/ldap-mapping").LdapBlueprintMapping;
var LdapAttributeMapping = require("data/ldap-access/ldap-mapping").LdapAttributeMapping;
var LdapAssociationMapping = require("data/ldap-access/ldap-mapping").LdapAssociationMapping;
var logger = require("core/logger").logger("ldap-store");
/**
 @class module:montage/data/ldap-access/ldap-store.LdapStore
 @extends module:montage/core/core.Montage
 */
var LdapStore = exports.LdapStore = Montage.create(Store, /** @lends module:montage/data/ldap-access/ldap-store.LdapStore# */ {

    /**
     Create a new binder mapping.
     @function
     @returns binder mapping
     */
    createBinderMapping:{
        get:function () {
            return LdapBinderMapping.create();
        }
    },

    /**
     Create a new blueprint mapping.
     @function
     @returns blueprint mapping
     */
    createBlueprintMapping:{
        get:function () {
            return LdapBlueprintMapping.create();
        }
    },

    /**
     Create a new attribute mapping.
     @function
     @returns attribute mapping
     */
    createAttributeMapping:{
        get:function () {
            return LdapAttributeMapping.create();
        }
    },

    /**
     Create a new association mapping.
     @function
     @returns association mapping
     */
    createAssociationMapping:{
        get:function () {
            return LdapAssociationMapping.create();
        }
    }



});
