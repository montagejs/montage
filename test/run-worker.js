var WORKER_PATH = "worker.js",
    initializeWorker, teardownWorker;
(function () {
    var serviceWorker = window.navigator.serviceWorker,
        workerPath = WORKER_PATH;

    function pruneWorkerRegistrations() {
        var registrationsPromise = serviceWorker.getRegistrations ? serviceWorker.getRegistrations() : Promise.all([serviceWorker.getRegistration()]),
            promises = [];

        return registrationsPromise.then(function (workerRegistrations) {
            var registrationsToCheck, candidate;
            if (workerRegistrations && workerRegistrations.length > 0) {
                registrationsToCheck = workerRegistrations.slice();

                while (registrationsToCheck.length) {
                    candidate = registrationsToCheck.shift();
                    promises.push(candidate.unregister());
                }
            }
            return Promise.all(promises).then(function (results) {
                var didUnregister = true,
                    i, n;
                for (i = 0, n = results.length; i < n && didUnregister; i++) {
                    didUnregister = didUnregister && results[i];
                }
                return didUnregister;
            });
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
    serviceWorker.addEventListener('message', function (event) {
        console.log("Received Message from Worker: ", event.data);
    });


    initializeWorker = function () {
        return pruneWorkerRegistrations().then(function () {
            return registerWorker();
        }).then(function () {
            return serviceWorkerIsReady();
        }).then(function (workerRegistration) {
            var worker = workerRegistration.active;
            worker.postMessage(JSON.stringify({
                options: {
                    parameters: parseQueryParameters(window.location.search.substring(1))
                },
                name: "init"
            }));
            return null;
        });
    };

    teardownWorker = function () {
        return pruneWorkerRegistrations().then(function (unregisterSuccess) {
            console.log("ServiceWorker teardown complete (" + unregisterSuccess + ")");
            return null;
        });
    };

    window.onload = function () {
        var registerButton = document.getElementById("register"),
            unregisterButton = document.getElementById("unregister");

        registerButton.addEventListener("click", function () {
            initializeWorker();
        });

        unregisterButton.addEventListener("click", function () {
            teardownWorker();
        });
    }
})();
