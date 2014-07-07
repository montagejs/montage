
var Montage = require("../core").Montage;
var Map = require("collections/map").Map;
var Set = require("collections/set").Set;

/**
 * Tracks changes to a single object in an editing Context.
 * The ObjectContext is tracked by its parent BlueprintContext, which is in
 * turn tracked by the Context.
 * Every managed object has a corresponding `changeContext` property, pointing
 * to one of these.
 * The object change context is responsible for tracking changes to individual properties
 * and reporting those changes to the store when the Context is committed and
 * the store requests the change list by calling `captureChanges`.
 */
exports.ObjectContext = Montage.specialize({

    /**
     * The corresponding managed object.
     */
    object: {value: null},

    /**
     * The canonical identifier for this object.
     * The backing store may give the object an identifier when it is committed,
     * but until then, the change context serves as a locally unique reference
     * to the managed object.
     */
    id: {value: null},

    /**
     * Notes that the corresponding object should be deleted from the backing
     * store on the next commit if it has not been already.
     */
    deleted: {value: false},

    /**
     * Tracks the new values for every property mentioned by the blueprint for
     * this object has changed.
     * The mapping is reset whenever the changes are captured by
     * `captureChanges`.
     */
    changedProperties: {value: null},

    constructor: {
        value: function ObjectContext(object, blueprintContext) {
            this.object = object;
            // TODO capture snapshot of object state
            // The per-blueprint change context
            this.blueprintContext = blueprintContext;
            // Locally changed objects are unknown to the remote object
            // store and have no corresponding identifier. After they
            // have been committed, the local identifier must be assigned.
            // The presence of an identifier distinguishes "create"
            // from "update" for the commit.
            this.id = null;
            this.deleted = false;
            this.changedProperties = new Map();
        }
    },

    /**
     * Notes that the value for a given key has changed for the managed object.
     * This method is called by the blueprint property setter by way of
     * `blueprintSet`.
     */
    set: {
        value: function (key, value) {
            if (this.deleted) {
                // TODO improve error message
                throw new Error("Property change on deleted object");
            }
            this.changedProperties.set(key, value);
            this.blueprintContext.update(this.object);
        }
    },

    /**
     * Returns an array of property change notifications for every property
     * that the blueprint mentions that has changed since the last call to
    * `captureChanges`.
     */
    captureChanges: {
        value: function () {
            var changes = this.changedProperties.map(function (value, key) {
                return {
                    type: "update",
                    key: key,
                    to: value
                };
            }, this.object);
            this.changedProperties.clear();
            return changes;
        }
    }

});

