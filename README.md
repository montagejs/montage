## Montage

Do you want to build applications using the web technologies you know and love?
So do we, and that is why we developed Montage; a framework for taking web development to the native level.

With the rise of HTML5, there has been a boom in the development of applications using the open web stack. But trying to reach the level of user experience provided by native platforms is difficult. It takes months of work to get right, and some may claim it isn’t even possible. For the web app ecosystem to compete head-to-head with the best of breed native ecosystems, it needs to be as easy to build the same app, with the same level of refinement and user experience, as a native application. We should be able to do all this while playing to the strengths of the open web stack; because if we’re using web technology it should feel web-like and not ape other languages or frameworks.

###Taking it to the native level
The aim of Montage is to allow you to develop rich HTML5 applications that use JavaScript both on the front-end via the browser, and back-end via Node.js. You can built rich UIs in the client, and use a service-oriented back-end to handle data persistence and server-side logic. All using one language, and with the ability to have code reuse throughout the full stack. Montage opens a world of opportunity that is only just opening up for web developers.

We didn’t want to compromise when using web technologies, or make the framework feel unnatural to web developers. So we assembled a team of front and back-end developers who live and breath the web, many of who are known and respected in the community, and set to work fulfilling our goal. The labor of our love is Montage. We hope that you like it.

####Components and Templates

One drawback of HTML is the limited number of built-in stylable UI controls. Montage comes with a number of professionally designed, fully stylable, controls and components that are commonly needed in native-quality applications.

Montage comes with a clean, proven API for building your own custom components. Components can be used on their own, or nested within others, which allows for some powerful opportunities.

Components can include a UI template that uses the full stack of web technologies the way they are meant to be used. There is no fully JavaScript driven templates here! HTML is used to markup the template UI, CSS for styling, and JavaScript for logic. This separation of concerns allows designers to use the technologies they are comfortable with, without having to dig into the JavaScript.

####Data binding

Montage makes it easier to manage your application and UI state with data bindings. A UI component or Montage object can establish a one way or bi-directional binding with another component or object. When the bound property of the bound object is updated then the source object is kept in sync.

####Data persistence

Montage Persistence is a database-agnostic data persistance framework, built using tried and tested concepts. It allows you to make efficient and intelligent use of your database or data store, and improves data portability. With Montage Persistence, you can use the best data store for your needs behind the scenes, while writing to one common API.

####Serialization

Montage supports serialization of the object graph using pure JSON. It describes the objects, properties, components, data bindings, and DOM relationships that make up a Montage application.

####Event Management

The Montage event manager wraps and extends the user-agent’s native event handling. This allows for better performance, simpler event handling logic, and the ability to observe property changes.

--------

###Prerequisites

To get started with Montage, you will need the following:

-   An account on GitHub. Montage is hosted in a private GitHub repository.
-   A GIT client, and public SSH key. For details on installing GIT and creating your key, see the setup guides for Mac and Windows.
-   A local web server to serve Montage application. Montage applications can only be served from an HTTP address, not from a local file URL.
-   A recent stable release of Chrome or Safari.
    For more information: on what Montage is about and why to use it, see this page.

###Quick setup

If you’re already familiar with using Git, GitHub, and how to configure a local web server,

1.  In a terminal window, create a new projects folder (eg. ~/Projects).
    ``mkdir Projects``
    ``cd Projects``
2.  Clone Montage into ~/Projects
    ``git clone git@github.com:Motorola-Mobility/montage.git``
3.  Configure your local web server to serve the ~/Projects folder over HTTP.
    Please refer to the suggested Apache configuration found at ``etc/apache-montage.conf``.  This
    will need to be configured and installed wherever your Apache installation will load other configuration files (eg /etc/apache2/other).
4.  Verify your setup by browsing to [http://localhost:8081/montage/examples/photofx/index.html](http://localhost:8081/montage/examples/photofx/index.html).

    If you successfully ran the PhotoFX sample, check out the [Hello](http://tetsubo.org/docs/montage/hello-montage-tutorial/), Montage tutorial.

    If you run into problems, see [quick start guide](http://tetsubo.org/home/quickstart/).

--------

###CommonJS

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

Montage supports the following forms of mappings:

By location string.

```javascript
{
    "mappings": {
        "local-name": "path/to/package/"
    }
}
```

By ``location`` property.

```javascript
{
    "mappings": {
        "local-name": {
            "location": "path/to/package/"
        }
    }
}
```

All other properties of a mapping are presently ignored.
