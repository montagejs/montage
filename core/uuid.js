/* <notice>
 Code from node-uuid: https://github.com/broofa/node-uuid/raw/master/uuid.js
 MIT license https://github.com/broofa/node-uuid/blob/master/LICENSE.md
 </notice> */

/**
 * @module montage/core/uuid
*/

/**
 * @class Uuid
 * @extends Montage
 */
var Montage = require("core/core").Montage,
    CHARS = '0123456789ABCDEF'.split(''),
    PROTO = "__proto__",
    VALUE = "value",
    hasOwnProperty = Object.prototype.hasOwnProperty,
    FORMAT = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.split(''),
    Uuid = exports.Uuid = Object.create(Object.prototype, /** @lends Uuid# */ {
        /**
         * Returns a univerally unique ID (UUID).
         * @function Uuid.generate
         * @returns {string} The UUID.
         */
        generate: {
            enumerable: false,
            value: generate
        }
    });

exports.generate = generate;
function generate() {
    var c = CHARS, id = FORMAT, r;

    id[0] = c[(r = Math.random() * 0x100000000) & 0xf];
    id[1] = c[(r >>>= 4) & 0xf];
    id[2] = c[(r >>>= 4) & 0xf];
    id[3] = c[(r >>>= 4) & 0xf];
    id[4] = c[(r >>>= 4) & 0xf];
    id[5] = c[(r >>>= 4) & 0xf];
    id[6] = c[(r >>>= 4) & 0xf];
    id[7] = c[(r >>>= 4) & 0xf];

    id[9] = c[(r = Math.random() * 0x100000000) & 0xf];
    id[10] = c[(r >>>= 4) & 0xf];
    id[11] = c[(r >>>= 4) & 0xf];
    id[12] = c[(r >>>= 4) & 0xf];
    id[15] = c[(r >>>= 4) & 0xf];
    id[16] = c[(r >>>= 4) & 0xf];
    id[17] = c[(r >>>= 4) & 0xf];

    id[19] = c[(r = Math.random() * 0x100000000) & 0x3 | 0x8];
    id[20] = c[(r >>>= 4) & 0xf];
    id[21] = c[(r >>>= 4) & 0xf];
    id[22] = c[(r >>>= 4) & 0xf];
    id[24] = c[(r >>>= 4) & 0xf];
    id[25] = c[(r >>>= 4) & 0xf];
    id[26] = c[(r >>>= 4) & 0xf];
    id[27] = c[(r >>>= 4) & 0xf];

    id[28] = c[(r = Math.random() * 0x100000000) & 0xf];
    id[29] = c[(r >>>= 4) & 0xf];
    id[30] = c[(r >>>= 4) & 0xf];
    id[31] = c[(r >>>= 4) & 0xf];
    id[32] = c[(r >>>= 4) & 0xf];
    id[33] = c[(r >>>= 4) & 0xf];
    id[34] = c[(r >>>= 4) & 0xf];
    id[35] = c[(r >>>= 4) & 0xf];

    return id.join('');
}

// TODO figure out why this code only works in this module.  Attempts to move
// it to core/extras/object resulted in _uuid becoming enumerable and tests
// breaking. - @kriskowal

// var UUID = require("./uuid");

// HACK: This is to fix an IE10 bug where a getter on the window prototype chain
// gets some kind of proxy Window object which cannot have properties defined
// on it, instead of the `window` itself. Adding the uuid directly to the
// window removes the needs to call the getter.
// if (typeof window !== "undefined") {
//     window.uuid = UUID.generate();
// }
var uuidGetGenerator = function () {

    var uuid = generate(),
        info = Montage.getInfoForObject(this);
    try {
        if (info !== null && info.isInstance === false) {
            this._uuid = uuid;
            Object.defineProperty(this, "uuid", {
                get: function () {
                    if (this.hasOwnProperty("uuid")) {
                        // we are calling uuid on the prototype
                        return this._uuid;
                    } else {
                        // we are calling uuid on instance of this prototype
                        return uuidGetGenerator.call(this);
                    }
                }
            });
        } else {
            //This is needed to workaround some bugs in Safari where re-defining uuid doesn't work for DOMWindow.
            if (info.isInstance) {
                Object.defineProperty(this, "uuid", {
                    configurable: true,
                    enumerable: false,
                    writable: false,
                    value: uuid
                });
            }
            //This is really because re-defining the property on DOMWindow actually doesn't work, so the original property with the getter is still there and return this._uuid if there.
            if (this instanceof Element || !info.isInstance || !(VALUE in (Object.getOwnPropertyDescriptor(this, "uuid")||{})) || !(PROTO in this /* lame way to detect IE */)) {
                //This is needed to workaround some bugs in Safari where re-defining uuid doesn't work for DOMWindow.
                this._uuid = uuid;
            }
        }
    } catch(e) {
        // NOTE Safari (as of Version 5.0.2 (6533.18.5, r78685)
        // doesn't seem to allow redefining an existing property on a DOM Element
        // Still want to redefine the property where possible for speed
    }

    // NOTE Safari (as of Version 6.1 8537.71) has a bug related to ES5
    // property values. In some situations, even when the uuid has already
    // been defined as a property value, accessing the uuid of an object can
    // make it go through the defaultUuidGet as if the property descriptor
    // was still the original one. When that happens, a new uuid is created
    // for that object. To avoid this, we always make sure that the object
    // has a _uuid that will be looked up at defaultUuidGet() before
    // generating a new one. This mechanism was created to work around an
    // issue with Safari that didn't allow redefining property descriptors
    // in DOM elements.
    this._uuid = uuid;

    return uuid;
};

var defaultUuidGet = function defaultUuidGet() {
    //return this._uuid || (this._uuid = uuidGetGenerator.call(this));
    return ((hasOwnProperty.call(this, "_uuid") &&  this._uuid )
            ? this._uuid
            : uuidGetGenerator.call(this));
};


Montage.defineUuidProperty = function(object) {
    /**
        @private
    */
    Object.defineProperty(object, "_uuid", {
        enumerable: false,
        value: void 0,
        writable: true
    });

    /**
        Contains an object's unique ID.
        @member external:Object#uuid
        @default null
    */
    Object.defineProperty(object, "uuid", {
        configurable: true,
        get: defaultUuidGet,
        set: Function.noop,
        enumerable: false
    });
}
