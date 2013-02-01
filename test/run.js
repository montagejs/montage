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
        "bitfield-spec",
        "claimed-pointer-spec",
        "converter-spec",
        "enum-spec",
        "gate-spec",
        "logger-spec",
        "paths-spec",
        "path-changes-spec",
        "require-spec",
        "state-chart-spec",
        "string-spec",

        // packages
        "collections-spec",
        "frb-spec",

        "bindings/spec",
        "bindings/converter-spec",
        "bindings/self-spec",

        "core/core-spec",
        "core/localizer-spec",
        "core/localizer/serialization-spec",
        "core/selector-spec",

        "core/tree-controller-spec",

        "core/extras/function",
        "core/extras/string",

        "data/blueprint-spec",
        "data/store-spec",
        "data/context-spec",
        "data/transactionmanager-spec",

        "events/eventmanager-spec",
        "events/mutable-event-spec",
        "events/object-hierarchy-spec",

        "geometry/cubicbezier-spec",
        "geometry/point-spec",

        "reel/template-spec",

        "serialization/deserializer-spec",
        "serialization/serializer-spec",
        "serialization/bindings-spec",

        "ui/application-spec",
        "ui/anchor-spec",
        // Uses old controller: - @kriskowal
        // TODO "ui/autocomplete-spec",
        "ui/button-spec",
        "ui/check-spec",
        "ui/condition-spec",
        // Don't know why this is broken: - @kriskowal
        // TODO "ui/component-spec",
        // Uses old selector semantics. - @kriskowal
        // TODO "ui/component-description-spec",
        "ui/composer-spec",
        "ui/composer/press-composer-spec",
        "ui/composer/translate-composer-spec",
        "ui/dom-spec",
        "ui/dynamic-element-spec",
        "ui/dynamic-text-spec",
        // Breaks a couple tests related to drawing a repetition
        // TODO "ui/firstdraw-spec",
        "ui/text-slider-spec",
        "ui/scroller-spec",
        // Broken to changes in repetition or content controller
        // TODO "ui/list-spec",
        "ui/native-control-spec",
        "ui/number-input-spec",
        "ui/popup-spec",
        "ui/popup-in-window-spec",
        // Broken due to changes to repetition
        // TODO "ui/repetition-spec",
        "ui/rich-text-editor-spec",
        // Broken due to changes to repetition
        // (it runs but doesn't report the errors that it should)
        // TODO "ui/select-input-spec",
        "ui/native-input-range-spec",
        "ui/input-range-spec",
        "ui/slider-spec",
        "ui/slot-spec",
        "ui/textfield-spec",
        "ui/token-field-spec"
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

