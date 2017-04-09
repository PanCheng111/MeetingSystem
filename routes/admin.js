var express = require('express');
var router = express.Router();
var multer = require('multer');
router.caseSensitive = true;

//数据校验
var validator = require('validator');

var url = require('url');
var upload = multer({ dest: 'uploads/' });

//系统操作
var system = require("../util/system");
var DbOpt = require('../models/Dbopt');

//站点配置
var settings = require("../models/db/settings");
//var adminFunc = require("../models/db/adminFunc");
var Users = require('../models/Users');
var Groups = require("../models/Groups");
var Meetings = require('../models/Meetings');
var Schedules = require('../models/Schedules');

var PW = require('png-word');
var RW = require('../util/randomWord');
var rw = RW('abcdefghijklmnopqrstuvwxyz1234567890');
var pngword = new PW(PW.GRAY);


//管理员登录页面
router.get('/', function(req, res) {
    req.session.vnum = rw.random(4);
    res.render('login');
});

//刷新验证码
router.get('/vnum',function(req, res){
    var word = req.session.vnum;
    pngword.createPNG(word,function(word){
        res.end(word);
    })
});

// /* GET home page. */
// router.get('/login', function(req, res, next) {
//     res.render('login');
// });

router.post('/doLogin', function(req, res, next) {

    var userName = req.body.userName;
    var password = req.body.password;
    var vnum = req.body.vnum;
    var newPsd = DbOpt.encrypt(password,settings.encrypt_key);

    if(vnum != req.session.vnum){
        req.session.vnum = rw.random(4);
        res.end('验证码有误！');
    }else{
            Users.findOne({'userName':userName,'password':newPsd}).populate('group').exec(function(err,user){
                if(err){
                    res.end(err);
                }
                if(user) {
                    //req.session.adminPower = user.group.power;
                    req.session.logined = true;
                    //获取管理员通知信息
                    res.end("success");
                }else{
                    console.log("登录失败");
                    res.end("用户名或密码错误");
                }
            });

    }
});

router.get('/doLogin', function(req, res, next) {
    var params = url.parse(req.url,true);
    var userName = params.query.userName;
    var password = params.query.password;

    var newPsd = DbOpt.encrypt(password, settings.encrypt_key);


            Users.findOne({'userName':userName,'password':newPsd}).populate('group').exec(function(err,user){
                if(err){
                    res.end(err);
                }
                if(user) {
                    //req.session.adminPower = user.group.power;
                    req.session.logined = true;
                    //获取管理员通知信息
                    res.json({
                        status : 'success'
                    });
                }else{
                    console.log("登录失败");
                    res.json({
                        status : 'fail'
                    });
                }
            });

});

router.get('/manage', function(req, res, next) {
    res.render('index', {title: '欢迎进入无纸化会议系统管理后台', page_header: "管理后台", layout: 'main'});
});

// 管理员退出
router.get('/logout', function(req, res) {
    req.session.logined = false;
    res.redirect("/admin");
});


//-------------------------对象列表查询开始(带分页)-------------------------------

router.get('/manage/objList/:defaultUrl',function(req,res){

    var category = req.params.defaultUrl;
    var targetObj = getTargetObj(category);
    var params = url.parse(req.url,true);
    var keywords = params.query.searchKey;
    var area = params.query.area;
    var keyPr = [];
    //携带可能的查询条件
    // if(keywords){
    //     var reKey = new RegExp(keywords, 'i');
    //     if(targetObj == AdminUser){
    //         keyPr = {'userName' : { $regex: reKey} };
    //     }else if(targetObj == User){
    //         keyPr.push({'userName' : { $regex: reKey } });
    //         keyPr.push({'name' : { $regex: reKey } });
    //     }else if(targetObj == ContentTags){
    //         keyPr.push({'alias' : { $regex: reKey } });
    //         keyPr.push({'name' : { $regex: reKey } });
    //     }else if(targetObj == Ads){
    //         keyPr.push({'name' : { $regex: reKey } });
    //     }
    // }
    //keyPr = adminFunc.setQueryByArea(req,keyPr,targetObj,area);
    DbOpt.pagination(targetObj,req, res,keyPr);

});


//-------------------------对象列表查询结束(带分页)-------------------------------


//-------------------------对象删除开始-------------------------

router.get('/manage/:defaultUrl/del',function(req,res){
    var currentPage = req.params.defaultUrl;
    var params = url.parse(req.url,true);
    var targetObj = getTargetObj(currentPage);
    DbOpt.del(targetObj, req, res, "del one obj success");

});

//批量删除对象
router.get('/manage/:defaultUrl/batchDel',function(req,res){
    var currentPage = req.params.defaultUrl;
    var params = url.parse(req.url,true);
    var targetObj = getTargetObj(currentPage);
    var ids = params.query.ids;
    var idsArr = ids.split(',');

        targetObj.remove({'_id':{$in: idsArr}},function(err){
            if(err){
                res.end(err);
            }else{
                res.end("success");
            }
        });

});

