var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

/*模板引擎*/
var partials = require('express-partials');

var index = require('./routes/index');
var admin = require('./routes/admin');

//允许跨域访问
var cors = require('cors')

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(partials());

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', cors());
app.use('/api', express.static(path.join(__dirname, 'public')));

//解决异步层次混乱问题
app.use(require('express-promise')());

app.use('/', index);
app.use('/admin', admin);
app.use('/api', admin);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  if (err.status == 404)
    res.render('404', { page_header: "错误", layout:'main'});
  else res.render('500', { page_header: "错误", layout:'main' });
});

module.exports = app;
