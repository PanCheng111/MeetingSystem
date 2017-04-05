module.exports = {

    // debug 为 true 时，用于本地调试
    debug: false,
    imgZip : true, // 上传图片是否压缩(如果为false则本地不需要安装gm)
    session_secret: 'pms_secret', // 务必修改
    auth_cookie_name: 'pms',
    encrypt_key : 'dora',
//    数据库配置
    URL: 'mongodb://127.0.0.1:27017/pms',
    DB: 'doracms',
    HOST: '',
    PORT: 27017,
    USERNAME: '',
    PASSWORD: '',

//    站点基础信息配置
    SITEVERSION : 'v1.1.1', // 静态资源版本戳
    UPLOADFOLDER : process.cwd()+'/public/upload', // 默认上传文件夹本地路径
    TEMPSTATICFOLDER : process.cwd()+'/public/themes/', // 模板静态文件路径
}
