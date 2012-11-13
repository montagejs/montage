
module.exports = PrecisionConverter;
function PrecisionConverter(precision) {
    this.precision = precision;
    this.epsilon = Math.pow(.1, precision - 1);
}

PrecisionConverter.prototype.convert = function (number) {
    this.captured = number;
    return number.toFixed(this.precision);
};

PrecisionConverter.prototype.revert = function (string) {
    var number = +string;
    if (
        this.captured == undefined ||
        Math.abs(this.captured - number) > this.epsilon
    ) {
        this.captured = number;
    }
    return this.captured;
};

