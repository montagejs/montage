/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
exports = typeof exports !== "undefined" ? exports : {};

var Montage = require("montage").Montage,
    Uuid = require("montage/core/uuid").Uuid;

exports.Empty = Montage.create(Montage, {});

exports.Simple = Montage.create(Montage, {
    number: {value: 42, serializable: true},
    string: {value: "string", serializable: true},
    regexp: {value: /regexp/gi},
    foo: {value: null}
});

exports.OneProp = Montage.create(Montage, {
    prop: {value: null, serializable: true},

    deserializedFromSerializationCount: {value: 0},
    deserializedFromSerialization: {value: function() {
        this.deserializedFromSerializationCount++;
    }}
});

exports.TwoProps = Montage.create(Montage, {
    prop1: {value: null, serializable: true},
    prop2: {value: null, serializable: true}
});

exports.SerializableAttribute = Montage.create(Montage, {
    prop1a: {value: null, serializable: "auto"},
    prop1b: {value: null, serializable: "auto"},
    prop2a: {value: null, serializable: "reference"},
    prop2b: {value: null, serializable: "reference"},
});

exports.DistinctArrayProp = Montage.create(Montage, {
    prop: {value: [], serializable: true, distinct: true}
});

exports.DistinctLiteralProp = Montage.create(Montage, {
    prop: {value: {}, serializable: true, distinct: true}
});

exports.Custom = Montage.create(Montage, {
    manchete: {value: 42},

    serializeProperties: {value: function(serializer) {
        serializer.set("manchete", 226);
    }},

    deserializeProperties: {value: function(serializer) {
        this.manchete = serializer.get("manchete");
    }}
});

exports.CustomRef = Montage.create(Montage, {
    object: {value: exports.Empty.create()},

    serializeProperties: {value: function(serializer) {
        serializer.setReference("object", this.object);
    }},

    deserializeProperties: {value: function(serializer) {
        this.object = serializer.get("object");
    }}
});

exports.Singleton = Montage.create(Montage, {
    instance: {value: {another: "object"}},
    deserializeProperties: {value: function(serializer) {
        this.manchete = serializer.get("manchete");
        return this.instance;
    }}
});

exports.Comp = Montage.create(Montage, {
    element: {value: null, serializable: true},
    child: {value: null, serializable: true},
    templateDidLoadCount: {value: 0},
    templateDidLoad: {value: function() {
        this.templateDidLoadCount++;
    }},
    deserializedFromTemplateCount: {value: 0},
    deserializedFromTemplate: {value: function() {
        this.deserializedFromTemplateCount++;
    }},
});

exports.objects = {
    Empty: exports.Empty,
    Simple: exports.Simple,
    OneProp: exports.OneProp,
    TwoProps: exports.TwoProps,
    SerializableAttribute: exports.SerializableAttribute,
    DistinctArrayProp: exports.DistinctArrayProp,
    DistinctLiteralProp: exports.DistinctLiteralProp,
    Custom: exports.Custom,
    CustomRef: exports.CustomRef,
    Singleton: exports.Singleton,
    Comp: exports.Comp
};
