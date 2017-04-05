
var doraApp = angular.module('adminApp',[]);

// doraApp.factory('pageData',function(){
//     return {
//         bigCategory : $("#currentCate").val()
//     }
// });

doraApp.factory('getItemService', ['$http', function($http){
    //获取单个对象信息
    var getItemRequest = function(currentPage,targetId){
        var requestPath = "/admin/manage/"+currentPage+"/item?uid="+targetId;
        return $http.get(requestPath)
    };
    return {
        itemInfo : function(currentPage,targetId){
            return getItemRequest(currentPage,targetId);
        }
    }
}]);

//文件管理器
doraApp.controller("filesList",['$scope','$http',function($scope,$http){
    $scope.formData = {};
    $scope.mdFormData = {};
    $scope.fileData = {};

    // 初始化显示方式
    $scope.listView = true;
    getFolderList($scope,$http,"");

    // 监听确认删除弹窗，传递参数
    $scope.delFilesItem = function(filePath){
        initCheckIfDo($scope,'','您确认要删除该文件吗？',function(path){
            angularHttpGet($http,"/admin/manage/filesList/fileDel?filePath="+filePath,function(){
                getFolderList($scope,$http,$scope.currentPath);
            });
        });
    };

    $('#uploadFiles').on('shown.bs.modal', function (e) {
        initUpload($scope.currentPath + '/');
    }).on('hidden.bs.modal', function(e) {
        clearModalData($scope, $(this));
        getFolderList($scope,$http,$scope.currentPath, true);
    });

    // 重命名弹窗参数传递
    $('#reNameFile').on('show.bs.modal', function (event) {
        var obj = $(event.relatedTarget);
        var editPath = obj.data('whatever');
        // 如果不为空则为编辑状态
        if(editPath){
            $scope.formData.oldName = (editPath.split(","))[0];
            $scope.formData.path = (editPath.split(","))[1];
            $scope.targetID = (editPath.split(","))[1];
        }else{

        }
    }).on('hidden.bs.modal', function (e) {
        // 清空数据
        clearModalData($scope,$(this));
    });

    // 重命名弹窗参数传递
    $('#newFolder').on('show.bs.modal', function (event) {
        var obj = $(event.relatedTarget);
        var editPath = obj.data('whatever');
        // 如果不为空则为编辑状态
      //  if(editPath){
            $scope.formData.path = $scope.currentPath | "/";
            $scope.targetID = null;
      //  }
    }).on('hidden.bs.modal', function (e) {
        // 清空数据
        clearModalData($scope,$(this));
    });


    // 修改html代码参数传递
    $('#modifyFile').on('show.bs.modal', function (event) {
        var obj = $(event.relatedTarget);
        var editPath = obj.data('whatever');
        // 如果不为空则为编辑状态
        if(editPath){
            $scope.mdFormData.name = (editPath.split(","))[0];
            $scope.mdFormData.path = (editPath.split(","))[1];
            $scope.targetID = (editPath.split(","))[1];
            $http.get("/admin/manage/filesList/getFileInfo?filePath="+$scope.mdFormData.path).success(function(result){
                $scope.mdFormData.code = result.fileData;
            })
        }else{

        }
    }).on('hidden.bs.modal', function (e) {
        // 清空数据
        $scope.mdFormData = {};
        clearModalData($scope,$(this));
    });

    $scope.processForm = function(isValid){
        var curentUrl; 
        $scope.formData.newPath = $scope.currentPath +"/"+ $scope.formData.newName;
        if($scope.targetID)
        {
            $scope.formData.newPath = $scope.currentPath +"/"+ $scope.formData.newName;
            curentUrl = "/admin/manage/filesList/fileReName";
        }
        else {
            // 否则就是增加文件夹
            $scope.formData.newPath = $scope.currentPath +"/"+ $scope.formData.newName;
            curentUrl = "/admin/manage/filesList/addFolder";
        }
        
        angularHttpPost($http,isValid,curentUrl,$scope.formData,function(data){
            getFolderList($scope,$http,$scope.currentPath);
        });
    };


    // 提交更新后的文件
    $scope.processMdForm = function(isValid){

        angularHttpPost($http,isValid,'/admin/manage/filesList/updateFileInfo',$scope.mdFormData,function(data){
            getFolderList($scope,$http,$scope.currentPath);
        });

    };


    $scope.newFolder  = function(){
        //alert("开发中...")

    };
    // 列表或缩略图切换
    $scope.listViewShow = function(){
        $scope.listView = true;
    };

    $scope.thumbnailViewShow = function(){
        $scope.listView = false;
    };

    // 进入点击的目录
    $scope.getFiles = function(type,name,path){
        if(type === "folder"){
            // 记录前一路径
            getFolderList($scope,$http,path);
        }else if(type === "image" && $scope.listView){

        }
    };

    $scope.getAllFiles = function(){
        getFolderList($scope,$http,"")
    };

    // 进入上级目录
    $scope.getPrePath = function(){
        // 找到上级目录
        var currentPathArr = ($scope.currentPath).split("/");
        if(currentPathArr.length > 0){
            var currentFolderLength = (currentPathArr[currentPathArr.length-1]).length + 1;
            var prePath = ($scope.currentPath).substring(0,($scope.currentPath).length - currentFolderLength);
            $scope.prePath = prePath;
        }
        getFolderList($scope,$http,$scope.prePath);
    }

}]);


