/**
 * @module montage/core/enum
 * @requires montage/core/core
 * @requires montage/core/logger
 */
var Montage = require("./core").Montage,
    logger = require("./logger").logger("enum");

/**
 * @class Enum
 * @extends Montage
 */
exports.Enum = Montage.specialize( /** @lends Enum# */ {

    _value: {
        value: 0
    },

    constructor: {
        value: function Enum() {
            this.super();
        }
    },

    /**
     * @function
     * @returns itself
     */
    init : {
        value: function () {
            if (Object.isSealed(this)) {
                logger.error(this, "Object is sealed");
            }
            return this;
        }
    },

    /**
     * @function
     * @returns {Object} Object.seal(this)
     */
    initWithMembers : {
        value: function () {
            if (Object.isSealed(this)) {
                logger.error(this, "Object is sealed");
                return this;
            }
            var member, i;
            for (i = 0; typeof (member = arguments[i]) !== "undefined"; i++) {
                if (member !== null) {
                    this.addMember(member);
                } else {
                    logger.error(this, "Member at index " + i + " is null");
                }
            }
            return Object.seal(this);
        }
    },

    /**
     * @function
     * @param {string} member The member to be added.
     */
    addMember : {
        value: function (member) {

            if (typeof this[member] === "undefined") {
                Object.defineProperty(this, member, {
                    writable: false,
                    configurable: false,
                    enumerable: true,
                    value: this._value
                });
                this._value++;
            }
        }
    },

    /**
     * @function
     * @returns {Object} this, but sealed
     */
    seal : {
        value: function () {
            if (! Object.isSealed(this)) {
                return Object.seal(this);
            }
        }
    }

});

