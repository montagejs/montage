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
var Montage = require("montage").Montage;
var Store = require("montage/data/store").Store;
var logger = require("montage/core/logger").logger("teststore");
var Promise = require("montage/core/promise").Promise;

var TestStore = exports.TestStore = Montage.create(Store, {

    permanentIdForObjectId$Implementation:{
        value:function (object, context, transactionId) {
            // TODO [PJYF Apr 28 2011] We need to implement it.
            if (typeof object.objectId !== "undefined") {
                return Promise.ref(object.objectId);
            }
            return Promise.ref(null);
        }
    },

    pledgeForObjectId$Implementation:{
        value:function (objectId, context, transactionId) {
            // TODO [PJYF Apr 28 2011] We need to implement it.
            return Promise.ref(null);
        }
    },

    pledgeForSourceObjectAssociation$Implementation:{
        value:function (sourceObject, relationship, context, transactionId) {
            // TODO [PJYF Apr 28 2011] We need to implement it.
            return Promise.ref(null);
        }
    },

    initializeObject$Implementation:{
        value:function (object, context, transactionId) {
            if (typeof object.objectId === "undefined") {
                // TODO [PJYF June 17 2011] This will need to be revisited.
                object.objectId = TemporaryObjectId.create().initWithBlueprint(object.blueprint);
            }
            return Promise.ref(object);
        }
    },

    repledgeObject$Implementation:{
        value:function (object, context, transactionId) {
            if (typeof object.objectId !== "undefined") {
                return this.pledgeForObjectId(object.objectId, context, transactionId);
            }
            return Promise.ref(object);
        }

    },

    /*
     * Called on each store before a save.
     * Upon receiving this message the store should take steps to prepare the commit and insure it will succeed.
     * If the commit cannot succeed it should return a rejected promise.
     */
    prepareToSaveChangesInContext$Implementation:{
        value:function (context, transactionId) {
            // TODO [PJYF Sep 27 2011] This needs to be reimplemented
            return Promise.ref(true);
        }
    },

    /*
     * Called on each store before a revert a prepare to save. Any step taken to prepare the save should be rolled back.
     */
    cancelSaveChangesInContext$Implementation:{
        value:function (context, transactionId) {
            // TODO [PJYF Sep 27 2011] This needs to be reimplemented
            return Promise.ref(true);
        }
    },

    /*
     * Commits the transaction. Any failure during this step will cause the store to be left an inconsistent state.
     */
    commitChangesInContext$Implementation:{
        value:function (context, transactionId) {
            // TODO [PJYF Sep 27 2011] This needs to be reimplemented
            return Promise.ref(true);
        }
    },

    queryInContext$Implementation:{
        value:function (query, context, transactionID) {
            // TODO [PJYF Sept 4 2011] This needs to be implemented
            return Promise.ref([]);
        }
    }


});
