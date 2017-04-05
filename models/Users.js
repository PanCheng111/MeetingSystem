/**
 * Created by Administrator on 2015/4/15.
 * 文件对象
 */
var mongoose = require('mongoose');
var shortid = require('shortid');
var Schema = mongoose.Schema;

var Groups = require('./Groups');

var UsersSchema = new Schema({
    _id: {
        type: String,
        unique: true,
        'default': shortid.generate
    },
    name:  String,
    userName : String, //别名
    password : String,
    group : {type: String, ref: "Groups"},
    isAdmin : { type: Boolean, default: false },
});

UsersSchema.statics = {

    getOneItem : function(res,targetId,callBack){
        Users.findOne({'_id' : targetId}).populate('group').exec(function(err, user){
            if(err){
                res.end(err);
            }
            callBack(user);
        })
    }

};


var Users = mongoose.model("Users", UsersSchema);

module.exports = Users;

