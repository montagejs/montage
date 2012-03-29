/*global script,Agent,Key,Mouse,assertEqual,assertNotEqual */
var config = script.require('config.js').config();
var agent = new Agent();

agent.gotoUrl(config.montage_url+"/test/ui/buttontest/buttontest.html");

var output = agent.element("#output");
// Using an input to avoid screening bug where keys can't be sent to a button
var button = agent.element("#loggingbutton");

button.sendKeys(Key.SPACE);
assertEqual("pressed", output.getText());