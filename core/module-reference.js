/**
 * @module montage/core/module-reference
 * @requires montage/core/core
 */
var Montage = require("./core").Montage;

/**
 * @class ModuleReference
 * @extends Montage
 */
exports.ModuleReference = Montage.specialize( /** @lends ModuleReference.prototype */ {
    /**
     * @constructs ModuleReference
     */
    constructor: {
        value: function ModuleReference() {
            return this.super();
        }
    },

    initWithIdAndRequire: {
        value: function (id, require) {
            if (!id || ! require) {
                throw new Error("Module ID and require required");
            }
            this.id = id;
            this.require = require;

            return this;
        }
    },

    /**
     * The absolute id of the module within the `require` package
     * @property {string} value
     */
    id: {
        value: null
    },

    /**
     * The require of a package.
     * @property {function} value
     */
    require: {
        value: null
    },

    _exports: {
        value: null
    },
    /**
     * A promise for the exports of the module. The exports are loaded lazily
     * when the property is accessed.
     *
     * @returns {Promise.<Object>} The exports of the module.
     */
    exports: {
        get: function () {
            if (this._exports) {
                return this._exports;
            }
            return this._exports = this.require.async(this.id);
        }
    },

    /**
     * Resolves this module reference so that it can be required from
     * otherRequire.
     *
     * @function
     * @param {function} otherRequire - Require from another package that has
     * the package of this module as a dependency.
     * @returns {string} The module id to pass to otherRequire that results
     * in this module.
     * @throws {Error} If there is no mapping from this require inside
     * otherRequire.
     *
     * @example
     * var ref = new ModuleReference().initWithIdAndRequire("core/uuid", montageRequire);
     * ref.resolve(applicationRequire); // => "montage/core/uuid"
     *
     * @example
     * var ref = new ModuleReference().initWithIdAndRequire("ui/main.reel", applicationRequire);
     * ref.resolve(montageRequire); // => Error
     * // because there is no module id such that montageRequire(id) can
     * // return the module from inside your application
     */
    resolve: {
        value: function (otherRequire) {
            return otherRequire.identify(this.id, this.require);
        }
    },

    // Used for cross-frame detection, similar to Array.isArray, but just
    // a property as there's no need for complex logic.
    isModuleReference: {
        writable: false,
        configurable: false,
        value: true
    }
});

