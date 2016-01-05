/**
 * Defines standardized shims to intrinsic `Array` object.
 * @see {external:Array}
 * @module montage/core/shim/array
 */

/**
 * @external Array
 */

/**
 * Returns whether the given value is an array, regardless of which
 * context it comes from.  The context may be another frame.
 *
 * This is the proper idiomatic way to test whether an object is an
 * array and replaces the less generally useful `instanceof`
 * check (which does not work across contexts) and the strangeness that
 * the `typeof` an array is `"object"`.
 *
 * @function external:Array.isArray
 * @param {Any} value any value
 * @returns {boolean} whether the given value is an array
 */
if (!Array.isArray) {
    Object.defineProperty(Array, "isArray", {
        value: function (obj) {
            return Object.prototype.toString.call(obj) === "[object Array]";
        },
        writable: true,
        configurable: true
    });
}

/**
 *  Compacts a sparse array.
 *
 *  @function external:Date#clone
 *  @returns {Date} - a new date
*/
Object.defineProperty(Array.prototype,"compact", {
    value: function () {
        var u, i=-1, j=-1,length=this.length;
        while(++j<length)
            if(!(this[j]===u))
                this[++i]=this[j];
        this.length=++i;
    },
    writable: true,
    configurable: true

});

/**
 *  Remove Objects.
 *
 *  @function external:Date#clone
 *  @returns {Date} - a new date
*/
Object.defineProperty(Array.prototype,"removeObjects", {

    value: function (objects, clearRemovedObjects) {
        var u, i=-1, j=-1,length=this.length, hasMethod, index, indexCount = 0;
        clearRemovedObjects = arguments.length === 2 ? clearRemovedObjects : true;
        if(typeof objects.has === "function") {
            while(++j<length) {
                if(!(objects.has(this[j]))) {
                    this[++i]=this[j];
                }
                else if(clearRemovedObjects) objects.delete(this[j]);
            }
        }
        else if(typeof objects.hasOwnProperty === "function") {
            while(++j<length) {
                if(!(objects.hasOwnProperty(this[j]))) {
                    this[++i]=this[j];
                }
                else if(clearRemovedObjects) delete objects[this[j]];
            }
        }
        else if(typeof objects.indexOf === "function") {
            while(++j<length) {
                if((index = objects.indexOf(this[j])) === -1) {
                    this[++i]=this[j];
                }
                else {
                    objects[index] = u;
                    indexCount++
                }
            }
            if(objects.length === indexCount) {
                objects.length = 0;
            }
            else objects.compact();
        }
        this.length=++i;
    },
    writable: true,
    configurable: true
});

/*
var array = ["a","b",,"c",,"d","e","f",,,,,"g",,,];
array.compact();
console.log(array);
var array2 = ["a","b","c","d","e","f","g"];
var map = new Object();
map.b = true;
map.c = true;
array2.removeObjects(map);
console.log(array2);

var a = {"a":true};
var b = {"b":true};
var c = {"c":true};
var d = {"d":true};
var e = {"e":true};

var array3 = [a,b,c,d,e];
var map = new Map();
map.set(b,true);
map.set(d,true);

array3.removeObjects(map);
console.log(array3);
*/
