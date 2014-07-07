
var Montage = require("../core").Montage;
var BlueprintContext = require("./blueprint-context").BlueprintContext;
var ObjectContext = require("./object-context").ObjectContext;
var Q = require("q");
var Map = require("collections/map");
var WeakMap = require("collections/weak-map");

/**
 * @class Context
 * @classdesc A `Context` loads managed objects from a database, tracks their
 * changes, and allows the user to apply those changes back to the store.
 * The storage instance is responsible for responding to a `applyChanges` message and
 * using the context's and each object change context's `captureChanges` methods
 * to commit the changes in a single transaction or die trying.
 * It is also responsible for implementing `load`, `loadAll`, `find`, and
 * `findAll`.
 * @extends Montage
 */
exports.Context = Montage.specialize({

    constructor: {
        value: function Context(store) {
            // Defaults to an in-memory context with no store.
            // A context only tracks changes since its last interaction with
            // its intrinsic store, but one can theoretically push changes in
            // bulk to another persistence store.
            this.store = store;
            this.blueprintContexts = new this.BlueprintContextMap(this);
            // TODO prepopulate blueprint context map with the store's
            // affiliated blueprints and use getDefault to throw an error.
            // Disable set.
        }
    },

    /**
     * Get the change context for instances for a given blueprint.
     * @return {BlueprintContext}
     */
    from: {
        value: function (blueprint) {
            return this.blueprintContexts.get(blueprint);
        }
    },

    /**
     * Deletes an object from this change context and notes that this object
     * should be deleted by the backing store when it is committed.
     */
    delete: {
        value: function (object) {
            return this.from(object.blueprint).delete(object);
        }
    },

    /**
     * Apply changes since the last commit to the parent object store.
     * It is the responsibility of the store to implement `applyChanges` using
     * the context's `captureChanges`, so this is a very shallow convenience
     * method.
     */
    commit: {
        value: function () {
            return this.store.applyChanges(this);
        }
    },

    /**
     * Returns an array of all objects for every associated blueprint that have
     * changed since the last call to `captureChanges`.
     */
    captureChanges: {
        value: function () {
            var changes = [];
            this.blueprintContexts.forEach(function (blueprintContext, blueprint) {
                blueprintContext.changedObjects.forEach(function (object) {
                    changes.push(object);
                });
                blueprintContext.changedObjects.clear();
            });
            return changes;
        }
    },

    /**
     * A blueprint context map is an internal data structure that will create
     * entries for arbitrary blueprints on demand, useful for looking up the
     * BlueprintContext for a given blueprint.
     */
    BlueprintContextMap: {
        value: Montage.specialize.call(Map, {
            constructor: {
                value: function BlueprintContextMap(context) {
                    this.context = context;
                    Map.call(this);
                    // Problem fixed in v2, needs backporting
                    this.getDefault = this.constructor.prototype.getDefault;
                }
            },
            getDefault: {
                value: function (blueprint) {
                    var blueprintContext = new this.context.BlueprintContext(blueprint, this.context);
                    this.set(blueprint, blueprintContext);
                    return blueprintContext;
                }
            }
        })
    },

    // Serving in the role as a store.
    /**
     * Tracks the local object context for a child object context.
     * Created on demand only if this context is used as a parent object store.
     */
    _membrane: {
        value: null
    },

    // Serving in the role as a store.
    // Creates an in-memory child context. Changes to this context commit back
    // here.
    createContext: {
        value: function () {
            return new this.constructor(this);
        }
    },

    // Playing the role of a store
    applyChanges: {
        value: function (changeContext) {
            var self = this;
            if (!this._membrane) {
                this._membrane = new WeakMap();
            }
            var membrane = this._membrane;
            return Q.all(changeContext.captureChanges().map(function (childObject) {
                var type, object;
                if (!membrane.has(childObject)) {
                    type = "create";
                    object = this.from(childObject.blueprint).create();
                    membrane.set(childObject, object);
                } else if (childObject.changeContext.deleted) {
                    type = "delete";
                    object = membrane.get(childObject);
                    this.from(childObject.blueprint).delete(object);
                    membrane.delete(childObject);
                } else {
                    object = membrane.get(childObject);
                    type = "update";
                }
                if (type !== "delete") {
                    childObject.changeContext.captureChanges().forEach(function (change) {
                        object.blueprintSet(change.key, change.value);
                    });
                }
            }, this));
        }
    },

    log: {
        value: function (log) {
            log = log || console.log.bind(console);
            log("# Context report");
            this.blueprintContexts.forEach(function (blueprintContext) {
                log(blueprintContext.blueprint.name + ":");
                blueprintContext.objects.forEach(function (object, id) {
                    log("- " + (id ? "(new)" : id));
                });
            });
        }
    },

    BlueprintContext: { value: BlueprintContext },
    ObjectContext: { value: ObjectContext }

});

