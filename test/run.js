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

