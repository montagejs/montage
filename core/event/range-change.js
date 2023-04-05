
/**
 * Models a change happening to an Array
 *
 * @class
 * @extends Montage
 */

function RangeChange(index, addedValues, removedValues) {
    this.index = index;
    this.addedValues = addedValues;
    this.removedValues = removedValues;

    return this;
}

exports.RangeChange = RangeChange;
