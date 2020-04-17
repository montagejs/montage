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
