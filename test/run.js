require("montage-testing").run(require,[
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
]);
