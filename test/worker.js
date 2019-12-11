/********
 *
 * The application is required to register the service
 * worker so it can be registered at the correct scope.
 *
 * The worker cannot be registered from the library i.e.
 *         node_modules/montage/montage-worker.js
 */

 //TODO Although the worker must reside in the application,
 // the code to register and manager the worker could be
 // moved to montage
PATH_TO_MONTAGE = "../";
 importScripts("../node_modules/jasmine-core/lib/jasmine-core/jasmine.js");
 importScripts("jasmine-console-reporter.js");


 self.addEventListener("message", function (event) {
    var string = event.data,
        data, options;
    try {
        data = JSON.parse(string);
        name = data.name; //Included so other messages can be added in the future.
        options = data.options;
    } catch (e) {
        options = {parameters: {}};
    }
    self.isReadyDeferred.resolve(options);
});

 self.isReadyPromise = new Promise(function (resolve, reject) {
    self.isReadyDeferred = {
        resolve: resolve,
        reject: reject
    };
 });

 self.montageDidLoad = function () {
    var path = self.registration.scope.replace(/[^\/]*\.html$/, ""),
        pathToMain = path.replace(/[^\/]*\/?$/, "");
    // Load package
    Montage.Require.loadPackage(path, {
        mainPackageLocation: pathToMain
    })
    .then(function (mr) {
        var jasmine = jasmineRequire.core(jasmineRequire),
            jasmineEnv = jasmine.getEnv(),
            JasmineConsoleReporter = jasmineRequire.ConsoleReporter(),
            jasmineInterface = jasmineRequire.interface(jasmine, jasmineEnv);
            global.jasmine = jasmine;
            global.jasmineRequire = jasmineRequire;
            for (var property in jasmineInterface) {
                if (jasmineInterface.hasOwnProperty(property)) {
                    global[property] = jasmineInterface[property];
                }
            }

            // Default reporter
            jasmineEnv.addReporter(jasmineInterface.jsApiReporter);
            jasmineEnv.addReporter(new JasmineConsoleReporter({
                colors: 1,
                cleanStack: 1,
                verbosity: 4,
                listStyle: 'indent',
                activity: false,
                print: console.log
            }));

        return self.isReadyPromise.then(function (options) {
            var queryParameters = options.parameters,
                specString = queryParameters && queryParameters.spec || "",
                filterString = specString.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'),
                filterPattern = new RegExp(filterString);

            jasmineEnv.specFilter = function (spec) {
                return filterPattern.test(spec.getFullName());
            };
            return mr.async("all");
        });

    }).catch(function (err) {
        console.error('Fail', err, err.stack);
    }).thenReturn();
 };

importScripts("../montage.js");


