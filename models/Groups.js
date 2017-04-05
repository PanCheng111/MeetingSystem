/**
 * Created by Administrator on 2015/4/15.
 * 文件对象
 */
var mongoose = require('mongoose');
var shortid = require('shortid');
var Schema = mongoose.Schema;

var GroupsSchema = new Schema({
    _id: {
        type: String,
        unique: true,
        'default': shortid.generate
    },
    name:  String,
    power: {type: String, default: "未设置"},
});

var Groups = mongoose.model("Groups",GroupsSchema);

module.exports = Groups;

