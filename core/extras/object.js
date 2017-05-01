/**
    Defines extensions to intrinsic `Object`.
    @see {external:Object}
    @module montage/core/extras/object
*/

/**
 * Returns the descriptor object for an object's property.
 * @param {Object} anObject The object containing the property.
 * @param {string} propertyName The name of the property.
 * @returns {Object} The object's property descriptor.
 * @function external:Object.getPropertyDescriptor
*/
Object.defineProperty(Object, "getPropertyDescriptor", {
    value: function (anObject, propertyName) {
        var current = anObject,
            currentDescriptor;

        do {
            currentDescriptor = Object.getOwnPropertyDescriptor(current, propertyName);
        } while (!currentDescriptor && (current = current.__proto__ || Object.getPrototypeOf(current)));

        return currentDescriptor;
    },
    writable: true,
    configurable: true
});

/**
 * Returns the prototype object and property descriptor for a property
 * belonging to an object.
 * @param {Object} anObject The object to return the prototype for.
 * @param {string} propertyName The name of the property.
 * @returns {Object} An object containing two properties named `prototype` and
 * `propertyDescriptor` that contain the object's prototype object and property
 * descriptor, respectively.  @function
 * external:Object.getPrototypeAndDescriptorDefiningProperty
 */
Object.defineProperty(Object, "getPrototypeAndDescriptorDefiningProperty", {
    value: function (anObject, propertyName) {
        var current = anObject,
            currentDescriptor;
        if (propertyName) {

            do {
                currentDescriptor = Object.getOwnPropertyDescriptor(current, propertyName);
            } while (!currentDescriptor && (current = current.__proto__ || Object.getPrototypeOf(current)));

            return {
                prototype: current,
                propertyDescriptor: currentDescriptor
            };
        }
    },
    writable: true,
    configurable: true
});

/**
 * Removes all properties owned by this object making the object suitable for
 * reuse.
 *
 * @function external:Object#clear
 * @returns this
 */
Object.defineProperty(Object.prototype, "clear", {
    value: function () {
        var keys = Object.keys(this),
            i = keys.length;

        while (i) {
            i--;
            delete this[keys[i]];
        }

        return this;
    },
    writable: true,
    configurable: true
});

if (Object.hasOwnProperty('defineBinding') === false) {

    Object.defineProperty(Object, "defineBinding", {
        value: function (target, targetPath, descriptor) {
            var depth = Error.stackTraceLimit,
                warningMsg = (['Object.defineBinding deprecated, replace Object.defineBinding with: ',
                'Import Bindings from "montage/core/core"',
                'Bindings.defineBinding(target, targetPath, descriptor);',
                '- Use "<-", "<->", and "source" in place of "boundObjectPropertyPath", "oneway", and "boundObject".',
                '- Use "convert" or "converter.convert" in place of "boundValueMutator".']).join("\r\n");

            Error.stackTraceLimit = 2;
            console.warn(warningMsg + new Error("deprecated").stack);
            Error.stackTraceLimit = depth;

            var Bindings = require("frb");

            descriptor.source = descriptor.boundObject;
            if (descriptor.oneway) {
                descriptor["<-"] = descriptor.boundObjectPropertyPath;
            } else {
                descriptor["<->"] = descriptor.boundObjectPropertyPath;
            }

            if (descriptor.boundValueMutator) {
                descriptor.convert = descriptor.boundValueMutator;
            }

            Bindings.defineBinding(target, targetPath, descriptor);
        },
        writable: true,
        configurable: true
    });
}

if (Object.hasOwnProperty('deleteBinding') === false) {
    Object.defineProperty(Object, "deleteBinding", {
        value: function (target, targetPath) {
            var Bindings = require("frb");
            Bindings.cancelBinding(target, targetPath);
        },
        writable: true,
        configurable: true
    });
}

