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
    Target = require("montage/core/target").Target,
    Uuid = require("montage/core/uuid").Uuid;

exports.Empty = Montage.specialize( {});

exports.Simple = Montage.specialize( {
    number: {value: 42, serializable: true},
    string: {value: "string", serializable: true},
    regexp: {value: /regexp/gi, serializable: false},
    foo: {value: null, serializable: false}
});

exports.OneProp = Target.specialize( {
    prop: {value: null, serializable: true},

    deserializedFromSerializationCount: {value: 0, serializable: false},
    deserializedFromSerialization: {value: function () {
        this.deserializedFromSerializationCount++;
    }}
});

exports.OneReferenceProp = Montage.specialize( {
    referenceProp: {value: null, serializable: "reference"}
});

exports.TwoProps = Target.specialize( {
    prop1: {value: null, serializable: true},
    prop2: {value: null, serializable: true}
});

exports.SerializableAttribute = Montage.specialize( {
    prop1a: {value: null, serializable: "auto"},
    prop1b: {value: null, serializable: "auto"},
    prop2a: {value: null, serializable: "reference"},
    prop2b: {value: null, serializable: "reference"},
});

exports.DistinctArrayProp = Montage.specialize( {
    prop: {value: [], serializable: true, distinct: true}
});

exports.DistinctLiteralProp = Montage.specialize( {
    prop: {value: {}, serializable: true, distinct: true}
});

exports.CustomProperties = Montage.specialize( {
    manchete: {value: 42},

    serializeProperties: {value: function (serializer) {
        serializer.set("manchete", 226);
    }},

    deserializeProperties: {value: function (serializer) {
        this.manchete = serializer.get("manchete");
    }}
});

exports.CustomPropertiesRef = Montage.specialize( {
    object: {value: new exports.Empty()},

    serializeProperties: {value: function (serializer) {
        serializer.set("object", this.object, "reference");
    }},

    deserializeProperties: {value: function (deserializer) {
        this.object = deserializer.get("object");
    }}
});

exports.CustomAllProperties = Montage.specialize( {
    manchete: {value: 42, serializable: true},
    rodriguez: {value: new exports.Empty(), serializable: "reference"},
    luz: {value: new exports.Empty(), serializable: true},
    tarantino: {value: 105, serializable: false},

    serializeProperties: {value: function (serializer) {
        serializer.setAll();
    }},

    deserializeProperties: {value: function (serializer) {
        this.manchete = serializer.get("manchete");
    }}
});

exports.CustomRef = Montage.specialize( {
    object: {value: new exports.Empty()},

    serializeSelf: {value: function (serializer) {
        serializer.setProperty("object", this.object, "reference");
    }},

    deserializeSelf: {value: function (deserializer) {
        this.object = deserializer.getProperty("object");
    }}
});

exports.Singleton = Montage.specialize( {
    instance: {value: {another: "object"}},

    deserializeSelf: {value: function (serializer) {
        return this.instance;
    }}
});

exports.Comp = Montage.specialize( {
    element: {value: null, serializable: true},
    child: {value: null, serializable: true},
    templateDidLoadCount: {value: 0},
    templateDidLoad: {value: function () {
        this.templateDidLoadCount++;
    }},
    deserializedFromTemplateCount: {value: 0},
    deserializedFromTemplate: {value: function () {
        this.deserializedFromTemplateCount++;
    }},
});

exports.Custom = Montage.specialize( {
    number: {
        serializable: true,
        value: 42
    }
});

exports.CustomDeserialization = Montage.create(exports.TwoProps, {

});

exports.TestobjectsV2 = Montage.create(exports.Empty, {

});

exports.objects = {
    Empty: exports.Empty,
    Simple: exports.Simple,
    OneProp: exports.OneProp,
    TwoProps: exports.TwoProps,
    OneReferenceProp: exports.OneReferenceProp,
    SerializableAttribute: exports.SerializableAttribute,
    DistinctArrayProp: exports.DistinctArrayProp,
    DistinctLiteralProp: exports.DistinctLiteralProp,
    CustomProperties: exports.CustomProperties,
    CustomPropertiesRef: exports.CustomPropertiesRef,
    CustomAllProperties: exports.CustomAllProperties,
    CustomRef: exports.CustomRef,
    Singleton: exports.Singleton,
    Comp: exports.Comp,
    Custom: exports.Custom,
    CustomDeserialization: exports.CustomDeserialization,
    TestobjectsV2: exports.TestobjectsV2
};
