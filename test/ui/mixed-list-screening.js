var agent = new Agent();

var config = script.require('config.js').config();

agent.gotoUrl(config.montage_url + "/examples/mixed-list/index.html");
test(["Slider", "Checkbox", "Toggle"]);
agent.gotoUrl(config.montage_url + "/examples/mixed-list/index-native-controls.html");
test(["RangeInput", "Checkbox", "ToggleButton"]);

function test(arrayComponents) {
    agent.setWindowSize(927, 956);

    assertEqual("Add", agent.element("//*[@id='button']").getText());
    assertEqual(arrayComponents[2], agent.component("//*[@id='content']/UL/LI[1]/*").getObjectName());

    var j = 2;
    var component;

    while (arrayComponents.length !== 0) {
        agent.element("//*[@id='button']").click(Mouse.LEFT, 22, 6);
        agent.wait(1000);

        component = agent.component("//*[@id='content']/UL/LI[" + j + "]/*").getObjectName();

        j++;

        var index = arrayComponents.indexOf(component);

        if (index != -1) arrayComponents.splice(index, 1);
    }
}