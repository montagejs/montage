
var Map = require("collections/map");

module.exports = Signal;
function Signal(value) {
    var emitters = new Map();
    emitters.getDefault = function () {
        return 0;
    };
    return {
        observe: function (emit) {
            emit(value);
            emitters.set(emit, emitters.get(emit) + 1);
            return function cancelObserver() {
                emitters.set(emit, emitters.get(emit) - 1);
            };
        },
        emit: function (_value) {
            value = _value;
            emitters.forEach(function (count, emit) {
                emit(_value);
            });
        }
    };
}

