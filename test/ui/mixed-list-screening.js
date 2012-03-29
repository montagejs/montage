var agent = new Agent();

var config = script.require('config.js').config();
agent.gotoUrl(config.montage_url+"/examples/mixed-list/index.html");

agent.setWindowSize(927, 956);

assertEqual("Add", agent.element("//*[@id='button']").getText());
assertEqual("Toggle", agent.component("//*[@id='content']/UL/LI[1]/DIV").getObjectName());

var arrayComponents = ["Slider","Checkbox","Toggle"];
var j=2;
var component;

while (arrayComponents.length != 0)
   {
   agent.element("//*[@id='button']").click(Mouse.LEFT,22,6);
   agent.wait(2000);

   component = agent.component("//*[@id='content']/UL/LI["+j+"]/*").getObjectName();

   j++;

   var index = arrayComponents.indexOf(component);

   if (index != -1)
     arrayComponents.splice(index, 1);
   }
