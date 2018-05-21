var RawDataService = require("montage/data/service/raw-data-service").RawDataService,
    PersonC = require("spec/data/logic/model/person-c").PersonC;

exports.RawPersonServiceC = RawDataService.specialize({
    

    fetchRawData: {
        value: function (stream) {
            stream.addData(this._mockData);
            stream.dataDone();
        }
    },

    _mockData: {
        get: function () {
            if (!this.__mockData) {
                this.__mockData = MOCK_DATA.map(function (rawPerson) {
                    var person = new PersonC(),
                        date = new Date();
                    person.name = rawPerson.person_name;
                    date.setTime(rawPerson.birth_date);
                    person.birthday = date;
                    return person;
                });
            }
            return this.__mockData;
        }
    },

    saveDataObject: {
        value: function (object) {
            return this.nullPromise;
        }
    }

});

var MOCK_DATA = [
    {
        person_name: "Jared Leto",
        birth_date: 647283226915,
        lat_lng: {latitude: 39.9042, longitude: 116.4074}
    },
    {
        person_name: "Addison Reed",
        birth_date: 402269116915,
        lat_lng: {latitude: 40.7128, longitude: 74}
    },
    {
        person_name: "Wolf Blitzer",
        birth_date: 982587226915,
        lat_lng: {latitude: -27.4698, longitude: 153.0251}
    }
];