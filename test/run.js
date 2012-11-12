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
        "array-spec",
        "bitfield-spec",
        "claimed-pointer-spec",
        "converter-spec",
        "enum-spec",
        "gate-spec",
        "getset-spec",
        "logger-spec",
        "propertychange-spec",
        "require-spec",
        "state-chart-spec",
        "string-spec",

        "binding/binding-converter-spec",
        "binding/dependent-properties-spec",
        "binding/definebinding-spec",
        "binding/self-binding-spec",

        "controllers/array-controller-spec",

        "core/core-spec",
        "core/selector-spec",

        "core/extras/array",
        "core/extras/function",
        "core/extras/object",
        "core/extras/string",

        "data/blueprint-spec",
        "data/store-spec",
        "data/context-spec",
        "data/transactionmanager-spec",

        "events/change-notification-spec",
        "events/eventmanager-spec",
        "events/mutable-event-spec",
        "events/object-hierarchy-spec",

        "geometry/cubicbezier-spec",
        "geometry/point-spec",

        "reel/template-spec",

        "serialization/deserializer-spec",
        "serialization/serializer-spec",

        "ui/application-spec",
        "ui/anchor-spec",
        "ui/autocomplete-spec",
        "ui/button-spec",
        "ui/check-spec",
        "ui/condition-spec",
        "ui/component-spec",
        "ui/component-description-spec",
        "ui/composer-spec",
        "ui/composer/translate-composer-spec",
        "ui/dom-spec",
        "ui/dynamic-element-spec",
        "ui/dynamic-text-spec",
        "ui/firstdraw-spec",
        "ui/text-slider-spec",
        "ui/scroller-spec",
        "ui/list-spec",
        "ui/native-control-spec",
        "ui/number-input-spec",
        "ui/popup-spec",
        "ui/popup-in-window-spec",
        "ui/repetition-spec",
        "ui/rich-text-editor-spec",
        "ui/select-input-spec",
        "ui/native-input-range-spec",
        "ui/input-range-spec",
        "ui/slider-spec",
        "ui/slot-spec",
        "ui/textfield-spec",
        "ui/token-field-spec",

        "ui/example-components-spec"
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

