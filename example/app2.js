//need express and ejs
var express = require('express'),
	sinaOAuth = require('../lib/sinaOAuth2'),
	app = express.createServer();

app.use(express.logger({ format: ':method :url :status' }));
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session({ secret: 'Aluan' }));
app.use(app.router);

app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));

app.error(function(err, req, res){
	console.log("500:" + err + " file:" + req.url)
	res.render('500');
});

app.set('views', __dirname + '/views');
app.register('.html', require('ejs'));
app.set('view engine', 'html');
app.set('view options', {layout: false})


app.get('/', function(req, res){
	res.render('index.html');
});

app.get('/oauth', function(req, res){
    var sinaoauth = new sinaOAuth();
 	var sinaoauth = new sinaOAuth();      
	 console.log('url:' + req.url);
	  var code = req.url.split('?')[1] || '';
	 code = code.split('=')[1];
	 console.log('code:' + code);
	 var that = this; 
	if(req.cookies.access_token){
		 sinaoauth = new sinaOAuth(req.cookies.access_token,req.cookies.refresh_token); 
		 sinaoauth.user_show({'uid' : req.cookies.uid }, function(err, data) {
		 	if (err) return console.log(err);
		 	res.render('oauth2.html', {user: JSON.parse(data)});
		 });
	}else if(code){
		 sinaoauth.getOAuthAccessToken(req, res,code,function(err, access_token, refresh_token,results){ 
		 	if (err) return console.log(err);     
		 	res.cookie("access_token", access_token,{ path: '/' });
		 	res.cookie("refresh_token", refresh_token,{ path: '/' });
		 	res.cookie("uid", results["uid"],{ path: '/' });   
		 	console.log("access_token:"+access_token);  
		 	console.log("refresh_token:"+refresh_token); 
		 	console.log("user_id:"+results["uid"]); 
		     //res.render('oauth.html');
		     sinaoauth.user_show({'uid' : results["uid"] }, function(err, data) {
		 		if (err) return console.log(err);
		 		res.render('oauth2.html',{user: JSON.parse(data)});
		 	}); 
		 }); 
	}else{
	 	sinaoauth.getAuthorizeUrl(req, res, null);        
	}    	 
});
app.get('/test', function(req, res) {
	var sinaoauth = new sinaOAuth(req.cookies.access_token, req.cookies.refresh_token);
	sinaoauth.friends_timeline({}, function(err, data) {
		if (err) return console.log(err);
		console.log('data:'+JSON.parse(data).statuses) ;
		res.render('test.html', {statuses: JSON.parse(data).statuses});
	});
});
      
app.post('/test', function(req, res) {
	var sinaoauth = new sinaOAuth(req.cookies.access_token, req.cookies.refresh_token); 
	console.log('content:' + req.body.status);
	sinaoauth.update({'access_token':req.cookies.access_token,'status' : req.body.status }, function(err, data){
		if (err) return console.log(err);
		res.redirect('./test');
	});
}); 

app.listen(8080);
