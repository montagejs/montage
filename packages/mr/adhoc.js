
var URL = require("mini-url");
var QS = require("qs");

var a = document.createElement("a");

var packageLocation;
var moduleId;

if (window.location.search) {
    var query = QS.parse(window.location.search.slice(1));
    var packageLocation = query['package-location'];
    var moduleId = query['module-id'];
    document.querySelector("[name=package-location]").value = packageLocation;
    document.querySelector("[name=module-id]").value = moduleId;
    run(packageLocation, moduleId);
}

function run(packageLocation, moduleId) {
    packageLocation = URL.resolve(window.location, packageLocation);
    moduleId = moduleId || "";

    console.log("Require:", "package:", JSON.stringify(packageLocation), "id:", JSON.stringify(moduleId));
    require.loadPackage(packageLocation)
    .invoke("async", moduleId)
    .then(function (exports) {
        console.log("Exports:", exports);
        console.log("Packages:", require.packages);
    })
    .done();
}

