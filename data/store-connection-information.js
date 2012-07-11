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
 @module montage/data/store-connection-information
 @requires montage/core/core
 @requires montage/core/logger
 */
var Montage = require("montage").Montage;
var logger = require("core/logger").logger("store-connection-information");
/**
 @class module:montage/data/store-connection-information.StoreConnectionInformation
 @extends module:montage/core/core.Montage
 */
var StoreConnectionInformation = exports.StoreConnectionInformation = Montage.create(Montage, /** @lends module:montage/data/store-connection-information.StoreConnectionInformation# */ {

    initWithNameAndInformation:{
        value:function (name, url, username, password) {
            this._name = name;
            this._url = url;
            this._username = username;
            this._password = password;
            return this;
        }
    },

    equals:{
        value:function (other) {
            if (!other) {
                return false;
            }
            var otherMetadata = Montage.getInfoForObject(other);
            if (!otherMetadata) {
                return false;
            }
            var thisMetadata = Montage.getInfoForObject(this);
            if ((otherMetadata.objectName === thisMetadata.objectName) && (otherMetadata.moduleId === thisMetadata.moduleId)) {
                return (this._name === other._name) && (this._url === other._url) && (this._username === other._username) && (this._password === other._password);
            }
            return false;
        }
    },

    /**
     @private
     */
    _name:{
        serializable:true,
        enumerable:false,
        value:null
    },

    /**
     Name of the object. The name is used to identify the connection information.
     @function
     @returns {String} this._name
     */
    name:{
        get:function () {
            return this._name;
        }
    },

    /**
     @private
     */
    _url:{
        serializable:true,
        enumerable:false,
        value:null
    },

    /**
     Returns the connection url.
     @function
     @returns this._url
     */
    url:{
        get:function () {
            return this._url;
        }
    },

    /**
     @private
     */
    _username:{
        serializable:true,
        enumerable:false,
        value:null
    },

    /**
     Returns the connection username.
     @function
     @returns this._username
     */
    username:{
        get:function () {
            return this._username;
        }
    },

    /**
     @private
     */
    _password:{
        serializable:true,
        enumerable:false,
        value:null
    },

    /**
     Returns the connection password.
     @function
     @returns this._password
     */
    password:{
        get:function () {
            return this._password;
        }
    }

});
