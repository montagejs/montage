/*
     Range using:
        - https://github.com/moll/js-strange
        - https://www.npmjs.com/package/strange

        a range object for JavaScript. Use it to have a single value type with two endpoints and their boundaries.
        Also implements an interval tree for quick lookups. Stringifies itself in the style of [begin,end) and allows you to parse a string back.
        Also useful with PostgreSQL.
*/

var Range = require("strange"),
Montage = require("./core").Montage;

exports.Range = Range;



// For doc/reference:

// function Range(begin, end, bounds) {
//   if (!(this instanceof Range)) return new Range(begin, end, bounds)

//   /**
//    * Range's beginning, or left endpoint.
//    *
//    * @property {Object} begin
//    */
//   this.begin = begin

//   /**
//    * Range's end, or right endpoint.
//    *
//    * @property {Object} end
//    */
//   this.end = end

//   /**
//    * Range's bounds.
//    *
//    * Bounds signify whether the range includes or excludes that particular
//    * endpoint.
//    *
//    * Pair | Meaning
//    * -----|--------
//    * `()` | open - excludes bounds
//    * `[]` | closed - iclude bounds
//    * `[)` | left-closed, right-open
//    * `(]` | left-open, right-closed
//    *
//    * @example
//    * new Range(1, 5).bounds // => "[]"
//    * new Range(1, 5, "[)").bounds // => "[)"
//    *
//    * @property {String} bounds
//    */
//    this.bounds = bounds = bounds === undefined ? "[]" : bounds
//    if (!isValidBounds(bounds)) throw new RangeError(INVALID_BOUNDS_ERR + bounds)
// }




Range.prototype.equals = function(value, equals, memo) {
    if(value && this.compareBegin(value.begin) === 0 && this.compareEnd(value.end) === 0) {
        return true;
    } else {
        return false;
    }
};

Range.empty = new Range();


Range.prototype.intersection = function (other) {
    if (this.isEmpty()) return Range.empty;
    if (other.isEmpty()) return Range.empty;

    /* Compares the first range's beginning to the second's end.
    * Returns `<0` if `a` begins before `b` ends, `0` if one starts where the other
    * ends and `>1` if `a` begins after `b` ends.
    *
    * @example
    * Range.compareBeginToEnd(new Range(0, 10), new Range(0, 5)) // => -1
    * Range.compareBeginToEnd(new Range(0, 10), new Range(-10, 0)) // => 0
    * Range.compareBeginToEnd(new Range(0, 10), new Range(-10, -5)) // => 1
    */

    var begin,
        //beginComparison,
        //endComparison,
        //bounds,
        end;
    //if((beginComparison = Range.compareBeginToEnd(this, other)) <= 0) {
    if(Range.compareBeginToEnd(this, other) <= 0) {
            begin = this.begin;
        //bounds = beginComparison < 0 ?
    }
    //if((endComparison = Range.compareBeginToEnd(other, this)) <= 0) {
    if(endComparison = Range.compareBeginToEnd(other, this) <= 0) {
            end = other.end;
    }

    /*
        Potgresql does:
        intersection:	int8range(5,15) * int8range(10,20) ->[10,15)
            We'll keep the bounds as the default [] for now
    */
    if(begin !== undefined && end !== undefined) {
        return new Range(begin,end);
    } else {
        return Range.empty;
    }

};

Range.prototype.overlaps = Range.prototype.intersects;

/**
 * Check if a given value or range of values is contained within this range.
 * Returns `true` or `false`. Overrides super to add support for Range as argument.
 *
 * @example
 * new Range(0, 10).contains(5) // => true
 * new Range(0, 10).contains(5) // => true
 * new Range(0, 10).contains(10) // => true
 * new Range(0, 10, "[)").contains(10) // => false
 *
 * @method contains
 * @param {Object} value
 */
Range.prototype._contains = Range.prototype.contains;

Range.prototype.contains = function(value) {
    if(value instanceof Range) {
        if (this.isEmpty()) return Range.empty;
        if (value.isEmpty()) return Range.empty;

        /*
            Range.compareBeginToBegin(new Range(0, 10), new Range(5, 15)) // => -1
            Range.compareBeginToBegin(new Range(0, 10), new Range(0, 15)) // => 0
            Range.compareBeginToBegin(new Range(0, 10), new Range(0, 15, "()")) // => 1

            Range.compareEndToEnd(new Range(0, 10), new Range(5, 15)) // => -1
            Range.compareEndToEnd(new Range(0, 10), new Range(5, 10)) // => 0
            Range.compareEndToEnd(new Range(0, 10), new Range(5, 10, "()")) // => 1
        */
       return ((Range.compareBeginToBegin(this,value) <= 0) && (Range.compareEndToEnd(this,value) >= 0))
       ? true
       : false;
    } else {
        return this._contains(value)
    }
}

Range.getInfoForObject = function(object) {
    return Montage.getInfoForObject(object);
};

Range.prototype.serializeSelf = function (serializer) {
    serializer.setProperty("begin", this.begin);
    serializer.setProperty("end", this.end);
    serializer.setProperty("bounds", this.bounds);
};

Range.prototype.deserializeSelf = function (deserializer) {
    var value;
    value = deserializer.getProperty("begin");
    if (value !== void 0) {
        this.begin = value;
    }
    value = deserializer.getProperty("end");
    if (value !== void 0) {
        this.end = value;
    }
    value = deserializer.getProperty("bounds");
    if (value !== void 0) {
        this.bounds = value;
    }
};

Object.defineProperty(Range.prototype,"length", {
    get: function (serializer) {
        if(this.isFinite) {
            return this.end - this.begin;
        } else {
            return Infinity;
        }
    }
});

/**
 * Creates a new range representing the full 24 hours of the date passed as an argument
 * from midnight/0h to 23:59:59:999 of the day of the date passed as argument.
 *
 * @function
 * @param {Date} date The date to build the range on.
 *
 * @returns {Range}    a new Range instance.
 */

Range.fullDayTimeRangeFromDate = function(date) {
    var dayStart  = new Date(date);
    dayStart.setHours(0,0,0,0);
    var dayEnd = new Date(dayStart);
    dayEnd.setHours(23,59,59,999);
    return  new Range(dayStart,dayEnd);
};
