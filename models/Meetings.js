/**
 * Created by Administrator on 2015/4/15.
 * 文件对象
 */
var mongoose = require('mongoose');
var shortid = require('shortid');
var Schema = mongoose.Schema;

var Groups = require('./Groups');
var Users = require('./Users');

var MeetingsSchema = new Schema({
    _id: {
        type: String,
        unique: true,
        'default': shortid.generate
    },
    name:  String,
    subject: String,
    state: { type: String, default : "已开启" },
    schedule: {type: [String], default : []},
    attendGroups : {type: [String], ref: ["Groups"]},
    attendUsers : {type: [String], ref: ["Users"]},
});

MeetingsSchema.statics = {

    getOneItem : function(res, targetId, callBack){
        Users.findOne({'_id' : targetId}).populate('attendGroups').populate('attendUsers').exec(function(err, user){
            if(err){
                res.end(err);
            }
            callBack(user);
        })
    }

};


var Meetings = mongoose.model("Meetings", MeetingsSchema);

module.exports = Meetings;