//-------------------------对象删除结束-------------------------



//-------------------------获取单个对象数据开始-------------------------
router.get('/manage/:defaultUrl/item',function(req,res){
    var currentPage = req.params.defaultUrl;
    var targetObj = getTargetObj(currentPage);
    var params = url.parse(req.url,true);
    var targetId = params.query.uid;

    if(targetObj == Users){
        Users.getOneItem(res, targetId, function(user){
            return res.json(user);
        });
    } else if (targetObj == Meetings) {
        console.log("item here! targetId=" + targetId);
        Meetings.getOneItem(res, targetId, function(meeting) {
            return res.json(meeting);
        });
    }
    else{
        DbOpt.findOne(targetObj, req, res, "find one obj success");
    }

});

//-------------------------获取单个对象数据结束-------------------------



//-------------------------更新单条记录(执行更新)开始--------------------
router.post('/manage/:defaultUrl/modify',function(req,res){
    var currentPage = req.params.defaultUrl;
    var targetObj = getTargetObj(currentPage);
    var params = url.parse(req.url,true);

    if (targetObj == Meetings) {
        Meetings.findOne({_id: req.body._id}, function(err, meeting) {
            if (meeting.name != req.body.name) {
                system.renameFolderForMeeting(settings.UPLOADFOLDER + "/" + meeting.name, 
                                                settings.UPLOADFOLDER + "/" + req.body.name);
            }
        });
    }
    DbOpt.updateOneByID(targetObj,req, res,"update one obj success")

});


//-------------------------更新单条记录(执行更新)结束--------------------



//-------------------------对象新增开始-------------------------
router.post('/manage/:defaultUrl/addOne',function(req,res){

    var currentPage = req.params.defaultUrl;
    var targetObj = getTargetObj(currentPage);
    
    if(targetObj == Users){
        console.log('get request to add one user');
        addOneUser(req, res);
    } else if (targetObj == Meetings) {
        addOneMeeting(req, res);
    }
    else {
        DbOpt.addOne(targetObj, req, res);
    }
});

//-------------------------对象新增结束-------------------------


//------------------------------------------文件管理器开始

router.get('/manage/filesList', function(req, res, next) {
    res.render('filesList', {page_header: "文件管理", layout:'main'});
});

//文件夹列表查询
router.get('/manage/filesList/list', function(req, res) {
    var params = url.parse(req.url,true);
    var path = params.query.filePath;
    var convert = params.query.convert;
    console.log("filesList/list querypath=" + path + " convert=" + convert);
    //避免伪造路径
    if(path.indexOf('../') >= 0){
        res.json({});
    }else{
        var filePath = system.scanFolder(settings.UPLOADFOLDER, path);
        if (convert == "true") {
            console.log("filePath=" + filePath.toString());
            system.convertDocToPDF(filePath, 0);
        }
        //    对返回结果做初步排序
        filePath.sort(function(a,b){return a.type == "folder" ||  b.type == "folder"});
        return res.json({
            pathsInfo : filePath
        });
    }
});
//文件删除
router.get('/manage/filesList/fileDel', function(req, res) {
    var params = url.parse(req.url,true);
    var path = settings.UPLOADFOLDER + params.query.filePath;
  //  if(adminFunc.checkAdminPower(req, settings.filesList[0] + '_del')){
    if(path){
        system.deleteFolder(req, res, path,function(){
            res.end('success');
        });
    }else{
        res.end(settings.system_noPower);
    }
});

//文件重命名
router.post('/manage/filesList/fileReName', function(req, res) {
    var newPath = settings.UPLOADFOLDER + req.body.newPath;
    var path = settings.UPLOADFOLDER + req.body.path;
   // if(adminFunc.checkAdminPower(req,settings.filesList[0] + '_modify')){
        if(path && newPath){
            system.reNameFile(req,res,path,newPath);
        }else{
            res.end(settings.system_noPower);
        }
});

//新建文件夹
router.post('/manage/filesList/addFolder', function(req, res) {
    var newPath = settings.UPLOADFOLDER + req.body.newPath;
    system.addFolder(req, res, newPath);
});

//保存上传的文件
router.post('/manage/filesList/upload', upload.single('file'), function(req, res) {
    var params = url.parse(req.url,true);
    var path = settings.UPLOADFOLDER + params.query.folderPath;
    console.log('move file to folder = ' + path);
    console.log('filename=' + req.file.filename + ' path=' + req.file.path);
    system.moveFile(req, res, req.file, path);
});

//修改文件内容读取文件信息
router.get('/manage/filesList/getFileInfo', function(req, res) {

    if(adminFunc.checkAdminPower(req,settings.filesList[0] + '_view')){
        var params = url.parse(req.url,true);
        var path = settings.UPLOADFOLDER + params.query.filePath;
        if((params.query.filePath).indexOf('../') >= 0){
            res.end(settings.system_noPower);
        }
        if(path){
            system.readFile(req,res,path);
        }else{
            res.end(settings.system_noPower);
        }
    }else{
        return res.json({
            fileData : {}
        })
    }
});

