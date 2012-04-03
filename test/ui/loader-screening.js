var agent = new Agent();

var config = script.require('config.js').config();
agent.gotoUrl(config.montage_url+"/examples/app-template/index.html");

agent.setWindowSize(927, 979);

while (agent.element("/HTML/BODY/DIV/P").getText() == "This is the bootstrapper content which will now be shown for at least 1500ms.")
    agent.wait(1000);
while (agent.element("/HTML/BODY/DIV/P").getText() == "This is the loader content which will now be shown for at least 2000ms.")
	agent.wait(1000);

assertEqual("Main component of application",agent.element("/HTML/BODY/DIV/P").getText());
assertEqual("Other component of application",agent.element("/HTML/BODY/DIV/DIV/P").getText());

agent.refresh();

while (agent.element("/HTML/BODY/DIV/P").getText() == "This is the bootstrapper content which will now be shown for at least 1500ms.")
	agent.wait(1000);
while (agent.element("/HTML/BODY/DIV/P").getText() == "This is the loader content which will now be shown for at least 2000ms.")
    agent.wait(1000);

assertEqual("Main component of application",agent.element("/HTML/BODY/DIV/P").getText());
assertEqual("Other component of application",agent.element("/HTML/BODY/DIV/DIV/P").getText());
