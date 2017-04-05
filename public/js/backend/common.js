
/**
 * Created by Administrator on 2015/11/16.
 */
$(function(){

    $('#selectAll').click(function(){
        if($(this).prop('checked')){
            $('.datalist input[name=listItem]').prop('checked',true);
        }else{
            $('.datalist input[name=listItem]').prop('checked',false);
        }
        getSelectIds();
    });

});

function getSelectIds(){
    var checkBoxList = $(".datalist input[name='listItem']:checkbox");
    var ids = '';
    var nids = '';
    if(checkBoxList.length>0){
        $(checkBoxList).each(function(i){
            if (true == $(this).prop("checked")) {
                ids += $(this).prop('value') + ',';
                if($(this).attr('nid')){
                    nids += $(this).attr('nid') + ',';
                }

            }
        });
        $('#targetIds').val(ids.substring(0,ids.length - 1));
        $('#expandIds').val(nids.substring(0,nids.length - 1));
    }
}


//angularJs https Post方法封装
function angularHttpPost($http,isValid,url,formData,callBack){
    if(isValid){
        $http({
            method  : 'POST',
            url     : url,
            data    : $.param(formData),  // pass in data as strings
            headers : { 'Content-Type': 'application/x-www-form-urlencoded' }  // set the headers so angular passing info as form data (not request payload)
        })
        .success(function(data) {
            //  关闭所有模态窗口
            $('.modal').each(function(i){
                $(this).modal("hide");
            });

            if(data == 'success'){
                callBack(data);
            }else{
                $.tipsShow({ message : data, type : 'warning' });
            }
        });
    }
    else{
        $.tipsShow({ message : "参数校验不通过", type : 'warning' });
    }
}


/*初始化上传图片按钮
* id 初始化上传按钮
* type 文件类型
* key 上传对象是所属 管理员头像、用户头像、文档首图等，后台根据key来进行不同规格的图片压缩
* */
function initUpload(foldPath){

    var uploader = WebUploader.create({
        // swf文件路径
        swf: '/plugins/webuploader/Uploader.swf',
        // 文件接收服务端。
        server: '/admin/manage/filesList/upload?folderPath=' + foldPath,
        // 选择文件的按钮。可选。
        // 内部根据当前运行是创建，可能是input元素，也可能是flash.
        pick: {
            id: '#filePicker',
            label: '点击上传文件'
        },
        dnd: '#dndArea',
        // 不压缩image, 默认如果是jpeg，文件上传前会压缩一把再上传！
        resize: false
    });
    // 当有文件被添加进队列的时候
    uploader.on( 'fileQueued', function( file ) {
        $('.uploader-list').append( '<div id="' + file.id + '" class="item">' +
            '<h4 class="info">' + file.name + '</h4>' +
            '<p class="state">等待上传...</p>' +
        '</div>' );
    });
    // 文件上传过程中创建进度条实时显示。
    uploader.on( 'uploadProgress', function( file, percentage ) {
        var $li = $( '#'+file.id ),
        $percent = $li.find('.progress .progress-bar');
        // 避免重复创建
        if ( !$percent.length ) {
            $percent = $('<div class="progress progress-striped active">' +
            '<div class="progress-bar" role="progressbar" style="width: 0%">' +
            '</div>' +
            '</div>').appendTo( $li ).find('.progress-bar');
        }
        $li.find('p.state').text('上传中');
        $percent.css( 'width', percentage * 100 + '%' );
    });

    uploader.on( 'uploadSuccess', function( file ) {
        $( '#'+file.id ).find('p.state').text('已上传');
    });
    uploader.on( 'uploadError', function( file ) {
        $( '#'+file.id ).find('p.state').text('上传出错');
    });
    uploader.on( 'uploadComplete', function( file ) {
        $( '#'+file.id ).find('.progress').fadeOut();
    });

    var $upload = $('#ctlBtn');
    $upload.on('click', function() {
        uploader.upload();
    });

}

//提示用户操作窗口
function initCheckIfDo($scope,targetId,msg,callBack){
    $('#checkIfDo').on('show.bs.modal', function (event) {
        if(targetId){
            $scope.targetID = targetId;
        }
        $(this).find('.modal-msg').text(msg);
    }).on('hide.bs.modal', function (event) {
        $scope.targetID ="";
    });
    $('#checkIfDo').modal('show');
    //确认执行删除
    $scope.confirmDo = function (currentID) {
        callBack(currentID);
    };
}

//主要针对删除操作
function angularHttpGet($http,url,callBack){
    $http.get(url).success(function(result){
        $('.modal').each(function(i){
            $(this).modal("hide");
        });
        if(result == 'success'){
            callBack(result);
        }else{
            $.tipsShow({ message : result, type : 'warning' });
        }
    })
}

//关闭模态窗口初始化数据
function clearModalData($scope,modalObj){
    $scope.formData = {};
    $scope.targetID = "";
    modalObj.find(".form-control").val("");
}


