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
var Montage = require("./core").Montage,
    CHARS = '0123456789ABCDEF'.split(''),
    PROTO = "__proto__",
    VALUE = "value",
    FORMAT = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.split('');


/*
    Adapted from https://github.com/ungap/random-uuid/blob/main/index.js
*/

var crypto = global.crypto;
if (typeof crypto === 'undefined') {
    if(typeof process === 'object') {
    /*
        In node, we're getting here first with node's native require from requiring montage itself,
        and we're gettimg there a second time from mr, but as of this writing, mr fails to resolve "crypro" as a node module as it doesn't know a package named that, and clearly it doesn't try as it should to defer to native require to do so as it should (or find it itself...)

        So caching it on global allows us to avoid that for now.

        Adding () around require fools mr into not trying to parse that as a dependency on the client
    */
        global.crypto = crypto = global.crypto || (require) ('crypto');

        if (!('randomUUID' in crypto)) {

            var randomBytes = crypto.randomBytes;
            /**
             * A "phonyfill" for `getRandomValues`.
             * It's is like a polyfill but **does not conform to the WebCrypto specification!**.
             * Unlike a the [polyfill](./node-polyfill.js), this implementation is faster as it avoids copying data.
             *
             * Specifically, the provided typed array is not filled with random values, nor is it returned form the function.
             * Instead a new typed array of the same type and size is returned, which contains the random data.
             *
             * @param {TypedArray} typedArray A typed array *used only* for specifying the type and size of the return value.
             * @returns {TypedArray} A typed array of the same type and size as `typedArray` filled with random data.
             */
            function getRandomValues(typedArray) {
                const { BYTES_PER_ELEMENT, length } = typedArray;
                const totalBytes = BYTES_PER_ELEMENT * length;
                const { buffer } = randomBytes(totalBytes);
                return Reflect.construct(typedArray.constructor, [buffer]);
            }

            crypto.randomUUID = function randomUUID() {
                return (
                    [1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g,
                        c => (c ^ getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
                    );
            };


        }

    } else {

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

        /*
            For older browsers
        */
        crypto = {
            randomUUID: generate
        }
    }
}

if (!('randomUUID' in crypto)) {
    // https://stackoverflow.com/a/2117523/2800218
    // LICENSE: https://creativecommons.org/licenses/by-sa/4.0/legalcode
    crypto.randomUUID = function randomUUID() {
        return (
            [1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g,
                c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
            );
    };
}

function generateCryptoRandomUUID() {
    return crypto.randomUUID();
};
exports.generate = generateCryptoRandomUUID;
var Uuid = exports.Uuid = Object.create(Object.prototype, /** @lends Uuid# */ {
    /**
     * Returns a univerally unique ID (UUID).
     * @function Uuid.generate
     * @returns {string} The UUID.
     */
    generate: {
        enumerable: false,
        value: generateCryptoRandomUUID
    }
});

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

    var uuid = crypto.randomUUID(),
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
    return ((Object.prototype.hasOwnProperty.call(this, "_uuid") &&  this._uuid) ? this._uuid : uuidGetGenerator.call(this));
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
};

