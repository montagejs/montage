# v0.7.0

-   Adding `ownerComponent` property to the Component.
    When the template is deserialized we populate the ownerComponent property of any component created within it's
    serialization with the owner of the template.
-   Adding `setElementWithParentComponent` function on the Component.
    This formalizes the API to set a detached element to a component. The caller is responsible for appending the
    element to the DOM before prepareForDraw is called on the callee.
-   Serialization changes
    -   Specifying types and references
        1.  Changed the way we specify an object by merging the module id and the name into only one string using
            `"<module>[<name>]"` (e.g.: `"montage/ui/button.reel[Button]"`). When the name matches the last part of the module
            id then it's automatically inferred and there's no need to provide it. The last part of the module id is considered
            to be the last path component (e.g.: `"event-name"` in `"montage/event/event-name"`) transformed to CamelCase with
            dashes stripped (e.g.: `"EventName"`). When the last path component ends with `".reel"` then the component is
            considered without its `".reel"` suffix (e.g: `"RadioButton"` for `"montage/ui/radio-button.reel"`). Under these new
            rules we reach the following equivalence: `"montage/ui/button.reel[Button]" === "montage/ui/button.reel"`.
        2.  The possibility to point to an object instead of just being able to declare an instance of a specific prototype.
            We were using the pair `module/name` to declare an instance of that prototype, with this new change only one
            property is needed -- `prototype` -- using the rules defined in 1). If, instead of a new object, we just want to
            point to an existing one the new `object` property name should be used.

            In practice this means a change from:

                ```javascript
                {
                    "label": {
                        "module": "montage/ui/button.reel",
                        "name": "Button",
                        "properties": {...}
                    }
                }
                ```
            to
                ```javascript
                {
                    "label": {
                        "prototype": "montage/ui/button.reel",
                        "properties": {...}
                    }
                }
                ```
    -   Serialization labels are now used as the value of the identifier property by default.

-   Properties with a leading underscore in their name are now {enumerable: false} by default.
    i.e. defining a property as
        ```javascript
        _name: {value: null}
        ```
    is equivalent to doing
        ```javascript
        _name: {value: null, enumerable:false}
        ```
-   Components
    -   Repetition: Adding indexMap property to provide the necessary underpinnings for large data handling.
    -   SelectInput: Adding values and value property to be able to bind directly to the value of the selected option(s)
    -   Scroller: Replaces Scrollview. Now uses the Translate composer.
    -   Scrollview: _deprecated_
-   Browser Support
    -   Better support for Firefox
    -   Better support for Opera

# v0.6.0

-   Native Controls based on HTML5 input elements
-   Composers to add aggregate events and time dependent behaviors as is needed for scroll momentum and bouncing.
-   Component Contents to make it easier to use existing wrapper components such as repetition in your own.
-   Condition Component API improvements to lazily load parts of your component tree and easily show or hide sections of your page.
-   Misc bug fixes and optimizations mostly in the loading of the app and the require/package system..

# v0.5.0

-   Added UndoManager.
    It stores actions that can later be undone or re-done,
    example of usage has been added to the PhotoFX example.
-   Custom Events now propagate through component tree by default if
    dispatched on a component.
-   Addition of ``.didCreate()``
    - ``MyPrototype.create()`` or ``Montage.create(MyPrototype)`` is for
    **instantiation**. From v0.5, this will call _didCreate()_ on each
    begotten instance implicitly for **initialization** purposes. It does
    not accept arguments and occurs before the serialization has an
    opportunity to set initial properties.
    All parameterized initialization must occur as the result of
    observing setters on those properties.
    -   ``Montage.create(MyPrototype, {property descriptors})`` is for
    **subtyping**. This will not call _didCreate()_.
-   All components now have the ability to easily dispatch an action event.
-   Condition component improvements
-   PhotoFX example improvements
-   Added flow component for reference purposes, the API is not ready yet.
-   IE10 Fixes.
-   Bug fixes in:
    -   Packaging for require
    -   Dependent properties listening
    -   Promises
    -   Selection in ArrayController
    -   Scrollview
    -   Various other areas

# v0.4.0

-   Packaging:
    -   All applications must be packages with ``package.json`` files.
    -   The ``data-package`` attribute is no longer necessary and
        defaults to ``"./"``, meaning that the application’s
        ``package.json`` is in the same directory as the containing
        HTML.  ``data-package`` may be overridden with a relative URL to
        the directory containing ``package.json``, and must contain a
        final forward-slash.
    -   The default directory for packaged modules is now the root of
        the package instead of ``lib``.  This can be altered from its
        default with the ``directories.lib`` property in
        ``package.json``.
    -   require("x.reel") now loads require("x.reel/x.js").
    -   Removed the run-time ``mappings`` configuration for module
        loading.  Use ``mappings`` in ``package.json`` instead.
    -   require("my-package/my-module") no longer maps to
        require("my-module") inside of my-package.
        require("my-package") still maps to require("") which maps to
        require("my-main-module").
    -   You can now require a module with the same name as your package,
        provided that you do not override the "main" property of your
        package.  Previously, there was no default main property.
-   Serializer:
    -   Each package has its own module identifier name space, so
        serializations must be scoped to a package.  To identify the
        containing package, ``Serializer`` must be constructed with a
        ``require`` argument if the serialization contains any Montage
        objects.
        -   Added ``Serializer.initWithRequire``
        -   Added ``Serializer.initWithStringAndRequire``
    -   Swapped the names ``serialize`` and ``serializeObject``.
        ``serialize({labels: objects})`` and
        ``serializeObject(object)`` are the new signatures.
-   Deserializer:
    -   Swapped ``deserialize`` and ``deserializeObject``.
    -   Renamed ``deserializeObjectsWithLabels`` to
        ``deserializeWithInstances``.
    -   Consolidated ``deserializeObjectsWithElement`` and
        ``deserializeObjectsWithElementAndLabels`` into
        ``deserializeWithInstancesAndElementForDocument``.
    -   Consolidated ``deserializeObjectsWithDocument`` and
        ``deserializeObjectsWithDocumentAndLabels`` into
        ``deserializeWithInstancesAndDocument``.
-   Some names have changed to distinguish reels from templates.  A
    reel is a directory that encapsulates all parts of a reusable
    component.  The name only exists as the ``.reel`` extension for
    such directories.  A template is an HTML file for a reel.
    -   Renamed ``hasReel`` to ``hasTemplate``.
    -   Renamed ``reelDidLoad`` to ``templateDidLoad``
    -   Renamed ``deserializedFromReel`` to ``deserializedFromTemplate``
    -   Renamed ``loadReel`` to ``loadTemplate``
    -   Renamed ``reelWithModuleId`` to ``templateWithModuleId``
    -   Renamed ``reelWithComponent`` to ``templateWithComponent``
-   Components must be styled with CSS classes instead of element
    identifiers.  Identifiers for component elements are no longer
    generated, and were never generated in a fashion that was consistent
    after structural changes.
-   Removed ``prototypeMethod``, ``prototypeSet`` and ``prototypeGet``
    convenience methods, any code using these methods will have to be
    updated to either use the needed prototype directly or use
    ``Object.getPrototypeOf(...)``

# v0.3.1

-   Added copyright notices to HTML, CSS, and JavaScript.
-   Normalized files to Unix text encoding.
-   Fixed auto-complete textfield.
-   Added progress bar test.
-   Draw cycle improvements.
-   Checkbox animations.

# v0.3.0

-   Module namespace restructured.

# v0.2.0

-   First version before breaking changes.
-   New serialization format introduced.

