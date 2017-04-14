/**
 * Created by Administrator on 2015/4/15.
 * 文件对象
 */
var mongoose = require('mongoose');
var shortid = require('shortid');
var Schema = mongoose.Schema;

var Groups = require('./Groups');
var Users = require('./Users');
//var Schedules = require('./Schedules');

var MeetingsSchema = new Schema({
    _id: {
        type: String,
        unique: true,
        'default': shortid.generate
    },
    name:  String,
    subject: String,
    state: { type: String, default : "已开启" },
    schedules: [{type: String}],
    groupsAttend : [{type: String, ref: "Groups"}],
    usersAttend : [{type: String, ref: "Users"}],
    usersCheckIn : [{type: String}],
});

MeetingsSchema.statics = {

    getOneItem : function(res, targetId, callBack){
        Meetings.findOne({'_id' : targetId}).populate('groupsAttend')
        .populate({
            path:'usersAttend',
            populate: {
                path: 'group',
            }
        }).exec(function(err, meeting){
            if(err){
                res.end(err);
            }
            callBack(meeting);
        })
    }

};


var Meetings = mongoose.model("Meetings", MeetingsSchema);

module.exports = Meetings;

