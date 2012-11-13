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
 @module montage/data/context
 @requires montage/core/core
 @requires montage/data/store
 @requires montage/data/blueprint
 @requires montage/data/object-property
 @requires montage/collections/weak-map
 @requires montage/collections/set
 @requires montage/core/exception
 @requires montage/core/promise
 @requires montage/core/logger
 */
var Montage = require("montage").Montage;
var Store = require("data/store").Store;
var Blueprint = require("data/blueprint").Blueprint;
var ObjectProperty = require("data/object-property").ObjectProperty;
// TODO [June 5 2011 PJYF] This is temporary implementation of WeakMap to let the browser catch up.
var WeakMap = require("collections/weak-map");
var Set = require("collections/set");
var Exception = require("core/exception").Exception;
var Promise = require("core/promise").Promise;
var logger = require("core/logger").logger("change-context");
/**
 @class module:montage/data/change-context.ChangeContext
 @extends module:montage/data/store.Store
 */
var ChangeContext = exports.ChangeContext = Montage.create(Store, /** @lends module:montage/data/change-context.ChangeContext# */ {
    /**
     Collection of object inserted in this context since the last save.
     @private
     */
    _inserted: {
        value: new Set(50),
        serializable: true,
        distinct: true,
        enumerable: false,
        writable: false
    },
    /**
     Collection of object deleted in this context since the last save.
     @private
     */
    _deleted: {
        value: new Set(50),
        serializable: true,
        distinct: true,
        enumerable: false,
        writable: false
    },
    /**
     Collection of object modified in this context since the last save.
     @private
     */
    _modified: {
        value: new Set(50),
        serializable: true,
        distinct: true,
        enumerable: false,
        writable: false
    },

    /**
     Table of fetched objects for uniquing. The key is the object ID the value the actual object or the pledge representing it.<br/>
     <b>Note:<b/> This is a weak map so that the context does not hold on the objects and they can be garbage collected if no one else hold on them.
     @private
     */
    _objectMap: {
        value: new WeakMap(),
        serializable: true,
        enumerable: false,
        writable: false
    },

    /**
     Collection of object inserted in this context since the last save.
     @function
     @returns this._inserted
     @default empty set
     */
    inserted: {
        get: function() {
            return this._inserted;
        }
    },

    /**
     Collection of object deleted in this context since the last save.
     @function
     @returns this._deleted
     @default empty set
     */
    deleted: {
        get: function() {
            return this._deleted;
        }
    },

    /**
     Collection of object modified in this context since the last save.
     @function
     @returns this._modified
     @default empty set
     */
    modified: {
        get: function() {
            return this._modified;
        }
    },

    /**
     Description TODO
     @function
     @param {String} id objectmap
     @returns this._objectMap.get(id) | null
     */
    objectForId: {
        value: function(id) {
            if (this._objectMap.has(id)) {
                return this._objectMap.get(id);
            }
            return null;
        }
    },

    /**
     Inserts a newly created object in the context.
     @function
     @param {Object} instance TODO
     @returns initialized object
     */
    insert: {
        value: function(instance) {
            if (instance !== null) {
                if (typeof instance.context === "undefined") {
                    var metadata = Montage.getInfoForObject(instance);
                    var blueprint = this.blueprintForPrototype(metadata.objectName, metadata.moduleId);
                    if (blueprint !== null) {
                        ObjectProperty.manager.apply(Object.getPrototypeOf(instance), blueprint);
                    } else {
                        throw Exception.create().initWithMessageTargetAndMethod("Cannot find blueprint for: " + metadata.objectName + " " + metadata.moduleId, this, "insert");
                    }
                }
                if (instance.context === null) {
                    instance.context = this;
                    this._inserted.add(instance);
                    return this.initializeObject(instance, this).then(function(instance) {
                        instance.context._objectMap.set(instance.objectId, instance);
                        return Promise.resolve(instance);
                    });
                } else if (instance.context !== this) {
                    throw Exception.initWithMessageTargetAndMethod("This instance is already inserted in another context.", this, "insert");
                }
            } else {
                throw Exception.initWithMessageTargetAndMethod("Cannot insert a null object.", this, "insert");
            }
        }
    },

    /**
     Delete an object.<br>
     A deleted object will be deleted from the backing store on the next save.
     @function
     @param {Object} instance TODO
     @returns Promise.resolve(instance)
     */
    'delete': {
        value: function(instance) {
            if (instance !== null) {
                if ((typeof instance.context === "undefined") || (instance.context === null)) {
                    return Promise.resolve(instance);
                }
                if (instance.context !== this) {
                    throw Exception.initWithMessageTargetAndMethod("This instance is belongs to another context.", this, "delete");
                }
                if (this._inserted.has(instance)) {
                    // We are forgetting a newly inserted object
                    this._inserted.delete(instance);
                    if (typeof instance.context !== "undefined") {
                        instance.context = null;
                    }
                } else {
                    if (this._modified.has(instance)) {
                        // the object was modified before teh delete forget those.
                        this._modified.delete(instance);
                        instance = this._revertValues(instance);
                    }
                    this._deleted.add(instance);
                }
                this._objectMap.delete(instance.objectId);
            } else {
                throw Exception.initWithMessageTargetAndMethod("Cannot delete a null object.", this, "delete");
            }
            return Promise.resolve(instance);
        }
    },

    /**
     Revert an object to its saved values.
     @function
     @param {Object} instance TODO
     @returns Promise.resolve(instance)
     */
    revert: {
        value: function(instance) {
            if (instance !== null) {
                if (typeof instance.context === "undefined") {
                    return Promise.resolve(instance);
                }
                if (instance.context !== null) {
                    if (instance.context !== this) {
                        throw Exception.initWithMessageTargetAndMethod("This instance is belongs to another context.", this, "revert");
                    }
                    if (this._inserted.has(instance)) {
                        // This is a newly inserted object, there is no value to revert to, so do nothing.
                    } else if (this._modified.has(instance)) {
                        this._modified.delete(instance);
                        instance = this._revertValues(instance);
                    }
                } else {
                    // Maybe that object was deleted let retrieve it?
                    if (this._deleted.has(instance)) {
                        this._deleted.delete(instance);
                        instance.context = this;
                        instance = this._revertValues(instance);
                    }
                }
            } else {
                throw Exception.initWithMessageTargetAndMethod("Cannot revert a null object.", this, "revert");
            }
            return  Promise.resolve(instance);
        }
    },

    /**
     Description TODO
     @private
     */
    _revertValues: {
        value: function(instance) {
            // TODO [PJYF May 24 2011] We should restore the saved values
            return  Promise.resolve(instance);
        }
    },

    /**
     Saves all current changes and deletion to the backing store.
     @function
     */
    save: {
        value: function() {
            // TODO [PJYF Sept 4 2011] This is probably incomplete - we need to handle the callback
            if (this.hasChanges()) {
                this.parent.saveChangesInContext(this);
            }
        }
    },

    /**
     This method from the parent store is overwritten to handle the save from the child context.
     @function
     @param {Property} context The child context
     @param {String} transactionID The transaction id
     */
    saveChangesInContext$Implementation: {
        value: function(context, transactionID) {
            if (context === this) {
                // If called on it-self then save the context
                Store.saveChangesInContext$Implementation.call(this, context, transactionID);
            }
            // The context has all the changes and we need to merge them with our own.
            var inserted = context.inserted;
            var deleted = context.deleted;
            var modified = context.modified;

            var newUpdated = null;
            var removedInserted = null;

            // First create and insert all new objects
            inserted.forEach(function(object) {
                var gid = object.objectId;
                var localObject = this.objectForId(gid);

                if (localObject == null) {
                    // Insert a copy in our context.
                    ;
                } else {
                    // Inserting an object already registered in my context? Pretty bogus! Treat it as an update.
                    ;
                    // Remove from the inserted list and add it to the updated one.
                    ;
                }

            });

            // Initialize the property values in these new objects.

            // Copy the values for all updated objects.

            // Delete removed Objects.

            // TODO [PJYF Sept 4 2011] This needs to be reimplemented

        }
    },

    /**
     Description TODO
     @function
     @param {String} attribute TODO
     @param {Object} instance TODO
     */
    fulfillPropertyForInstance: {
        value: function(attribute, instance) {

        }
    },

    /**
     Description TODO
     @function
     @param {String} attribute TODO
     @param {Object} instance TODO
     */
    willModifyPropertyForInstance:  {
        value: function(attribute, instance, value) {
            // TODO [PJYF Sep 30 2011] We should probably be smarter.
            this._modified.add(instance);
        }
    },

    /**
     Fetch objects from the backing store.
     @function
     @param {String} query TODO
     @returns Promise.resolve(this.parent.queryInContext(query, this))
     */
    query: {
        value: function(query) {
            // TODO [PJYF Sept 23 2011] This is probably incomplete - we need to handle the refresh
            return Promise.resolve(this.parent.queryInContext(query, this));
        }
    },

    /**
     Reload all objects from the backing store and merges changes in the context with the new values.<br>
     If the target passed is an Array each object will be refreshed.
     @function
     @param {Object} target The target to be refreshed.
     @returns Promise.resolve(this.repledgeObject(target, this))
     */
    refresh: {
        value: function(target) {
            // TODO [PJYF May 10 2011] This is incorrect we need to merge the changes in the refaulted objects
            return Promise.resolve(this.repledgeObject(target, this));
        }
    },

    /**
     Check if there are unsaved changes in the context.
     @function
     @returns this._inserted.length > 0 or this._modified.length > 0 or this._deleted.length > 0
     */
    hasChanges: {
        value: function() {
            return this._inserted.length > 0 || this._modified.length > 0 || this._deleted.length > 0;
        }
    }

});
