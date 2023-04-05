var AuthorizationManager = require("montage/data/service/authorization-manager").AuthorizationManager,
    Authorization = require("spec/data/logic/authorization/authorization").Authorization,
    AuthorizationService = require("spec/data/logic/authorization/authorization-service").AuthorizationService,
    AuthorizationServiceB = require("spec/data/logic/authorization/authorization-service-b").AuthorizationServiceB,
    NoneService = require("spec/data/logic/authorization/none-service").NoneService,
    OnDemandService = require("spec/data/logic/authorization/on-demand-service").OnDemandService,
    OnFirstFetchService = require("spec/data/logic/authorization/on-first-fetch-service").OnFirstFetchService,
    UpFrontService = require("spec/data/logic/authorization/up-front-service").UpFrontService,
    Map = require("montage/core/collections/map");


describe("An Authorization Manager", function () {

    var authorizationManager, authorizationService;
    beforeEach(function () {
        authorizationManager = new AuthorizationManager();
        authorizationService = new AuthorizationService();
        authorizationServiceB = new AuthorizationServiceB();
        authorizationManager.registerAuthorizationService(authorizationService);
        authorizationManager.registerAuthorizationService(authorizationServiceB);
    });

    it("can be created", function () {
        expect(authorizationManager).toBeDefined();
        expect(authorizationManager._providersByModuleID instanceof Map).toBeTruthy();
        expect(authorizationManager._panelsByModuleID instanceof Map).toBeTruthy();
    });


    it("can track has pending services", function () {
        expect(authorizationManager).toBeDefined();
        expect(authorizationManager.hasPendingServices).toBe(false);
        authorizationManager._pendingServices.add("a/test/authorization-service");
        expect(authorizationManager.hasPendingServices).toBe(true);
        authorizationManager._pendingServices.add("b/test/authorization-service");
        expect(authorizationManager.hasPendingServices).toBe(true);
        authorizationManager._pendingServices.clear();
        expect(authorizationManager.hasPendingServices).toBe(false);
    });



    describe("can skip authorization", function () {

        it("for service with AuthorizationPolicy.NONE", function (done) {
            var service = new NoneService();

            authorizationManager.authorizeService(service).then(function (result) {
                expect(result).toBeNull();
                done();
            });
        });

        it("for service with AuthorizationPolicy.ON_DEMAND without failure", function (done) {
            var service = new OnDemandService();

            authorizationManager.authorizeService(service).then(function (result) {
                expect(result).toBeNull();
                done();
            });
        });
    });

    describe("can authorize individual service", function () {
        it("with AuthorizationPolicy.ON_FIRST_FETCH", function (done) {
            var service = new OnFirstFetchService();


            authorizationService.resolve();
            authorizationManager.authorizeService(service).then(function (result) {
                expect(Array.isArray(result)).toBeTruthy();
                expect(result[0] instanceof Authorization).toBeTruthy();
                done();
            });

        });

        it("with AuthorizationPolicy.ON_DEMAND with failure", function (done) {
            var service = new OnDemandService()
            authorizationService.resolve();
            authorizationManager.authorizeService(service, true).then(function (result) {
                expect(Array.isArray(result)).toBeTruthy();
                expect(result[0] instanceof Authorization).toBeTruthy();
                done();
            });

        });

        it("with AuthorizationPolicy.UP_FRONT", function (done) {
            var service = new UpFrontService();
            authorizationService.resolve();
            authorizationManager.authorizeService(service).then(function (result) {
                expect(Array.isArray(result)).toBeTruthy();
                expect(result[0] instanceof Authorization).toBeTruthy();
                done();
            });


        });

        describe("after authorization expiration", function () {
            //TODO
        });

        describe("after failed authorization", function () {

            it("with single authorization service", function (done) {
                var service = new OnFirstFetchService(),
                    didFail = false,
                    authorizations;

                authorizationService.reject();
                authorizationManager.authorizeService(service).catch(function (e) {
                    didFail = true;
                }).finally(function () {
                    expect(didFail).toBe(true);
                    authorizations = authorizationManager._authorizationsForDataService(service);
                    expect(authorizations.length).toBe(0);
                    authorizationService.reset();
                    authorizationService.resolve();
                    return authorizationManager.authorizeService(service).then(function (result) {
                        expect(Array.isArray(result)).toBeTruthy();
                        expect(result[0] instanceof Authorization).toBeTruthy();
                        authorizations = authorizationManager._authorizationsForDataService(service);
                        expect(authorizations.length).toBe(1);
                        done();
                    });
                })
            });
        });



        it("with all of multiple authorization services", function (done) {
            var service = new OnFirstFetchService(),
                authorizations;


            service.authorizationServices = [
                "spec/data/logic/authorization/authorization-service",
                "spec/data/logic/authorization/authorization-service-b",
            ];

            authorizationService.resolve();
            authorizationServiceB.resolve();
            authorizationManager.authorizeService(service).then(function (result) {
                expect(Array.isArray(result)).toBeTruthy();
                expect(result[0] instanceof Authorization).toBeTruthy();
                expect(result[1] instanceof Authorization).toBeTruthy();
                authorizations = authorizationManager._authorizationsForDataService(service);
                expect(authorizations.length).toBe(2);
                done();
            });
        });

        xit("with one of multiple authorization services", function (done) {
            var service = new OnFirstFetchService(),
                authorizations;


            service.authorizationServices = [
                "spec/data/logic/authorization/authorization-service",
                "spec/data/logic/authorization/authorization-service-b",
            ];

            authorizationService.resolve();
            authorizationManager.authorizeService(service).then(function (result) {
                expect(Array.isArray(result)).toBeTruthy();
                expect(result[0] instanceof Authorization).toBeTruthy();
                authorizations = authorizationManager._authorizationsForDataService(service);
                expect(authorizations.length).toBe(1);
                done();
            });
        });
    });


    describe("can authorize multiple data services", function () {

        // Array of descriptions of DataServices with a particular AuthorizationPolicy.
        // Each of the descriptions has the following structure
        //
        //  constructor:   Constructor function to create the DataService
        //  name:          Human Readable name of the AuthorizationPolicy of this dataService
        //  didFailResult: Boolean stating whether a result is expected after a preceding auth failure
        //  initialResult: Boolean stating whether a result is expected the first time Authorization is requested
        //
        //
        var serviceDescriptors = [
            {
                constructor: OnDemandService,
                name: "OnDemand",
                didFailResult: true,
                initialResult: false
            },
            {
                constructor: OnFirstFetchService,
                name: "OnFirstFetch",
                didFailResult: true,
                initialResult: true
            },
            {
                constructor: NoneService,
                name: "None",
                didFailResult: false,
                initialResult: false
            },
            {
                constructor: UpFrontService,
                name: "UpFront",
                didFailResult: true,
                initialResult: true
            }
        ];

        function testServiceDescriptorWithServiceDescriptorAtIndex(descriptor, index) {
            index = index === undefined ? 0 : index;
            return compareAuthorizations(descriptor, serviceDescriptors[index], false, false).then(function () {
                return compareAuthorizations(descriptor, serviceDescriptors[index], true, false);
            }).then(function () {
                return compareAuthorizations(descriptor, serviceDescriptors[index], false, true);
            }).then(function () {
                return compareAuthorizations(descriptor, serviceDescriptors[index], true, true);
            });
        }

        function compareAuthorizations(descriptorA, descriptorB, didFailA, didFailB) {
            authorizationManager = new AuthorizationManager();
            authorizationService = new AuthorizationService();
            authorizationManager.registerAuthorizationService(authorizationService);
            authorizationService.resolve();
            return testService(descriptorA, didFailA).then(function (result) {
                return testService(descriptorB, didFailB, result && result[0]);
            }).then(function (result) {
                // console.log("***********************");
                return null;
            });
        }

        function testService(descriptor, didFail, authorization) {
            var service = new descriptor.constructor();
            return authorizationManager.authorizeService(service, didFail).then(function (result) {
                var authorizationExisted = !!authorization,
                    shouldHaveResult = didFail ? descriptor.didFailResult : (descriptor.initialResult || authorizationExisted);
                if (shouldHaveResult) {
                    expect(Array.isArray(result)).toBeTruthy();
                    expect(result[0] instanceof Authorization).toBeTruthy();
                    if (authorization) {
                        expect(result[0]).toBe(authorization);
                    }
                } else {
                    expect(result).toBeNull();
                }
                // console.log(descriptor.name, (didFail ? "Fail" : "Initial"), result && result[0]);
                return result;
            });
        }



        describe("with same authorization service", function () {


            it ("with OnDemand Policy First", function(done) {
                var onDemandServiceDescriptor = serviceDescriptors[0];
                testServiceDescriptorWithServiceDescriptorAtIndex(onDemandServiceDescriptor).then(function () {
                    done();
                });
            });

            it ("with OnFirstFetch Policy First", function(done) {
                var firstFetchServiceDescriptor = serviceDescriptors[1];
                testServiceDescriptorWithServiceDescriptorAtIndex(firstFetchServiceDescriptor).then(function () {
                    done();
                });
            });

            it ("with None Policy First", function(done) {
                var noneServiceDescriptor = serviceDescriptors[2];
                testServiceDescriptorWithServiceDescriptorAtIndex(noneServiceDescriptor).then(function () {
                    done();
                });
            });

            it ("with UpFront Policy First", function(done) {
                var upFrontServiceDescriptor = serviceDescriptors[3];
                testServiceDescriptorWithServiceDescriptorAtIndex(upFrontServiceDescriptor).then(function () {
                    done();
                });
            });

        });


        describe("with different authorization services", function () {
            //TODO
        });


        describe("after authorization expiration", function () {
            //TODO
        });
    });

    describe("can logout", function () {

        describe("with single authorization service", function () {

            it("for single data service", function (done) {
                var service = new OnFirstFetchService();
                authorizationService.resolve();
                authorizationManager.authorizeService(service).then(function (result) {
                    expect(Array.isArray(result)).toBeTruthy();
                    expect(result[0] instanceof Authorization).toBeTruthy();
                    expect(authorizationManager._authorizationsForDataService(service).length).toBe(1);
                    authorizationManager.clearAuthorizationForService(service);
                    expect(authorizationManager._authorizationsForDataService(service).length).toBe(0);
                    done();
                });
            });

            it("for multiple data-services", function (done) {
                var serviceA = new OnFirstFetchService(),
                    serviceB = new OnDemandService(),
                    authorization;
                authorizationService.resolve();
                authorizationManager.authorizeService(serviceA).then(function (result) {
                    expect(Array.isArray(result)).toBeTruthy();
                    expect(result[0] instanceof Authorization).toBeTruthy();
                    authorization = result[0];
                    expect(authorizationManager._servicesByProviderModuleID.get(serviceA.authorizationServices[0]).has(serviceA)).toBeTruthy();
                    expect(authorizationManager._authorizationsForDataService(serviceA).length).toBe(1);
                    return authorizationManager.authorizeService(serviceB);
                }).then(function (result) {
                    expect(Array.isArray(result)).toBeTruthy();
                    expect(result[0] instanceof Authorization).toBeTruthy();
                    expect(result[0]).toBe(authorization);
                    expect(authorizationManager._servicesByProviderModuleID.get(serviceA.authorizationServices[0]).has(serviceB)).toBeTruthy();
                    return authorizationManager.clearAuthorizationForService(serviceA);
                }).then(function () {
                    expect(authorization.didLogOut).toBeTruthy();
                    expect(authorizationService.didLogOut).toBeTruthy();
                    expect(authorizationManager._authorizationsForDataService(serviceA).length).toBe(0);
                    return authorizationManager.authorizeService(serviceB);
                }).then(function (result) {
                    expect(result).toBe(null);
                    expect(authorizationManager._authorizationsForDataService(serviceB).length).toBe(0);
                    done();
                });

            });
        });

        it("with async authorization provider", function (done) {
            var service = new OnFirstFetchService(),
                authorization;

            service.authorizationManagerWillAuthorizeWithProvider = function (manager, provider) {
                provider.resolve();
            };

            authorizationManager._providersByModuleID.clear(); //Ensure authorizationService is loaded asynchronously
            authorizationManager.authorizeService(service).then(function (result) {
                expect(Array.isArray(result)).toBeTruthy();
                authorization = result[0];
                expect(authorization).toBeTruthy();
                expect(authorizationManager._authorizationsForDataService(service).length).toBe(1);
                return authorizationManager.clearAuthorizationForService(service);
            }).then(function () {
                return authorizationManager._providersForDataService(service);
            }).then(function (providers) {
                authorizationService = providers[0];
                expect(authorizationService.didLogOut).toBeTruthy();
                expect(authorization.didLogOut).toBeTruthy();
                expect(authorizationManager._authorizationsForDataService(service).length).toBe(0);
                done();
            });

        });
    });


});
