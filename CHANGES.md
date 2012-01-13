# v0.5.0

-   Added UndoManager, example of usage added to the PhotoFX example.
-   Custom Events now propagate through component tree by default if
    dispatched on a component.
-   Addition of ``.didCreate()``
    - ``MyPrototype.create()`` or ``Montage.create(MyPrototype)`` is for **instantiation**. From v0.5, this will
    call _didCreate()_ on each begotten instance implicitly for
    **initialization** purposes. It does not accept arguments and occurs
    before the serialization has an opportunity to set initial properties.
    All parameterized initialization must occur as the result of
    observing setters on those properties.
    -   ``Montage.create(MyPrototype, {property descriptors})`` is for **subtyping**. This will not
    call _didCreate()_
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

