var Montage = require("../../core").Montage;

var SelfSerializer = Montage.specialize.call(Object, {
    _malker: {value: null},
    _visitor: {value: null},
    _object: {value: null},

    constructor: {
        value: function SelfSerializer() {}
    },

    initWithMalkerAndVisitorAndObject: {
        value: function(malker, visitor, object) {
            this._malker = malker;
            this._visitor = visitor;
            this._object = object;

            return this;
        }
    },

    getObjectLabel: {
        value: function(object) {
            return this._visitor.labeler.getObjectLabel(object);
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
    },

    setProperty: {
        value: function(propertyName, value, type) {
            var builder = this._visitor.builder,
                propertiesObject;

            propertiesObject = builder.top.getProperty("properties");
            builder.push(propertiesObject);

            this._visitor.setProperty(this._malker, propertyName, value, type);

            builder.pop();
        }
    },

    setAllProperties: {
        value: function() {
            var builder = this._visitor.builder,
                propertiesObject;

            propertiesObject = builder.top.getProperty("properties");
            builder.push(propertiesObject);

            this._visitor.setSerializableObjectProperties(this._malker, this._object);

            builder.pop();
        }
    },

    setUnit: {
        value: function(unitName) {
            this._visitor.setObjectCustomUnit(this._malker, this._object, unitName);
        }
    },

    setAllUnits: {
        value: function(unitName) {
            this._visitor.setObjectCustomUnits(this._malker, this._object);
        }
    }
});

exports.SelfSerializer = SelfSerializer;
