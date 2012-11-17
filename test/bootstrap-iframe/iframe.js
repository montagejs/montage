
var frame = document.createElement("iframe");
frame.src = "iframed.html";
document.body.appendChild(frame);

window.addEventListener("message", function (event) {
    if (event.data.type === "montageReady") {
        frame.contentWindow.postMessage({
            type: "montageInit",
            location: "",
            packageDescription: {
                dependencies: {
                    montage: "*"
                }
            }
        }, "*");
    }
});

