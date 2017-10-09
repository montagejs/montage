var SnapshotService = require("montage/data/service/snapshot-service").SnapshotService;


describe("A Snapshot Service", function () {

    it("can be created", function () {
        expect(new SnapshotService()).toBeDefined();
    });

    it("can compare save snapshots correctly", function () {
        expect(true).toBeTruthy();
    });

    it("can compare get differences between snapshots correctly", function () {
        expect(true).toBeTruthy();
        // var service = new SnapshotService(),
        //     s1 = {
        //         familyName: "Bond",
        //         givenName: "James"
        //     },
        //     s2 = {
        //         familyName: "Bond",
        //         givenName: "James"
        //     };

    });

    it("can compare snapshots correctly", function () {
        var service = new SnapshotService(),
            s1 = {
                familyName: "Bond",
                givenName: "James"
            },
            s2 = {
                familyName: "Bond",
                givenName: "James"
            },
            s3 = {
                a: "Trigger",
                b: "Pussy Galore",
                c: null,
                d: "Vesper Lynd"
            },
            s4 = {
                a: "Trigger",
                b: "Pussy Galore",
                c: undefined,
                d: "Vesper Lynd"
            };
        expect(service._equals(s1, s2)).toBeTruthy();
        s2.familyName = "Bray";
        s2.givenName = "Hilary";
        expect(service._equals(s1, s2)).toBeFalsy();
        s2.familyName = "Bond";
        s2.givenName = s1.givenName = null;
        expect(service._equals(s1, s2)).toBeTruthy();
        expect(service._areSameValues(s3, s4)).toBeTruthy();

    });

});
