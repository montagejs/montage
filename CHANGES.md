### v0.14.4

-  **Browser Support**

   A better fix for IE's innerHTML issues.

-  **TreeController**

   Fix an issue with the findNodeByContent equality parameter.

### v0.14.3

-  **Component**

   Fix getDomArgumentNames missing names after calling extractDomArgument.

-  **Template**

   Add the ability to set a template dirty and configure it with a refresher object.
   Add replaceContentsWithTemplate function.

### v0.14.2

-  **Montage**

   Reduction of jshint errors

-  **Mr**

   Fix bug in packages with names that start with a digit.

-  **Substitution**

   Added a workaround for an IE bug in its handling of innerHTML. http://jsfiddle.net/89X6F/

### v0.14.1

-  **Component**

   Fixes a regression where the component was allowed to draw before the stylesheets were loaded.
   Fixes a broken shim for requestAnimationFrame.

-  **Template**

   Fixes a bug when two nested aliased template objects using `:iteration` had the same label or alias.

-  **DocumentResources**

   Fixes preloading css file contents as soon as possible.

### v0.14.0

-  **Montage**

   Better JSDoc annotations.
   `super()` methods are now cached for better performance.
   `addRangeAtPathChangeListener()` is more tolerant changes along the path.
   Existing document resources are now taken into account when loading the page for the first time. (#1397)

-  **Path Listeners**

   *PathChangeListener functions an now accept parameters, document and components.

-  **url**

   `montage/core/url` has been removed, use the `url` npm package instead https://www.npmjs.org/package/url.

-  **Target**

   dispatchEvent() now return a boolean to signify whether or not the defaults were prevented.

-  **Component**

   Some cleanup to the component's draw list handling and implementation of an object pool to help with GC.

-  **Template**

   Better handling of css loading.
   Better handling of errors in deserialization.

-  **Blueprint**

   Added event blueprints.

-  **KeyComposer**

   Fixed issue that caused the KeyComposer to not work unless "keyPress" events were listened to in two places.
   KeyComposer fires the key event on the itself rather than the activeTarget directly.

-  **RangeController**

   Can now track selection with an Array, Set or SortedSet.
   Better selection management.

-  **TreeController**
   Added findNodeByContent() to be able to locate content in the tree.

-  **Repetition**

   Added aliases and template properties so that binding to `@repetition:iteration.object` is possible. Using aliases
   this can be exposed by the owner template.
   Some never used properties were removed for performance improvements.
   Fixed a bug in selection where a selected object could not be part of the content array.

-  **Overlay**

   Added ModalOverlay to force user response
   Added AbstractAlert and AbstractConfirm.
   Better handling of activeTarget, will not show if the activeTarget is not surrendered.
   Dismisses with escape key.
   Overlay can now have a delegate that affects it's position and behavior.

-  **AbstractButton**

   Now only has a label property, value is gone.

-  **AbstractImage**

   Now handles cross origin via the `crossOrigin` property.
   Now doesn't modify the src property when rebasing.
   Properly handles the case where the image is in browser cache.

-  **AbstractSlider**

   Can now move continuously rather than the 1% minimum step.
   Fixed bug for initial knob position.
   Uses a simplified dom structure.

-  **AbstractTextField**

   Fixed bug with setting the value to 0.
   Now uses the `activeTarget` system rather than manually managing the focus/blur.

-  **Flow**

   Added a `hasElasticScrolling` property to flow.reel which allows the space between individual tiles to stretch as
   they are dragged.

### v0.13.12

-  **Montage**

   Avoid the warning message: "Trying to replace element `<div>​</div>`​ which has no parentNode"
   Remove some extra logging in the Gate.

### v0.13.11

-  **Mr**

   Update the Mr package to version 0.15.1.
   Fixes an issue requiring dependencies with ".js" in their name in script-injection mode.
   More info [here](https://github.com/montagejs/mr/blob/master/CHANGES.md).

### v0.13.10

-  **Mr**

   Update the Mr package to version 0.15.
   Fixes an [issue](https://github.com/montagejs/mr/issues/65) with requiring modules with relative path as the main
   file in package.json.
   More info [here](https://github.com/montagejs/mr/blob/master/CHANGES.md).

-  **Key Composer**

   KeyManager now emits key events on the composer, not the target. This fixes an issue where you had to listen for keys
   on the component and the composer.

### v0.13.9

-  **Montage**

   Fix issue that was causing, at times, a component to enter the document
   before its stylesheets were completely loaded.

### v0.13.8

-  **Montage**

   Remove reference to alpha state in readme.

-  **AbstractTextField**

   Correctly handle setting TextField to 0. This specific value was being
   ignored.

-  **AbstractSlider**

   Improve implementation to only use two elements.

### v0.13.7

-  **Montage**

   FRB and Collections are up-reved to address an issue in Chrome 30's introduction of ES6 Array methods.

-  **PressComposer**

   Fix issue with capturing the pointer in touch to make nested composers work better only the most outer one would
   capture the event.
   PressComposer now only works with a one touch press gesture.
   Removed touch listeners on correct phase to stop leaking listeners.
### v0.13.6

-  **Montage**

   Bump Mr version to 0.13.4. Fixes an issue caused by a Safari bug on the
   very first load. Montage would not work at all because promises engine
   couldn't work.

-  **Template**

   Fixed bug with relative url's not working in image and iframes elements.

-  **NumberConverter**

   New property "forceDecimals" that adds 0's to the decimal part of a number
   to make sure it has the number of decimals specified in the "decimals"
   property. It is set to `true` by default.

-  **AbstractButton**

   Fixed an issue with the `enabled` property that wouldn't be respected when
   set to `false`.

-  **TranslateComposer**

   Added support to the standard `wheel` event. This was an issue in Firefox.

-  **Blueprint**

   Fixed a bug in the cardinality initialization.
   Fixed a bug in the AbstractSelect blueprint.

-  **Flow**

   Fixed a bug in the Flow selection where an hidden iteration could become
   deselected.

-  **MediaController**

   Overhaul change to the MediaController API.

-  **AbstractVideo**

   New abstract UI type - AbstractVideo - It provides an API and the base
   code to implement a video ui widget. An example of its usage can be found
   in the digit Video component.

### v0.13.5

-  **Flow**

   Fixed a bug that was braking future usage of a TranslateComposer. If the
   flow was the first component to be interacted with a slider (that uses the
   TranslateComposer internally) wouldn't be able to slide.

### v0.13.4

-  **Montage**

   window.Touch fix for desktop browsers (Chrome 29 in particular).

-  **Template**

   Fix templateDidLoad not being called on component templates with no
   serialization.

-  **Flow**

   Fix flow animating without having the pointer.
   Enhance mouse wheel heuristics.
   Fix translateStart/End issues.

-  **TextField**

   Reject value change when user is editing.

-  **Components**

   Add AbstractToggleSwitch.

### v0.13.3

-  **Repetition**

   Fix repetition to correctly add the `selected` class to iterations'
   elements that are components too.

-  **Overlay**

   It enters and exists the document everytime it is shown or hidden.

-  **AbstractSlider**

   Add active state.
   Add vertical mode.

-  **AbstractTextArea**

   Fix issue with null placeholder text.

-  **Target**

   Removed `willSurrenderActiveTarget` and added `surrendersActiveTarget`
   that asks the target to surrender the activeTarget status.

-  Several bug fixes

### v0.13.2

-   **Component**

    Rename leaveDocument (mistake) to exitDocument

-   **RangeController**

    Check content exists before attempting to read contentConstructor

-   **TreeController**

    New APIs see dead18372cfdbce8238315f7e956c0f9c483ee36

-   **Serialization**

    Added 'module reference' type to be able to deserialize and require a CommonJS module.

-   **Template**

    Fixed an issue when using a 'clear' label in the serialization

-   **Loader**

    Better error reporting when missing/wrong 'main' module/object information

-   **Repetition**

    Fixed bugs in childComponents management so that they are properly cleaned up.

    **Base Components**

    Add delegate methods to AbstractTextField
    Improvement to keyboard handling in AbstractNumberField

-   **Flow**

    Performance improvements.
    Better support of Firefox/IE10

-   **Documentation**

    Improvements to the converter documentation.

### v0.13.1

-   **RangeController**

    `addContent()` added to allow direct creation of objects in the content of the RangeController.
    see `contentConstructor` to specify the type.

-   **UndoManager**

    UndoManager now accepts promises and batching.

-   **Repetition**

    Pressing on an already selected iteration now does nothing instead of toggling it.

-   **Flow**

    Flow is now positioned absolute so that it expands to fill all the available space.

-   **AbstractSlider**

    The slider now uses a translate3d to take advantage of gpu acceleration.

## v0.13.0

-   **Directory Structure**

    All non-components have been moved from the ui directory to the core directory.
    Composers have been moved to the root directory.

-   **Core**

    `Montage.create()` has been replaced by a `specialize` method on the constructor. The `specialize` method returns a constructor function that can be invoked with the `new` operator. (For details see
    [Montage objects](http://montagejs.org/docs/montage-objects.html).)

-   **FRB bindings**

    Functional Reactive Bindings ([FRB](https://github.com/montagejs/frb)) have replaced the old bindings. [More info >](http://montagejs.org/docs/montage-%E2%99%A5-frb.html)

-   **Component**

    **Lifecycle methods**

    (See also [Component draw cycle](http://montagejs.org/docs/component-draw-cycle.html).)
    -   `enterDocument` is called every time the component's element is added to the DOM. When `enterDocument` is called the element is already in the DOM.
        The first time `enterDocument` is called, a Boolean with value `true` is passed in. In this situation `enterDocument` replaces `prepareForDraw`.
    -   `exitDocument` is called every time the component's element is removed from the DOM. When `exitDocument` is called the element is still in the DOM.
    -   `dispose` is called when the component is discarded.

    **classList**

    Added a `classList` property to all component instances. You can use this property with the same API as the element's `classList` without impacting the draw cycle performance. The property can be used to great effect with FRB bindings to do things like: `classList.has('complete') <- @owner.isComplete`.

    **DOM arguments**

    Components can now receive DOM arguments. A DOM argument is specified in the component markup by adding a `data-arg` attribute and assign a name to its value.
    DOM arguments can be referenced after the first `enterDocument` with the `extractDomArgument(name)` method.
    When a component has a Template with parameters, each template parameter element is replaced with the corresponding component argument element.

-   **Template**

    Templates can now have DOM parameters. A DOM parameter is specified in a template using the `data-param` attribute on the DOM node that represents the parameter. `data-param` has the value of the parameter name.

-   **Serialization**

    A lot of the serialization code has been refactored to a separate project [mousse](https://github.com/montagejs/mousse) and made more generic.

-   **Components**

    The contents of the montage/ui directory have been split between the ui directories of the core montage framework and the [digit](https://github.com/montagejs/digit), [matte](https://github.com/montagejs/matte), and [native](https://github.com/montagejs/native) template packages.
    The montage/ui directory now contains the following directories:
    -   base (contains abstract components, described below)
    -   condition.reel
    -   flow.reel
    -   loader.reel
    -   [overlay.reel](http://montagejs.org/docs/overlay-component.html)
    -   repetition.reel
    -   slot.reel
    -   [substitution.reel](http://montagejs.org/docs/substitution-component
    .html)
    -   text.reel (replaces dynamic-text.reel)
    -   [component.js](#Component_v0130)


    **Substitution**

    The substitution's API has substantially changed to a template based approach that makes use of the new component arguments API.

-   **Abstract components**

    In an effort to make basic components easier to create and more consistent, the abstract components now provide a super
    class that widget sets can specialize with their own template. This is how the [digit](https://github.com/montagejs/digit) widgets are implemented.

## v0.12.0

-   **Core**

    **require** The package/module loader was refactored into a separate package named [mr](https://github.com/montagejs/mr) (Montage Require). This
    project can be now be used independently from Montage itself.

    **promise** The promise module was refactored so that it uses [Q](https://github.com/kriskowal/q) instead of it's own copy.

    Fixed issue in distinct property descriptor

    Better support for WebWorkers.

-   **Serialization**

    Changed the serializable defaults of properties defined using `Montage.defineProperty|ies` to reduce the amount of times the developer needs to specify a different behavior from the default.
    The default used to be false in all cases, now it is true unless the property is non enumerable or non writable (`writable: false` or has a `get` but no `set`).
    Improved the handling of serialization across iframes by more accurately identifying object types.
    Added more delegate methods.

-   **Events**

    Added a dispatchEventNamed convenience method and improved event wrapping in general.

    All events can now be observed on the application.

-   **Template**

    Added `instantiateWithInstancesAndDocument` method.

    Added templateObjects to expose the objects used in the template's serialization block.

-   **Component**

    Added querySelector[All]Component to query the component tree.

    Added templateObjects so that the component can easily access the object references form it's template's serialization. It also allows the component to pass in instances so that these are used instead of being instantiated when the template is loaded.

    Added component definition support to Component, this allows the component to programmatically expose it's API.

-   **multi-window**

    Added multi-window application support. When used extra windows can be opened within the same application.

-   **Various**

    ArrayController now returns the objects when removing form it's contents.

    Added InvertConverter.

    Some fixes in TranslateComposer to respect the return value when stealing the pointer;

-   **CSS**

    Changed all class names use by Montage to adhere to our new [Naming Convention](https://github.com/montagejs/montage/wiki/Naming-Conventions).

    Added global disabled style


-   **Components**

    Some styling improvements

    -   Flow now can do elastic scrolling which allows the spacing of the repeated items to be vary with speed. Recycling of dom nodes was also improved by adding a no-transition class so that css effects are reset as the tile is reused.
        The flow now also exposes a slotContent property which allows another component to be placed inside the 3d scene.

    -   DynamicElement doesn't always empty it's content.

    -   Usability improvements to InputRange on mobile.

    -   Rich Text Editor no longer prevents other input fields in the same page from getting the focus, other small bug
        fixes

-   **Extras**

    **Object** Added `values` and `map` to Object.

    **Element** Added `isElement` to Element.

    **RegExp** Added `isRegExp` to RegExp.


-   **Tools**
    -   Optimizer
        - Added Montage Optimizer

    -   Mint
        - Improved error reporting for globals.
        - Added support for linting directories.
        - Added ability to ignore filenames.
        - Added correct copyright linter.
        - Added JSDoc linter.
        - Added command line option to select linters to run.
        - Added --debug parameter.
        - Improved documentation.
    -   Minit
        - Added Application template
        - Better destination for component template.
        - Small bug fixes

-   **Sample Applications**

    Sample application have been moved to individual repositories.

## v0.11.0

-   **New skeleton components**

-   **New TextSlider component**

-   **New willFinishLoading delegate method on the application delegate**

-   **A classList property on the Dynamic Element to more conveniently toggle classes**

-   **Better support of different document context in serialization**

## v0.10.0

-   **New property change API**

    In prior Montage releases if you wanted to be notified when the value of a property changed, or an array was
    modified, you used the addEventListener() API to register a listener object (or function). This API has been
    replaced with addPropertyChangeListener(), which does everything that addEventListener() did, plus more.

-   **Changes to data binding**

    In this release, bindings can only be serialized on the source object in the binding. Practically, this means that
    the arrow in the binding serialization can only point from right-to-left, not from left-to-right.
    Also, the double-arrow syntax (<<->, for example) is no longer valid.

-   **__debugChangeNotifications__()**

    To help debug and inspect change listeners that you’ve registered on an object, call __debugChangeNotifications__()
    This is temporary stop gap which will be replaced by better debugging tools soon.

-   **KeyComposer and KeyManager**

    Montage now includes a mechanism for easily listening for and responding to keyboard events, including individual
    keys, or key combinations that you specify. It consists of two Montage objects: KeyComposer and KeyManager. You
    create a KeyComposer object and specify the keys, or key combinations, that you want to respond to, as well as the
    listener object that defines the necessary handlers. A default instance of the KeyManager prototype listens for
    native key events on behalf of all active KeyComposers. It then invokes a callback method on the listener object
    you specified.

-   **TokenField**

    The TokenField component is a text input component that displays tokens as its content.

-   **Flow component**

    The Flow component now supports selection handling and a feature called “stride”. The stride of a Flow component
    defines points at regular intervals where scrolling should stop. For example, suppose you are creating a carousel
    of album covers and you want the scrolling to stop when it reaches a position where the next album is always
    positioned at the center. In this case the stride value would be the scroll distance between an element at the
    center and the next element at the center. If you wanted scrolling to stop at every second or third album you would
    set a stride to double or triple of that value. That way you could have, for example, a page showing 10 albums, and
    you would be able to scroll 10 albums at a time, never stopping in the middle.

-   **DynamicElement**

    The DynamicElement component takes a string of plain text or HTML and inserts it into the component’s associated DOM
    element, clearing any existing content.


## v0.9.0

-   **Draw  cycle changes**

    After the willDraw phase all the components needing draw are sorted by their level in the
    component hierarchy. They are then processed in reverse order. This ensures that all the
    childComponents needing draw have drawn by the time the parent's draw is called. The didDraw
    uses the same list but processes the componets in top down order (the reverse of draw)

-   **Components**

    Autocomplete Textfield Added
        An Autocomplete Textfield extends the Textfield component to support suggestions for the user to pick values.
        The HTML markup for the Autocomplete is the same as the standard HTML5 markup (<input>).
        Wrapping the <input> HTMLElement as a Montage Autocomplete component adds Data Binding support for all
        writable attributes of this element and allows the Developer to provide suggestions to the user based
        on the entered value.

    Popup
        Support HTMLElement and Montage Component for the anchor property
        Change willPositionPopup(popup, anchor, anchorPosition) to willPosition(popup, defaultPosition).
        Change autoDismiss to autoHide
        Support autoHide only for non-modal popups
        Support string values (eg: 20px, 30%) for position parameters. If a number is provided, default to 'px'.

-   **Template**

    ``instantiateWithDocument(document, callback)`` method is added to use plain html templates without an owner.

    Backwards compatibility for id attribute based references in serilization is removed, you should now use the
    data-montage-id attribute.

## v0.8.0

-   **Data binding shorthand in serializations**

    This release introduces a new shorthand syntax for declaring data bindings in a serialization. The new syntax
    includes an arrow symbol that indicates the source of the binding and whether its one-way or two-way.The symbol can
    take one of the following forms:

    `<-` – One-way data binding, bound object on right

    `->` – One-way data binding, bound object on left

    `<<->` – Two-way data binding, bound object on right

    `<->>` – Two-way data binding, bound object on left

    Example:

    ```javascript
    {
        "inputText": {
            "prototype": "textfield",
            "bindings": {
                "value": {"<-": "@slider.value"}
            }
        }
    }
    ```

-   **RichTextEditor component**

    RichTextEditor is a lightweight component that provides basic HTML editing capability. It is wrapper around the
    HTML5 contentEditable attribute, and depends on the browser’s level of support of the execCommand() method. The
    RichTextEditor lets you set, on a specific text selection range, various formatting attributes including text and
    font styles, colors, justification, list style and paragraph indent level. It also supports drag-and-drop of images,
    plain text, or HTML fragments between two HTML documents, or the desktop and the document. Images can also be
    resized within the editor.

-   **Flow component**

    This release introduces the first drop of the Flow component. Flow is UI component that allows the design of
    scrollable 3D-layouts. Flow is useful for creating a wide range of visual interfaces from 3D carousels to common
    vertical and horizontal scrollable lists.

-   **Extending components**

    There are three options to extend a component’s template:

    1.  If the extended component doesn’t wish to introduce changes in the template, the component can set its
        templateModuleId property to point to the parent module’s template.
    2.  Create a new template that will completely redefine the markup of the component with no relation to the original
        template.
    3.  Set the extends property of the template that points to the template to be imported and where. This is similar
        to the “decorator” pattern of the proposed Web Components feature. This approach is useful when the component
        needs to add additional CSS data, or reuse the original markup. The template object will be accessible through
        the template label of the serialization.

-   **Auto packaging**

    Many applications will initially only use their own modules and those provided by the Montage package.
    As long as that’s the case, you do not need to make a package.json; just put the data-auto-package attribute on
    your Montage script tag.

-   **Pop-up component updates**

    The Popup component API has been updated to provide better support for popup positioning.

    -   `anchor` The HTMLElement or Montage component below which the popup will be anchored on the page. To specify a
        custom position for a popup, use a delegate (see below). If an anchor is not provided, the position property is
        used, if provided. If no positioning support is provided, the Popup is displayed at the center of the screen by
        default.
    -   `position` An object with properties named top, left, bottom and right that specify the position of the popup.
        This property is used to position the popup if no anchor is specified.
    -   `delegate` An object that defines methods that are invoked by the Popup component. The only delegate method
        currently supported is willPositionPopup(). This method must return an object with any of the following
        properties: top, left, bottom or right. Values assigned to these properties must strings in valid
        CSS units (“10px” or “50%”).
    -   `content` The Montage component that will be displayed in the popup.
    -   `modal` If set to true, the popup is rendered with a mask underneath. A non-modal popup is hidden when the user
        presses the Esc key, or clicks outside of the popup. The developer is responsible for hiding a modal popup.
        Default is false. Modal popups never auto-hide themselves.
    -   `autoHide` Optional. The popup will be automatically hidden after the specified number of milliseconds. This
        property has no effect on modal popups.


## v0.7.0

-   **Adding `ownerComponent` property to the Component.**
    When the template is deserialized we populate the ownerComponent property of any component created within it's
    serialization with the owner of the template.
-   **Adding `setElementWithParentComponent` function on the Component.**
    This formalizes the API to set a detached element to a component. The caller is responsible for appending the
    element to the DOM before prepareForDraw is called on the callee.
-   **Serialization changes**
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

-   **Properties with a leading underscore in their name are now {enumerable: false} by default.**
    i.e. defining a property as
        ```javascript
        _name: {value: null}
        ```
    is equivalent to doing
        ```javascript
        _name: {value: null, enumerable:false}
        ```
-   **Components**
    -   Repetition: Adding indexMap property to provide the necessary underpinnings for large data handling.
    -   SelectInput: Adding values and value property to be able to bind directly to the value of the selected option(s)
    -   Scroller: Replaces Scrollview. Now uses the Translate composer.
    -   Scrollview: _deprecated_
-   **Browser Support**
    -   Better support for Firefox
    -   Better support for Opera

## v0.6.0

-   Native Controls based on HTML5 input elements
-   Composers to add aggregate events and time dependent behaviors as is needed for scroll momentum and bouncing.
-   Component Contents to make it easier to use existing wrapper components such as repetition in your own.
-   Condition Component API improvements to lazily load parts of your component tree and easily show or hide sections of your page.
-   Misc bug fixes and optimizations mostly in the loading of the app and the require/package system..

## v0.5.0

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

## v0.4.0

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

### v0.3.1

-   Added copyright notices to HTML, CSS, and JavaScript.
-   Normalized files to Unix text encoding.
-   Fixed auto-complete textfield.
-   Added progress bar test.
-   Draw cycle improvements.
-   Checkbox animations.

## v0.3.0

-   Module namespace restructured.

## v0.2.0

-   First version before breaking changes.
-   New serialization format introduced.

