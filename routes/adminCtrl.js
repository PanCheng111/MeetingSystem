var express = require('express');
var router = express.Router();
var multer = require('multer');
router.caseSensitive = true;


router.get("/",function(req,res,next){
    if(isAdminLogined(req)){
        res.redirect("/admin/manage");
    }else{
        next();
    }
});

function isAdminLogined(req){
    return req.session.logined;
}

router.get(["/manage","/manage/*"],function(req,res,next){
    if(isAdminLogined(req)){
        next();
    }else{
        res.redirect("/admin");
    }
});


module.exports = router;

