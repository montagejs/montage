var Montage = require("montage").Montage;

exports.HomeTest = Montage.create(Montage, {

    flowPath: {
        value: {
            value: function (slide) {
                var path={
                        translateX: 10+slide.time,
                        transformOriginY: (slide.index&1)?"top":"bottom",
                        rotateX: Math.abs(slide.speed)/1600
                    };

                if (slide.index&1) {
                    path.style={
                        top: "50%",
                        marginTop: "7px"
                    }
                } else {
                    path.style={
                        bottom: "50%",
                        marginBottom: "7px"
                    }
                }

                return path;
            }
        }
    }

});

/*

var AppDelegate = exports.AppDelegate = Montage.create(Montage, {
    deserializedFromReel: {
        value: function() {
            var scroll = Montage.create(Scroll),
                flow = Montage.create(Flow),
                flowOffset = Montage.create(FlowOffset),
                flowIndexFromTarget = Montage.create(FlowIndexFromTarget),
                slide=[],
                i;

            scroll.element = document.getElementById("flow");

            for (i=0; i<16; i++) {
                slide[i]=document.createElement("img");
                slide[i].src="images/"+((i&1)?(17-(i>>1)):(i>>1))+".jpg";
            }

            flow.element = document.getElementById("flow");
            flow.nodeList = slide;
            flow.needsDraw = true;
            flowOffset.numberOfNodes=16;
            flowOffset.scale=145;
            flow.path={
                value: function (slide) {
                    var path={
                            translateX: 10+slide.time,
                            transformOriginY: (slide.index&1)?"top":"bottom",
                            rotateX: Math.abs(slide.speed)/1600
                        };

                    if (slide.index&1) {
                        path.style={
                            top: "50%",
                            paddingTop: "7px"
                        }
                    } else {
                        path.style={
                            bottom: "50%",
                            paddingBottom: "7px"
                        }
                    }
                    return path;
                }
            };

            Object.defineBinding(flow, "nodeOffset", {boundObject: flowOffset, boundObjectPropertyPath: "offset"});
            Object.defineBinding(scroll, "scrollX", {boundObject: flowOffset, boundObjectPropertyPath: "origin"});
            Object.defineBinding(scroll, "maxScrollX", {boundObject: flowOffset, boundObjectPropertyPath: "length"});
            Object.defineBinding(flowIndexFromTarget, "flowElement", {boundObject: scroll, boundObjectPropertyPath: "element"});
            Object.defineBinding(flowIndexFromTarget, "pointerEventData", {boundObject: scroll, boundObjectPropertyPath: "pointerStartEventData"});
            Object.defineBinding(flowOffset, "selectedSlideIndex", {boundObject: flowIndexFromTarget, boundObjectPropertyPath: "selectedIndex"});
        }
    }
});*/
