/* <copyright>
Copyright (c) 2012, Motorola Mobility, Inc

All Rights Reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

  - Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
  - Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
  - Neither the name of Motorola Mobility nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
</copyright> */

var Promise = require("montage/core/promise").Promise;

var spec = queryString("spec");
if (spec) {
    require.async(decodeURIComponent(spec)).then(function() {
        jasmine.getEnv().execute();
        window.testpage.callNext();
    });
} else {
    Promise.all([
        // Please keep in alphabetical order
        require.async("array-spec"),
        require.async("bitfield-spec"),
        require.async("claimed-pointer-spec"),
        require.async("converter-spec"),
        require.async("enum-spec"),
        require.async("gate-spec"),
        require.async("getset-spec"),
        require.async("logger-spec"),
        require.async("propertychange-spec"),
        require.async("state-chart-spec"),
        require.async("string-spec"),

        require.async("binding/binding-converter-spec"),
        require.async("binding/dependent-properties-spec"),
        require.async("binding/definebinding-spec"),
        require.async("binding/self-binding-spec"),

        require.async("controllers/array-controller-spec"),
        require.async("controllers/paged-array-controller-spec"),

        require.async("core/core-require-spec"),
        require.async("core/core-spec"),
        require.async("core/promise-spec"),

        require.async("data/blueprint-spec"),
        require.async("data/context-spec"),
        require.async("data/store-spec"),
        require.async("data/selector/property-spec"),
        require.async("data/selector/query-spec"),
        require.async("data/selector/selector-spec"),
        require.async("data/selector/string-selector-spec"),
        require.async("data/transactionmanager-spec"),


        require.async("events/eventmanager-spec"),
        require.async("events/object-hierarchy-spec"),

        require.async("geometry/cubicbezier-spec"),
        require.async("geometry/point-spec"),

        require.async("reel/template-spec"),

        require.async("serialization/deserializer-spec"),
        require.async("serialization/serializer-spec"),

        require.async("ui/button-spec"),
        require.async("ui/component-spec"),
        require.async("ui/firstdraw-spec"),
        require.async("ui/list-spec"),
        require.async("ui/repetition-spec"),
        require.async("ui/slider-spec"),
        require.async("ui/slot-spec"),
        require.async("ui/textfield-spec")
    ]).then(function() {
        jasmine.getEnv().execute();
        window.testpage.callNext();
    })
}

