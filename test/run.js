/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

var Promise = require("montage/core/promise").Promise;

var spec = queryString("spec");
if (spec) {
    require.async(decodeURIComponent(spec)).then(function() {
        jasmine.getEnv().execute();
        if (window.testpage) {
            window.testpage.callNext();
        }
    });
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
        "state-chart-spec",
        "string-spec",

        "binding/binding-converter-spec",
        "binding/dependent-properties-spec",
        "binding/definebinding-spec",
        "binding/self-binding-spec",

        "controllers/array-controller-spec",
        "controllers/paged-array-controller-spec",

        "core/core-require-spec",
        "core/core-spec",
        "core/promise-spec",
        "core/promise-queue-spec",
        "core/promise-connection-spec",
        "core/next-tick-spec",

        "data/blueprint-spec",
        "data/context-spec",
        "data/store-spec",
        "data/selector/property-spec",
        "data/selector/query-spec",
        "data/selector/selector-spec",
        "data/selector/string-selector-spec",
        "data/transactionmanager-spec",

        "events/eventmanager-spec",
        "events/object-hierarchy-spec",

        "geometry/cubicbezier-spec",
        "geometry/point-spec",

        "reel/template-spec",

        "require/spec",

        "serialization/deserializer-spec",
        "serialization/serializer-spec",

        "ui/application-spec",
        "ui/anchor-spec",
        "ui/button-spec",
        "ui/check-spec",
        "ui/condition-spec",
        "ui/component-spec",
        "ui/composer-spec",
        "ui/composer/translate-composer-spec",
        "ui/dom-spec",
        "ui/dynamic-element-spec",
        "ui/dynamic-text-spec",
        "ui/firstdraw-spec",
        "ui/hot-text-spec",
        "ui/scroller-spec",
        "ui/list-spec",
        "ui/number-input-spec",
        "ui/range-input-spec",
        "ui/popup-spec",
        "ui/popup-in-window-spec",
        "ui/repetition-spec",
        "ui/rich-text-editor-spec",
        "ui/select-input-spec",
        "ui/slider-spec",
        "ui/slot-spec",
        "ui/textfield-spec",

        "ui/example-components-spec"
    ];
    Promise.all(modules.map(require.deepLoad))
    .then(function () {
        modules.forEach(require);
        jasmine.getEnv().execute();
        if (window.testpage) {
            window.testpage.callNext();
        }
    });
}

