
var Montage = require("../core").Montage;
var Map = require("collections/map").Map;
var Set = require("collections/set").Set;
var Q = require("q");

/**
 * A Context contains a BlueprintContext for the blueprint of every object
 * stored in that context. Objects for a given blueprint can be found, loaded,
 * or queried, and the blueprint change context tracks which objects have
 * changed since the last time the whole context was last committed to the
 * backing object store.
 */
exports.BlueprintContext = Montage.specialize({

    /**
     * Creates a blueprint context for a given blueprint, as a child of the
     * given context.
     */
    constructor: {
        value: function BlueprintContext(blueprint, context) {
            this.blueprint = blueprint;
            this.context = context;
            this.changedObjects = new Set();
            this.objects = new Map();
            this.promises = new Map(); // identifier to promise for object
            // To avoid a closure, bind the assimilate method
            this.assumilate = this._assimilate.bind(this);
            // TODO binder, blueprint binder
        }
    },

    /**
     * Turns an object into a managed object, giving it an individual
     * ObjectContext parented by this BlueprintContext parented by the whole
     * change Context.
     */
    _assimilate: {
        value: function (object) {
            if (object.changeContext) {
                // TODO more information in error
                throw new Error("Cannot assimilate object bound to another change context");
            }
            object.changeContext = new this.context.ObjectContext(object, this);
            this.objects.set(object.changeContext, object);
            return object;
        }
    },

    /**
     * Requests an object for this blueprint and the given identifier and loads
     * it from the backing store if necessary.
     */
    load: {
        value: function (id) {
            var self = this;
            if (!this.promise.has(id)) {
                var object = this.store.load(id);
                var managedObject = object.then(this._assimilate);
                this.promises.set(id, managedObject);
            }
            return this.promises.get(id);
        }
    },

    /**
     * Forgets the object for this blueprint and the given identifier if
     * necessary and reloads the corresponding object from the backing store.
     */
    reload: {
        value: function (id) {
            this.promises.delete(id);
            return this.load(id);
        }
    },

    /**
     * Requests an array of objects for this blueprint and the given
     * identifiers, loading them from the backing store if necessary.
     */
    loadAll: {
        value: function (ids) {
            //if (this.store.loadAll) {
            //    // TODO
            //} else {
                // if loadAll is not implemented by the store, fall
                // back to blasting individual loads
                return Q.all(ids.map(this.load, this));
            //}
        }
    },

    /**
     * Requests the one object for this blueprint that satisfies the given FRB
     * expression, loading it from the backing store if necessary.
     */
    find: {
        value: function (query) {
            throw new Error("Not yet implemented");
        }
    },

    /**
     * Requests an array of objects for this blueprint that satisfy the given
     * FRB expression, loading them from the backing store if necessary.
     */
    findAll: {
        value: function (query) {
            throw new Error("Not yet implemented");
        }
    },

    /**
     * Creates a new instance of the given blueprint locally, which may be
     * assigned a canonical identifier by the backing store when it is
     * committed.
     */
    create: {
        value: function () {
            var object = this.blueprint.newInstance();
            this._assimilate(object);
            this.changedObjects.add(object);
            return object;
        }
    },

    /**
     * Marks an object of this blueprint that has been deleted and should be
     * deleted by the backing store when the Context is committed.
     */
    delete: {
        value: function (object) {
            // TODO verify that object is of the proper type
            object.changeContext.deleted = true;
            this.changedObjects.add(object);
            this.objects.delete(object.changeContext);
        }
    },

    /**
     * Marks an object of this blueprint if it has changed and should be
     * updated by the backing store when the Context is committed.
     * This method is called automatically by the ObjectContext when a property
     * mentioned by the blueprint is altered on the managed object.
     */
    update: {
        value: function (object) {
            this.changedObjects.add(object);
        },
    }

});