//文件管理器
function getFolderList($scope,$http,path,convert){
    $("#dataLoading").removeClass("hide");
    if (convert == undefined) convert = "";
    $http.get("/admin/manage/filesList/list?filePath="+path+"&convert="+convert).success(function(result){
        $scope.fileData = result.pathsInfo;
        //$scope.rootPath = result.rootPath;
        $scope.currentPath =  path;
        $("#dataLoading").addClass("hide");

    })
}

// 获取当前文件目录
function getCurrentPath($scope,path){
    if(path){
        var cutLength = ($scope.rootPath).length;
        var currentPath  = path.substring(cutLength,path.length);
        return currentPath;
    }else{
        return "";
    }
}


function initPageInfo($scope){
    $("#dataLoading").removeClass("hide");
    $scope.selectPage = [
        {name:'10',value : '10'},
        {name:'20',value : '20'},
        {name:'30',value : '30'}
    ];
    $scope.limitNum = '10';
    $scope.currentPage = 1;
    $scope.totalPage = 1;
    $scope.totalItems = 1;
    $scope.limit = 10;
    $scope.pages = [];
    $scope.startNum = 1;
    $scope.keywords = $('#searchInput').val();
    $scope.area = $('#pageArea').val();
}


//翻页组件
function getPageInfos($scope,$http,url,reqType){

    // 定义翻页动作
    $scope.loadPage = function(page){
        $scope.currentPage = page;
        getPageInfos($scope,$http,url)
    };

    $scope.nextPage = function () {
        if ($scope.currentPage < $scope.totalPage) {
            $scope.currentPage++;
            getPageInfos($scope,$http,url);
        }
    };

    $scope.prevPage = function () {
        if ($scope.currentPage > 1) {
            $scope.currentPage--;
            getPageInfos($scope,$http,url);
        }
    };

    $scope.firstPage = function () {
        if ($scope.currentPage > 1) {
            $scope.currentPage = 1;
            getPageInfos($scope,$http,url);
        }
    };

    $scope.lastPage = function () {
        if ($scope.currentPage < $scope.totalPage) {
            $scope.currentPage = $scope.totalPage;
            getPageInfos($scope,$http,url);
        }
    };

    $scope.changeOption = function(){
        $scope.limit = Number($scope.limitNum);
        getPageInfos($scope,$http,url);
    };

    $http.get(url+"?limit="+$scope.limit+"&currentPage="+$scope.currentPage+"&searchKey="+$scope.keywords+"&area="+$scope.area).success(function(result){
        console.log("getData success!");
        if(reqType == 'normalList'){
            $scope.data = result.docs;
        }else if(reqType == 'themeShop'){
            $scope.themeShop = result.docs;
        }else{
            $scope.data = result.docs;
        }
        if(result.pageInfo){
            $scope.totalItems = result.pageInfo.totalItems;
            $scope.currentPage = result.pageInfo.currentPage;
            $scope.limit = result.pageInfo.limit;
            $scope.startNum = result.pageInfo.startNum;
            //获取总页数
            $scope.totalPage = Math.ceil($scope.totalItems / $scope.limit);

            var pageArr = [];
            var page_start = $scope.currentPage - 2 > 0 ? $scope.currentPage - 2 : 1;
            var page_end = page_start + 4 >= $scope.totalPage ? $scope.totalPage : page_start + 4;
            for(var i=page_start;i<=page_end;i++){
                pageArr.push(i);
            }
            $scope.pages = pageArr;

        }else{
            console.log("获取分页信息失败")
        }
        $("#dataLoading").addClass("hide");

    })
}

//初始化普通列表分页
function initPagination($scope,$http, bigCategory){
    initPageInfo($scope);
    getPageInfos($scope,$http,"/admin/manage/objList/"+bigCategory,'normalList');
}

//初始化删除操作
function initDelOption($scope,$http,bigCategory, info){

    // 单条记录删除
    $scope.delOneItem = function(id){
        initCheckIfDo($scope,id,info,function(currentID){
            angularHttpGet($http,"/admin/manage/"+bigCategory+"/del?uid="+currentID,function(){
                initPagination($scope,$http, bigCategory);
            });
        });
    };

    $scope.getNewIds = function(){
        getSelectIds();
    };

    // 批量删除
    $scope.batchDel = function(bigCategory){
        var targetIds = $('#targetIds').val();
        if(targetIds && targetIds.split(',').length > 0){
            initCheckIfDo($scope,$('#targetIds').val(),info,function(currentID){
                angularHttpGet($http,"/admin/manage/"+bigCategory+"/batchDel?ids="+currentID+"&expandIds="+$('#expandIds').val(),function(){
                    initPagination($scope,$http,bigCategory);
                });
            });
        }else{
            alert('请至少选择一项')
        }
    }
}

//获取添加或修改链接
function getTargetPostUrl($scope,bigCategory){
    var url = "/admin/manage/"+bigCategory+"/addOne";
    if($scope.targetID){
        url = "/admin/manage/"+bigCategory+"/modify?uid="+$scope.targetID;
    }
    return url;
}

