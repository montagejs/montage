/* <copyright>
Copyright (c) 2012, Motorola Mobility LLC.
All Rights Reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice,
  this list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of Motorola Mobility LLC nor the names of its
  contributors may be used to endorse or promote products derived from this
  software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
</copyright> */
exports = typeof exports !== "undefined" ? exports : {};

var Montage = require("montage").Montage,
    Uuid = require("montage/core/uuid").Uuid;

exports.Empty = Montage.create(Montage, {});

exports.Simple = Montage.create(Montage, {
    number: {value: 42},
    string: {value: "string"},
    regexp: {value: /regexp/gi, serializable: false},
    foo: {value: null}
});

exports.OneProp = Montage.create(Montage, {
    prop: {value: null, serializable: true},

    deserializedFromSerializationCount: {value: 0, serializable: false},
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

exports.CustomProperties = Montage.create(Montage, {
    manchete: {value: 42},

    serializeProperties: {value: function(serializer) {
        serializer.set("manchete", 226);
    }},

    deserializeProperties: {value: function(serializer) {
        this.manchete = serializer.get("manchete");
    }}
});

exports.CustomPropertiesRef = Montage.create(Montage, {
    object: {value: exports.Empty.create()},

    serializeProperties: {value: function(serializer) {
        serializer.set("object", this.object, "reference");
    }},

    deserializeProperties: {value: function(deserializer) {
        this.object = deserializer.get("object");
    }}
});

exports.CustomRef = Montage.create(Montage, {
    object: {value: exports.Empty.create()},

    serializeSelf: {value: function(serializer) {
        serializer.setProperty("object", this.object, "reference");
    }},

    deserializeSelf: {value: function(deserializer) {
        this.object = deserializer.getProperty("object");
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

exports.Custom = Montage.create(Montage, {
    number: {
        serializable: true,
        value: 42
    }
});

exports.CustomDeserialization = Montage.create(exports.TwoProps, {

});

exports.objects = {
    Empty: exports.Empty,
    Simple: exports.Simple,
    OneProp: exports.OneProp,
    TwoProps: exports.TwoProps,
    SerializableAttribute: exports.SerializableAttribute,
    DistinctArrayProp: exports.DistinctArrayProp,
    DistinctLiteralProp: exports.DistinctLiteralProp,
    CustomProperties: exports.CustomProperties,
    CustomPropertiesRef: exports.CustomPropertiesRef,
    CustomRef: exports.CustomRef,
    Singleton: exports.Singleton,
    Comp: exports.Comp,
    Custom: exports.Custom,
    CustomDeserialization: exports.CustomDeserialization
};
