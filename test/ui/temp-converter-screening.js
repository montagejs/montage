/*global script,Agent,Key,Mouse,assertEqual */
var config = script.require('config.js').config();

var agent = new Agent();
agent.gotoUrl(config.montage_url+"/examples/temp-converter/index.html");

//var celsius = agent.element("/HTML/BODY/DIV/LABEL[1]/INPUT");
//var fahrenheit = agent.element("/HTML/BODY/DIV/LABEL[2]/INPUT");

var celsius = agent.element("//input[@data-montage-id='celsius']");
var fahrenheit = agent.element("//input[@data-montage-id='fahrenheit']");


agent.setWindowSize(927, 965);
agent
    .mouseDown(484,477)
    .mouseMove([{"x":484,"y":478,"duration":0},{"x":370,"y":481,"duration":150}])
    .mouseUp(370,481)
    .mouseMove([{"x":370,"y":482,"duration":0},{"x":373,"y":482,"duration":83}]);
celsius.sendKeys(Key.BACKSPACE);
celsius.sendKeys("0");

assertEqual("0", celsius.getText());
assertEqual("32", fahrenheit.getText());

agent.mouseMove([{"x":381,"y":484,"duration":0},{"x":583,"y":489,"duration":417},{"x":592,"y":469,"duration":367}]);
celsius.click(Mouse.LEFT,152,15);

assertEqual("1", celsius.getText());
assertEqual("33.8", fahrenheit.getText());

agent.mouseMove([{"x":592,"y":470,"duration":0},{"x":591,"y":484,"duration":200}]);
celsius.click(Mouse.LEFT,151,30);

assertEqual("0", celsius.getText());
assertEqual("32", fahrenheit.getText());

agent
    .mouseMove([{"x":587,"y":486,"duration":0},{"x":540,"y":508,"duration":150},{"x":499,"y":541,"duration":234}])
    .mouseDown(499,541);
fahrenheit.focus();
agent.mouseUp(499,541);
fahrenheit.click(Mouse.LEFT,59,25);
agent.mouseMove([{"x":500,"y":543,"duration":0},{"x":502,"y":543,"duration":284}]);
fahrenheit.sendKeys(Key.UP);
agent.wait(2024);

assertEqual("0.5555555555555556", celsius.getText());
assertEqual("33", fahrenheit.getText());

fahrenheit.sendKeys(Key.DOWN);
assertEqual("0", celsius.getText());
assertEqual("32", fahrenheit.getText());

celsius.sendKeys(Key.BACKSPACE);
celsius.sendKeys("-40");

assertEqual("-40", fahrenheit.getText());


celsius.sendKeys(Key.BACKSPACE);
celsius.sendKeys(Key.BACKSPACE);
celsius.sendKeys(Key.BACKSPACE);
celsius.sendKeys("100");
assertEqual("212", fahrenheit.getText());

fahrenheit.sendKeys(Key.BACKSPACE);
fahrenheit.sendKeys(Key.BACKSPACE);
fahrenheit.sendKeys(Key.BACKSPACE);
fahrenheit.sendKeys("32");

assertEqual("0", celsius.getText());

celsius.sendKeys(Key.BACKSPACE);

assertEqual("", celsius.getText());
assertEqual("", fahrenheit.getText());


agent.element("//*[@data-montage-id='barometer']").mouseDown(5,95);
agent.element("//*[@data-montage-id='barometer']").mouseUp(5,95);


assertEqual("-25", celsius.getText());
assertEqual("-13", fahrenheit.getText());

agent.element("//*[@data-montage-id='barometer']").click(Mouse.LEFT,8,1);
assertEqual("50", celsius.getText());
assertEqual("122", fahrenheit.getText());

// ==== End Recorded Script ====