//修改文件内容更新文件信息
router.post('/manage/filesList/updateFileInfo', function(req, res) {

    var fileContent = req.body.code;
    var path = settings.UPLOADFOLDER + req.body.path;
    if(adminFunc.checkAdminPower(req,settings.filesList[0] + '_modify')){
        if(path){
            system.writeFile(req,res,path,fileContent);
        }else{
            res.end(settings.system_noPower);
        }
    }else{
        res.end(settings.system_noPower);
    }
});


//--------------------用户组管理开始
router.get('/manage/groupsList', function(req, res) {
    res.render('groupsList', {page_header: "用户组管理", layout:'main'});
});

router.get('/manage/groupsList/list', function(req, res) {
    DbOpt.findAll(Groups, req, res, "request adminGroupList")
});

//--------------------用户管理开始
router.get('/manage/usersList', function(req, res) {
    console.log("usersList start");
    var params = url.parse(req.url,true);
    res.render('usersList', {
            page_header: "用户管理",             
            searchKey : params.query.searchKey,
            currentLink : req.originalUrl,
            layout:'main'
        });
});

router.get('/manage/usersList/list', function(req, res) {
    DbOpt.findAll(Users, req, res, "request adminUsersList")
});

router.get('/manage/usersList/findByName', function(req, res) {
    var params = url.parse(req.url,true);
    Users.findOneByName(res, params.query.name, function(user){
        return res.json(user);
    });
});

router.get('/manage/usersList/findByGroupName', function(req, res) {
    var params = url.parse(req.url, true);
    Users.findAllByGroupName(res, params.query.groupName, function(usersList) {
        return res.json(usersList);
    });
});


//--------------------会议管理开始
router.get('/manage/meetingsList', function(req, res) {
    var params = url.parse(req.url,true);
    res.render('meetingsList', {
            page_header: "会议管理",             
            searchKey : params.query.searchKey,
            currentLink : req.originalUrl,
            layout:'main'
        });
});

router.get('/manage/meetingsList/list', function(req, res) {
    DbOpt.findAll(Meetings, req, res, "request adminMeetingsList")
});

router.get('/manage/meetingsList/edit', function(req, res) {
    var params = url.parse(req.url,true);
    var meetingId = params.query.id;
    res.render('meetingEdit', {
        meeting_id: meetingId,
        page_header: "会议设置",
        layout: 'main'
    })
});

router.post('/manage/meetingsList/edit', function(req, res) {
    var params = url.parse(req.url,true);
    var meetingId = params.query.id;
    var meetingInfo = req.body;
    modifyMeetingInfo(res, meetingId, meetingInfo);
});



//-----------公共函数------

function getTargetObj(currentPage) {
    var targetObj;
    if(currentPage === 'UsersList' ){
            targetObj = Users;
    }else if(currentPage === 'GroupsList' ){
            targetObj = Groups;
    }else if(currentPage === 'MeetingsList' ){
            targetObj = Meetings;
    }
    return targetObj;
}


//添加系统用户
function addOneUser(req,res){
    var errors;
    var userName = req.body.userName;
    if(/^[a-zA-Z][a-zA-Z0-9_]{4,11}$/.test(userName)){
        Users.findOne({userName:req.body.userName},function(err,user){
            if(user){
                errors = "该用户名已存在！";
                res.end(errors);
            }else{
                if(!req.body.group){
                    errors = "请选择用户组！";
                }
                if(errors){
                    res.end(errors)
                }else{
                    // 密码加密
                    console.log("add one user");
                    req.body.password = DbOpt.encrypt(req.body.password, settings.encrypt_key);
                    req.body.group = new Groups({_id : req.body.group});
                    console.log("save user to db");
                    DbOpt.addOne(Users, req, res);
                }
            }
        })
    }else{
        res.end(settings.system_illegal_param)
    }

}

//添加会议
function addOneMeeting(req, res) {
    var errors ;
    Meetings.findOne({name:req.body.name}, function(err, meeting) {
        if (meeting) {
            errors = "该会议已经存在!";
            res.end(errors);
        }
        else {
            var ret = system.createFolderForMeeting(settings.UPLOADFOLDER + "/" + req.body.name);
            if (!ret) res.end("创建会议文件夹失败！");
            else DbOpt.addOne(Meetings, req, res);
        }
    });
}

//修改会议信息 
function modifyMeetingInfo(res, meetingId, meetingInfo) {
    Meetings.update({_id: meetingId}, {$set: meetingInfo}, function (err, result) {
        if (err) {
            res.end('修改会议出现错误');
        }
        else {
            res.end('success');
        }
    });

}

module.exports = router;
