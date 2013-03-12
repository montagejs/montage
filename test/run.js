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

var Promise = require("montage/core/promise").Promise;

Error.stackTraceLimit = 100;

var spec = queryString("spec");
if (spec) {
    require.async(decodeURIComponent(spec))
    .then(function() {
        jasmine.getEnv().execute();
        if (window.testpage) {
            window.testpage.callNext();
        }
    })
    .done();
} else {
    var modules = [
        // Please keep in alphabetical order
        "application-spec",
        "bitfield-spec",
        "claimed-pointer-spec",
        "converter-spec",
        "enum-spec",
        "gate-spec",
        "logger-spec",
        "paths-spec",
        "require-spec",
        "state-chart-spec",
        "string-spec",

        // packages
        "collections-spec",
        "frb-spec",

        "bindings/spec",
        "bindings/converter-spec",
        "bindings/self-spec",

        "composer/composer-spec",
        "composer/press-composer-spec",
        "composer/translate-composer-spec",

        "core/core-spec",
        "core/dom-spec",
        "core/localizer-spec",
        "core/localizer/serialization-spec",
        "core/selector-spec",
        "core/undo-manager-spec",

        "core/tree-controller-spec",

        "core/extras/function",
        "core/extras/string",

        "events/eventmanager-spec",
        "events/mutable-event-spec",
        "events/object-hierarchy-spec",

        "geometry/cubicbezier-spec",
        "geometry/point-spec",

        "meta/blueprint-spec",
        "meta/component-blueprint-spec",
        "meta/controller-blueprint-spec",

        "reel/template-spec",
        "document-resources-spec",

        "serialization/serialization-spec",
        "serialization/montage-serializer-spec",
        "serialization/montage-deserializer-spec",
        "serialization/serialization-extractor-spec",
        "serialization/bindings-spec",
        "serialization/serialization-inspector-spec",
        "serialization/serialization-merger-spec",

        "ui/component-spec",
        "ui/firstdraw-spec",
        // Broken due to changes to repetition
        // TODO "ui/repetition-spec",
        "ui/slot-spec",
        "ui/text/text-spec"
    ];
    Promise.all(modules.map(require.deepLoad))
    .then(function () {
        modules.forEach(require);
        jasmine.getEnv().execute();
        if (window.testpage) {
            window.testpage.callNext();
        }
    })
    .done();
}

