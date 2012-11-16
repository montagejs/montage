## Montage

Montage is an application framework powered by standard web technologies.

Montage simplifies the development of rich HTML5 applications by providing modular components, real-time two-way data binding, CommonJS dependency management, and many more conveniences.

Montage opens a world of opportunity that is only just now available for web developers.

#### Components and Templates

Montage has a clean interface for creating custom user interface components. Each component can stand alone or be composed from other components.  Each component is modeled as a stand-alone web application, with its own HTML template, JavaScript, CSS, serialized component object model, and resources.  With few exceptions, a component can stand on the web platform like any other web page.  There are no fully JavaScript driven templates in Montage. This separation of concerns allows designers to use the technologies they are comfortable with, without having to dig into the JavaScript, and allows developers to isolate and test individual components using familiar techniques.

#### Two-way Data binding

Montage makes it easier to manage your application and UI state with data bindings. A UI component or Montage object can establish a one way or bi-directional binding with another component or object. When the bound property, or deeper property path, of the bound object is updated then the source object is kept in sync.

### Prerequisites

To get started with Montage, you will need the following:

-   A Git client, and public SSH key. For details on installing Git and creating your key, see the setup guides on github.com.
-   A local web server to serve Montage application. Montage applications can only be served from an HTTP address, not from a local file URL.
-   A recent stable release of Chrome, Safari or Firefox.

### Quick setup

If you’re already familiar with using Git, GitHub, and how to configure a local web server,

1.  In a terminal window, create a new projects folder (eg. ~/Projects).
    ``mkdir Projects``
    ``cd Projects``
2.  Clone Montage into ~/Projects
    ``git clone git@github.com:montagejs/montage.git``
3.  Configure your local web server to serve the ~/Projects folder over HTTP.
    Please refer to the suggested Apache configuration found at ``etc/apache-montage.conf``.  This
    will need to be configured and installed wherever your Apache installation will load other configuration files (eg /etc/apache2/other).
4.  Verify your setup by browsing to [http://localhost:8081/montage/test/run.html](http://localhost:8081/montage/test/run.html).

--------

### CommonJS

Montage fully supports CommonJS Modules 1.1.1, Packages 1.0, and a
subset of Package Mappings proposal C.  It also supports some extensions
exemplified by NodeJS and NPM.

-   **module.exports**: Modules that do not have cyclic dependencies
    (modules with dependencies that in turn ultimately depend their own
    exports) can redefine their exports object by assigning to
    ``module.exports``.  Montage itself uses this feature sparingly.
-   **dependencies**: If a package declares a package dependency
    using NPM’s ``dependencies`` property, Montage looks for that
    package in the package’s ``node_modules`` subdirectory.  Montage
    does not presently support cases where a dependency is in a common
    dependency’s ``node_modules`` directory.  Unlike NPM, with Montage
    packages, you can override the location of the ``node_modules``
    directory with the ``directories.packages`` property, or use
    mappings to find individual packages in alternate locations or give
    them different local names.
-   **mappings**: Packages can declare some or all of their package
    dependencies with the URL ``location`` of the package, particularly
    a URL relative to the depending package.  Mappings override
    dependencies if there are conflicts.
-   **require.packageDescription**: Packages expose the parsed
    contents of the ``package.json`` file.
-   **module.path**: Packages expose the URL of the corresponding
    source.
-   **module.directory**: Packages expose the URL of the directory
    containing the corresponding source.
-   **overlay**: Packages may contain platform-specific overlays.
    Montage applies the ``browser`` overlay on the root of the package
    description.
-   **reels**: Montage permits components to be loaded from a directory
    with a ``.reel`` extension.  The module system redirects
    ``require("x.reel")`` to ``require("x.reel/x")``.
-   **metadata**: Montage hides data on each object exported by a module
    to permit the serialization system to implicitly discover the module
    and package that can reinstantiate an object.

The Montage modules debug-mode run-time loads modules asynchronously and
calculates their transitive dependencies heuristically--by statically
scanning for ``require`` calls using a simple regular expression.
Montage can load cross-origin scripts in debug-mode if the CORS headers
are set on the remote server.

Take a look at the Montage Optimizer, tools/mop, to optimize applications for production.  The optimizer can bundle packages with all of the dependent modules, can preload bundles of progressive enhancements in phases, and can generate HTML5 application cache manifests.