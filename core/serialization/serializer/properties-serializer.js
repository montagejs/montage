var Montage = require("montage").Montage;

var PropertiesSerializer = Montage.create(Object.prototype, {
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

            var reference = Object.create(ObjectReference);
            reference.reference = builder.createReference(label);

            return reference;
        }
    },

    set: {
        value: function(propertyName, value, type) {
            this._visitor.setProperty(this._malker, propertyName, value, type);
        }
    },

    setAll: {
        value: function() {
            this._visitor.setSerializableObjectProperties(
                this._malker, this._object);
        }
    }
});

var ObjectReference = {
    thisIsAReferenceCreatedByMontageSerializer: true,
    reference: null
};

exports.PropertiesSerializer = PropertiesSerializer;
