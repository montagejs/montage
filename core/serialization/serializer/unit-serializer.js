var Montage = require("montage").Montage;

function UnitSerializer(visitor, malker, object) {
    this._visitor = visitor;
    this._malker = malker;
    this._object = object;
};

var UnitSerializer = Montage.create(Object.prototype, {
    _malker: {value: null},
    _visitor: {value: null},
    _object: {value: null},

    create: {
        value: function() {
            return Object.create(this);
        }
    },

    initWithMalkerAndVisitorAndObject: {
        value: function(malker, visitor, object) {
            this._malker = malker;
            this._visitor = visitor;
            this._object = object;

            return this;
        }
    },

    addObject: {
        value: function(object) {
            if (typeof object === "object") {
                this._malker.visit(object);

                return object;
            }
        }
    },

    addObjectReference: {
        value: function(object) {
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