doraApp.controller("GroupsList",['$scope','$http','getItemService', function($scope,$http, getItemService){
    $scope.formData = {};
    $scope.formData.power = {};
    $scope.checkInfo = {};
    //获取管理员用户组列表
    initPagination($scope,$http, 'GroupsList');
    //初始化管理栏目列表
    //initPowerList($scope);
    //删除用户
    initDelOption($scope,$http, 'GroupsList','您确认要删除选中的用户组吗？');

    // 修改用户
    $('#addAdminGroup').on('show.bs.modal', function (event) {
        var obj = $(event.relatedTarget);
        var editId = obj.data('whatever');
        var modalTitle = $(this).find('.modal-title');
        // 如果不为空则为编辑状态
        if(editId){
            modalTitle.text("编辑用户组");
            getItemService.itemInfo('GroupsList', editId).success(function(result){
                $scope.formData.name = result.name;
                if(result.power){
                    $scope.formData.power = JSON.parse(result.power);
                    // 回选checkbox
                    var powerTreeObj = eval(result.power);
                    for(var i=0;i<powerTreeObj.length;i++){
                        var checkedId = powerTreeObj[i].split(':')[0];
                        //var treeObj = $.fn.zTree.getZTreeObj("groupPowerTree");
                        //var node = treeObj.getNodeByParam("id", checkedId, null);
                        //if(node){
                        //    node.checked = true;
                        //    treeObj.updateNode(node);
                        //}
                    }
                }
                $scope.targetID = editId;
            })
        }else{
            modalTitle.text("添加新用户组");
            //cancelTreeCheckBoxSelect("groupPowerTree");
            $scope.formData = {};
        }
    }).on('hidden.bs.modal', function (e) {
        // 清空数据
        //cancelTreeCheckBoxSelect("groupPowerTree");
        clearModalData($scope,$(this));
    });

    // 添加新用户组
    $scope.processForm = function(isValid){
        var groupData = {
            name : $scope.formData.name,
            power : JSON.stringify($scope.formData.power)
        };
        angularHttpPost($http,isValid,getTargetPostUrl($scope, 'GroupsList'), groupData,function(data){
            initPagination($scope, $http, 'GroupsList');
        });
    }
}]);


//管理员用户列表
doraApp.controller("UsersList",['$scope','$http','getItemService',function($scope,$http,getItemService){

    $scope.formData = {};
    //获取管理员列表信息
    initPagination($scope,$http, 'UsersList');
    //删除用户
    initDelOption($scope,$http, 'UsersList', '您确认要删除选中的管理员吗？');
    // //logo上传
    // initUploadFyBtn('uploadULogoImg','images',"userlogo",function(data){
    //     $.tipsShow({
    //         message : '上传成功',
    //         type : 'success' ,
    //         callBack : function(){
    //             $("#userLogo").attr("src",data);
    //             $scope.formData.logo = data;
    //         }
    //     });

    // });
    // 修改用户
    $('#addNewUser').on('show.bs.modal', function (event) {
        var obj = $(event.relatedTarget);
        var editId = obj.data('whatever');
        console.log('editId=' + editId);
        // 如果不为空则为编辑状态
        if(editId){
            getItemService.itemInfo('UsersList', editId).success(function(result){
                $scope.formData = result;
                $scope.targetID = editId;
                initTreeDataByType($scope,$http,'adminGroup');
            })
        }else{
            $scope.formData = {};
            initTreeDataByType($scope,$http, 'adminGroup');
        }

    }).on('hidden.bs.modal', function (e) {
        // 清空数据
        clearModalData($scope,$(this));
    });

    //添加新用户或修改用户
    $scope.processForm = function(isValid){
        if(!$scope.formData.group){
            $.tipsShow({
                message : '请选择用户组',
                type : 'warning' ,
                callBack : function(){
                    return;
                }
            });
        }else{
            angularHttpPost($http,isValid,getTargetPostUrl($scope, 'UsersList'), $scope.formData, function(data){
                initPagination($scope,$http, 'UsersList');
            });
        }

    };

}]);

//管理会议列表
doraApp.controller("MeetingsList",['$scope','$http','getItemService',function($scope,$http,getItemService){

    $scope.formData = {};
    //获取管理员列表信息
    initPagination($scope,$http, 'MeetingsList');
    //删除用户
    initDelOption($scope,$http, 'MeetingsList', '您确认要删除选中的会议吗？');
    // //logo上传
    // initUploadFyBtn('uploadULogoImg','images',"userlogo",function(data){
    //     $.tipsShow({
    //         message : '上传成功',
    //         type : 'success' ,
    //         callBack : function(){
    //             $("#userLogo").attr("src",data);
    //             $scope.formData.logo = data;
    //         }
    //     });

    // });
    // 修改用户
    $('#addNewMeeting').on('show.bs.modal', function (event) {
        var obj = $(event.relatedTarget);
        var editId = obj.data('whatever');
        console.log('editId=' + editId);
        // 如果不为空则为编辑状态
        if(editId){
            getItemService.itemInfo('MeetingsList', editId).success(function(result){
                $scope.formData = result;
                $scope.targetID = editId;
                //initTreeDataByType($scope,$http,'adminGroup');
            })
        }else{
            $scope.formData = {};
            //initTreeDataByType($scope,$http, 'adminGroup');
        }

    }).on('hidden.bs.modal', function (e) {
        // 清空数据
        clearModalData($scope,$(this));
    });

    //添加新用户或修改用户
    $scope.processForm = function(isValid){
        if(!isValid){
            $.tipsShow({
                message : '创建失败',
                type : 'warning' ,
                callBack : function(){
                    return;
                }
            });
        }else{
            angularHttpPost($http,isValid,getTargetPostUrl($scope, 'MeetingsList'), $scope.formData, function(data){
                initPagination($scope,$http, 'MeetingsList');
            });
        }

    };

}]);
