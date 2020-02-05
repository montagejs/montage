


var WORKER_PATH = "worker.js",
    initializeWorker, teardownWorker;
(function () {
    var serviceWorker = window.navigator.serviceWorker,
        workerPath = WORKER_PATH,
        workerURL = urlForPath(workerPath);


    function urlForPath(path) {
        var anchor = window.document.createElement("a");
        anchor.href = path;
        return anchor.href.toString();
    }

    function doesRegistrationMatchURL(registration, workerURL) {
        var url = registration && registration.active && registration.active.scriptURL;
        return url && String(url) === String(workerURL);
    }

    function pruneWorkerRegistrations() {
        var registrationsPromise = serviceWorker.getRegistrations ? serviceWorker.getRegistrations() : Promise.all([serviceWorker.getRegistration()]),
            promises = [];

        return registrationsPromise.then(function (workerRegistrations) {
                if (workerRegistrations && workerRegistrations.length > 0) {
                    registrationsToCheck = workerRegistrations.slice();

                    while (registrationsToCheck.length) {
                        candidate = registrationsToCheck.shift();
                        match = doesRegistrationMatchURL(candidate, workerURL);

                        if (match) {
                            promises.push(candidate.unregister());
                        }
                    }
                }
            return Promise.all(promises);
        });
    }

    function registerWorker() {
        return serviceWorker.register(workerPath, {
            scope: window.location.pathname,
            origin: "*"
        }).catch(function (e) {
            console.error(e);
        });
    }

    var serviceWorkerIsReadyPromise;
    function serviceWorkerIsReady() {
        if (!serviceWorkerIsReadyPromise) {
            serviceWorkerIsReadyPromise = new Promise(function (resolve, reject) {
                serviceWorker.ready.then(function (result) {
                    resolve(result);
                });
            });
        }
        return serviceWorkerIsReadyPromise;
    }

    function parseQueryParameters(query) {
        var parameters = {},
            string = query.replace(/\+/g, " "),
            pattern = /([^&=]+)=?([^&]*)/g,
            match;
            while (match = pattern.exec(string)) {
                parameters[decodeURIComponent(match[1])] = decodeURIComponent(match[2]);
            }
        return parameters;
    }

    initializeWorker = function() {
        return pruneWorkerRegistrations().then(function () {
            return registerWorker();
        }).then(function () {
            return serviceWorkerIsReady();
        }).then(function (workerRegistration) {
            var worker = workerRegistration.active;
            console.log("ServiceWorker initialization complete", worker);
            // debugger;
            worker.postMessage(JSON.stringify({
                options: {
                    parameters: parseQueryParameters(window.location.search.substring(1))
                },
                name: "init"
            }));
            return null;
        });
    };

    teardownWorker = function() {
        return pruneWorkerRegistrations().then(function () {
            console.log("ServiceWorker teardown complete");
            return null;
        });
    };
})();
