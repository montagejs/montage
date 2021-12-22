var Model = require('./model').Model;
var Montage = require("montage").Montage;

Model.getInfoForObject = Montage.getInfoForObject;
exports.model = new Model(10);
