/**
 * @module montage/core/enum
 * @requires montage/core/core
 * @requires montage/core/logger
 */
var Montage = require("./core").Montage,
    logger = require("./logger").logger("enum");

    /*
        Evaluate https://github.com/adrai/enum

        This might have the potential to replace gate / bitfield?
    */

/**
 * @class Enum
 * @extends Montage
 */
exports.Enum = Montage.specialize( /** @lends Enum# */ {

    _value: {
        value: 0
    },

    _members: {
        value: null
    },

    members: {
        get: function () {
            return this._members || (this._members = Object.keys(this));
        }
    },

    __membersByValue: {
        value: null
    },

    _membersByValue: {
        get: function () {
            return this.__membersByValue || (this.__membersByValue = []);
        }
    },

    memberWithIntValue: {
        value: function(intValue) {
            return this[this._membersByValue[intValue]];
        }
    },

    __membersIntValue: {
        value: null
    },

    _membersIntValue: {
        get: function () {
            return this.__membersIntValue || (this.__membersIntValue = new Map());
        }
    },

    intValueForMember: {
        value: function(member) {
            return this._membersIntValue.get(member);
        }
    },

    /**
     * @function
     * @returns itself
     */
    init : {
        value: function () {
            this._logErrorIfAlreadySeal();
            return this;
        }
    },

    /**
     * @function
     * @returns {Object} Object.seal(this)
     */
    initWithMembers : {
        value: function () {
            if (this._logErrorIfAlreadySeal()) {
                return this;
            }

            this._addMembers(arguments);

            return Object.seal(this);
        }
    },


    /**
     * @function
     * @param {Array.<string>} array of keys.
     * @param {Array} array of values.
     * @returns {Object} Object.seal(this)
     */
    initWithMembersAndValues : {
        value: function (members, values) {
            if (Array.isArray(members) && Array.isArray(values)) {
                if (members.length === values.length) {
                    if (this._logErrorIfAlreadySeal()) {
                        return this;
                    }

                    this._addMembers(members, values, this._membersByValue, this._membersIntValue);

                } else {
                    throw new Error("the number of members must equal to the number of values");
                }
            }

            return Object.seal(this);
        }
    },


    /**
     * @function
     * @param {string} member The member to be added.
     * @param value
     */
    addMember : {
        value: function (member, value, /* private */ _membersByValue, _membersIntValue) {
            if (typeof this[member] === "undefined") {
                var intValue = this._value++;
                Object.defineProperty(this, member, {
                    writable: false,
                    configurable: false,
                    enumerable: true,
                    value: value !== void 0 && value !== null ? value : intValue
                });

                (_membersByValue || this._membersByValue)[intValue] = member;
                (_membersIntValue || this._membersIntValue).set(member, intValue);
            }
        }
    },

    /**
     * @function
     * @returns {Object} this, but sealed
     */
    seal : {
        value: function () {
            if (!Object.isSealed(this)) {
                return Object.seal(this);
            }
        }
    },


    _logErrorIfAlreadySeal: {
        value: function () {
            if (Object.isSealed(this)) {
                logger.error(this, "Object is sealed");

                return true;
            }

            return false;
        }
    },

    _addMembers: {
        value: function (members, values) {
            var member, i, value, membersByValues = this.membersByValues;

            for (i = 0; typeof (member = members[i]) !== "undefined"; i++) {
                if (member !== null) {
                    if (values) {
                        value = values[i];

                        if (value === void 0 && value === null) {
                            throw new Error("A value of an enumeration cannot be null or undefined");
                        }
                    }

                    this.addMember(member, value, this._membersByValue, this._membersIntValue);
                } else {
                    logger.error(this, "Member at index " + i + " is null");
                }
            }
        }
    }
});

