var AuthorizationManager = require("montage/data/service/authorization-manager").AuthorizationManager,
    AuthorizationManagerPanel = require("montage/ui/authorization-manager-panel.reel").AuthorizationManagerPanel,
    AuthorizationPanel = require("spec/data/ui/authorization/authorization-panel.reel").AuthorizationPanel,
    Authorization = require("spec/data/logic/authorization/authorization").Authorization;


describe("An AuthorizationManagerPanel", function () {


    it("can be created", function () {
        expect(new AuthorizationManagerPanel()).toBeDefined();
    });

    it ("can authorize with panel", function (done) {
        var managerPanel = AuthorizationManagerPanel.instance,
            panel = new AuthorizationPanel(),
            promise = managerPanel.authorizeWithPanel(panel);
        
        expect(managerPanel.panels.indexOf(panel) !== -1).toBe(true);
        expect(managerPanel._authorizationPromiseByPanel.has(panel)).toBe(true);
        promise.then(function (value) {
            expect(value).toBeDefined();
            expect(managerPanel.panels.length).toBe(0);
            expect(managerPanel._authorizationPromiseByPanel.size).toBe(0);
            done();
        });
        panel.approveAuthorization();
    });

    it ("can reject authorization with panel", function (done) {
        var managerPanel = AuthorizationManagerPanel.instance,
            panel = new AuthorizationPanel(),
            promise = managerPanel.authorizeWithPanel(panel),
            isError = true;

        
        expect(managerPanel.panels.indexOf(panel) !== -1).toBe(true);
        expect(managerPanel._authorizationPromiseByPanel.has(panel)).toBe(true);
        promise.then(function (value) {
            //Should not be called
            isError = false;
        }).catch(function (e) {
            expect(managerPanel.panels.length).toBe(0);
            expect(managerPanel._authorizationPromiseByPanel.size).toBe(0);
        }).finally(function () {
            expect(isError).toBe(true);
            done();
        });
        panel.rejectAuthorization();
    });

    xit("can authorize with modal", function () {
        //TODO
    });

    xit("can reject authorization with modal", function () {
        //TODO
    });

});