//普通下拉菜单
/*
 treeObjId 放置树的容器ID
 url 请求树的数据接口
 listId 显示当前选中项的容器ID
 currentId 需要回选的对象ID
 */
function initTreeDataByType($scope,$http,type){

    var params = getTreeParams($scope,type);
    console.log("tree data, params=" + params);
    $http.get(params.url).success(function(result){
        //回选指定值

        if(params.currentId){
            $("#"+params.listId).html(getCateNameById(result,params.currentId));
        }
        var arrTree = changeToTreeJson(result,params.treeObjId);
        var setting = {
            view: {
                dblClickExpand: false,
                selectedMulti: false
            },
            data: {
                simpleData: {
                    enable: true
                }
            },
            callback: {
                beforeClick: beforeClick,
                onClick: afterClick
            }
        };
        function beforeClick(treeId, treeNode) {
            var check = (treeNode && !treeNode.isParent);
            if (!check) alert("不能选择顶级分类");
            return check;
        }
        function afterClick(e, treeId, treeNode){
            var zTree = $.fn.zTree.getZTreeObj(params.treeObjId),
                nodes = zTree.getSelectedNodes(),
                v = "",
                vid = "",
                sortPath = "",
                alias = "";

            nodes.sort(function compare(a,b){return a.id-b.id;});
            for (var i=0, l=nodes.length; i<l; i++) {
                v += nodes[i].name ;
                vid += nodes[i].id ;
                sortPath += nodes[i].sortPath ;
                alias += nodes[i].alias ;
            }
            if(type == "adminGroup"){
                $scope.formData.group = vid;
            }else if(type == "contentCategories"){
                $scope.formData.category = vid;
                $scope.formData.sortPath = sortPath;
                // 针对顶级类别的文章做标记
                if(sortPath.split(',').length == 2){
                    $scope.formData.type = "singer";
                }else if(sortPath.split(',').length == 3){
                    $scope.formData.type = "content";
                }
            }else if(type == "tempForderTree"){
                $scope.formData.forder = v;
            }else if(type == "tempTree"){
                $scope.formData.contentTemp = vid;
            }else if(type == "allThemeFolderTree"){
                $scope.formData.targetTemp = alias ;
                initSystemTempData($scope,$http)
            }

            $('#'+params.listId).html(v);
        }

        $.fn.zTree.init($("#"+params.treeObjId), setting, arrTree);
    })
}

/*根据不同树类型获取建立树所需参数
* adminGroupTree 管理员组
* contentCategories 文档分类树
* tempForderTree 本地模板文件夹树
* tempTree 数据表中可用模板树
* */
function getTreeParams($scope,type){
    
    var currentCate = '';
    var treeParams = {};
    var treeObjId = '';
    var url = '';
    var listId = '';
    var defaultForder = '';

    if(type == 'adminGroup'){
        if($scope.formData && $scope.formData.group){
            currentCate = $scope.formData.group._id;
        }
        treeObjId = 'adminGroupTree';
        url = "/admin/manage/groupsList/list";
        listId = 'groupName';
    }

    return {
        treeObjId : treeObjId,
        url : url,
        listId : listId,
        currentId : currentCate
    }
}

//将后台获取的list解析为tree对象所需的json数据
function changeToTreeJson(result,key,oldValue){
    var arrTree = [];
    var treeItem;
    for(var i=0;i<result.length;i++){
        if(key === "tags"){
            var checkState = false;
            var tagsArr = oldValue.split(",");
            for(var j=0;j<tagsArr.length;j++){
                if(result[i].name === tagsArr[j].toString()){
                    checkState = true;
                    break;
                }
            }
            treeItem = new TagsTree(result[i]._id,result[i].name,checkState);

        }else if(key === "tempTree"){
            treeItem = new TempsTree(result[i]._id,result[i].name,result[i].forder);
        }else if(key === "tempForderTree"){
            treeItem = new TempsTree(0,result[i].name,"");
        }else if(key === "allThemeFolderTree"){
            treeItem = new TempsTree(result[i]._id,result[i].name,result[i].alias);
        }else{
            treeItem = new TreeInfo(result[i]._id,result[i].parentID,result[i].name,result[i].sortPath,result[i].homePage,result[i].contentTemp,true,false);
        }
        arrTree.push(treeItem);
    }
    return arrTree;
}

//    创建树对象结构
function TreeInfo(id,pId,name,sortPath,homePage,contentTemp,open,click){
    this.id = id;
    this.pId = pId;
    this.name = name;
    this.contentTemp = contentTemp;
    this.sortPath = sortPath;
    this.homePage = homePage;
    this.open = open;
    this.click = click;
}

function getCateNameById(result,id){

    for(var i=0;i<result.length;i++){

        if(result[i]._id === id){
            return result[i].name;
        }

    }
    return "请选择类别";
}

