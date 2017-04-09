/**
 * Created by Administrator on 2015/4/15.
 * 文件对象
 */
var mongoose = require('mongoose');
var shortid = require('shortid');
var Schema = mongoose.Schema;

var SchedulesSchema = new Schema({
    _id: {
        type: String,
        unique: true,
        'default': shortid.generate
    },
    context:  String,
});

var Schedules = mongoose.model("Schedules", SchedulesSchema);

module.exports = Schedules;

