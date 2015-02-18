var Montage = require("../../core").Montage;

function UnitSerializer(visitor, malker, object) {
    this._visitor = visitor;
    this._malker = malker;
    this._object = object;
}

var UnitSerializer = Montage.specialize.call(Object, {
    _malker: {value: null},
    _visitor: {value: null},
    _object: {value: null},

    constructor: {
        value: function UnitSerializer() {}
    },

    initWithMalkerAndVisitorAndObject: {
        value: function (malker, visitor, object) {
            this._malker = malker;
            this._visitor = visitor;
            this._object = object;

            return this;
        }
    },

    getObjectLabel: {
        value: function (object) {
            this.addObjectReference(object);

            return this._visitor.labeler.getObjectLabel(object);
        }
    },

    addObject: {
        value: function (object) {
            if (typeof object === "object") {
                this._malker.visit(object);

                return object;
            }
        }
    },

    addObjectReference: {
        value: function (object) {
            var builder = this._visitor.builder,
                labeler = this._visitor.labeler,
                label = labeler.getObjectLabel(object);

            return {
                thisIsAReferenceCreatedByMontageSerializer: true,
                reference: builder.createObjectReference(label)
            };
        }
    }
});

var ObjectReference = {
    thisIsAReferenceCreatedByMontageSerializer: true,
    reference: null
};

exports.UnitSerializer = UnitSerializer;
