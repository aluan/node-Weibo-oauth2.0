var	OAuth = require('./oauth2').OAuth2,
	querystring= require('querystring'),
	BASESITE = 'https://api.weibo.com',
	CLIENT_ID = '2225694608',
	REDIRECT_URI='http://aluan.com:8080/oauth',
	CLIENT_SECRET = 'ed3975d78b106096dbc596c24b227502';
var sinaOAuth = module.exports = function(access_token, refresh_token) {
	this.access_token = access_token || null;
	this.refresh_token = refresh_token || null;
	this.oa = new OAuth(CLIENT_ID , CLIENT_SECRET , BASESITE , '/oauth2/authorize','/oauth2/access_token');
};
 sinaOAuth.prototype = {
	getAuthorizeUrl : function(req, res, callback) {
	   var redirect_uri = req.headers.referer + req.url.substr(1);   
	   console.log('requst_uri' + this.oa.getAuthorizeUrl({'redirect_uri':redirect_uri}));	   
	   res.redirect(this.oa.getAuthorizeUrl({'redirect_uri':redirect_uri}));
    },  
	getOAuthAccessToken : function(req, res, code,callback) { 
		var that =this;   
		this.oa.getOAuthAccessToken(
			'code', {'redirect_uri' : REDIRECT_URI ,'code' : code},
			function(error, access_token, refresh_token, results) {
				that.access_token = access_token ;
				callback(error, access_token, refresh_token,results);
			});
	},  
	
	get : function(url, args, callback) {
		if (!this.access_token) return callback("not authorize");
		url = BASESITE + url + '.json';
		url += args ? ('?' + querystring.stringify(args)) : '';
		this.oa.get(url, this.access_token, function(error, data, res) {
			//data = JSON.parse(data);
			callback(error, data, res);
		});
	},
    
	post : function(url, args, callback) {
		if (!this.access_token) return callback("not authorize");
		this.oa.post(BASESITE + url + '.json', querystring.stringify(args), this.access_token,  function(error, data, res) {
			//data = JSON.parse(data);
			callback(error, data, res);
		});
	},
	
	delete: function(url, callback) {
		if (!this.access_token) return callback("not authorize");
		this.oa.delete(url + '.json', this.access_token, function(error, data, res) {
			//data = JSON.parse(data);
			callback(error, data, res);
		});
	},


	/**************** API Method ****************/

	emotions : function(args, callback) {
		this.get('emotions', args, callback);
	},
	

	/********** statuses *********/

	update : function(args, callback) {
		if (!args.status) return callback('missing argument status');
		this.post('/2/statuses/update', args, callback);
	},

	destory: function(args, callback) {
		if (!args.id) return callback('missing argument id');
		this.delete('/2/statuses/destory/' + args.id, callback);
	},

	repost: function(args, callback) {
		/* args参数:
		 * 	id : 微博id
		 * 	status : 转发文本 
		 * 	is_comment 0-不发评论 1-发评论给当前微博 2-发评论给原微博 3-都发
		 */
		if (!args.id) return callback('missing argument id');
		this.post('/2/statuses/repost', args, callback);
	},

	/********* comment **********/

	comment: function(args, callback) {
		if (!args.id) return callback('missing argument id');
		if (!args.comment) return callback('missing argument comment');
		this.post('/2/statuses/comment', args, callback);
	},
	
	comment_destory: function(args, callback) {
		if (!args.id) return callback('missing argument id');
		this.delete('/2/statuses/comment_destory/' + args.id, callback);
	},

	comment_destory_batch: function(args, callback) {
		if (!args.ids) return callback('missing argument ids');
		this.post('/2/statuses/comment/destory_batch', args, callback);
	},

	comment_reply: function(args, callback) {
		if (!args.id || !args.cid || !args.comment) return callback('missing argument');
		this.post('/2/statuses/reply', args, callback);
	},

 
	/********* user **********/
	
	user_show: function(args, callback) {
		this.get('/2/users/show', args, callback);
	}, 
	
	user_hot: function(args, callback) {
		this.get('users/hot', args, callback);
	},
	
	user_suggestions: function(args, callback) {
		this.get('users/suggestions', args, callback);
	},

	user_update_remark: function(args, callback) {
		if (!args.user_id || !args.remark) return callback('missing argument');
		this.post('user/friends/update_remark', args, callback);
	},

	/********* friendships **********/

	friend_create: function(args, callback) {
		if (args.id) {
			this.post('friendships/create/' + args.id, args, callback);
		} else {
			this.post('friendships/create', args, callback);
		}
	},
	
	friend_destory: function(args, callback) {
		if (args.id) {
			this.delete('friendships/destory/' + args.id, callback);
		} else {
			this.post('friendships/destory', args, callback);
		}
	},

	friend_exists: function(args, callback) {
		if (!args.user_a || !args.user_b) return callback('missing argument user_a or user_b');
		this.get('friendships/exists', args, callback);
	},

	friend_show: function(args, callback) {
		this.get('friendships/show', args, callback);
	},

	/********* direct_messages **********/
	
	dm: function(args, callback) {
		this.get('direct_messages', args, callback);
	},

	dm_sent: function(args, callback) {
		this.get('direct_messages_sent', args, callback);
	},

	dm_new: function(args, callback) {
		if (!args.id || !args.text) return callback('missing argument');
		this.post('direct_messages/new', args, callback);
	},

	dm_destory: function(args, callback) {
		if (!args.id) return callback('missing argument id');
		this.delete('direct_messages/destory/' + args.id, callback);
	},	
	
	dm_destory_batch: function(args, callback) {
		if (!args.ids) return callback('missing argument ids');
		this.post('direct_messages/destory_batch', args, callback);
	},
	
	/********* trends **********/
	trends: function(args, callback) {
		if (!args.user_id) return callback('missing argument user_id');
		this.get('trends', args, callback);
	},

	trends_statuses: function(args, callback) {
		if (!args.trend_name) return callback('missing argument trend_name');
		this.get('trends/statuses', args, callback);
	},

	trends_follow: function(args, callback) {
		if (!args.trend_name) return callback('missing argument trend_name');
		this.post('trends/follow', args, callback);
	},

	trends_destory: function(args, callback) {
		if (!args.trend_id) return callback('missing argument trend_id');
		this.post('trends/destory', args, callback);
	},

	trends_hourly: function(args, callback) {
		this.get('trends/hourly', args, callback);
	},

	trends_daily: function(args, callback) {
		this.get('trends/daily', args, callback);
	},

	trends_weekly: function(args, callback) {
		this.get('trends/weekly', args, callback);
	},


	/********* account **********/

	verify: function(args, callback) {
		this.get('account/verify_credentials', args, callback);
	},

	rate_limit_status: function(args, callback) {
		this.get('account/rate_limit_status', args, callback);
	},

	update_profile: function(args, callback) {
		this.get('account/update_profile', args, callback);
	},

	/********* account **********/
	
	fav: function(args, callback) {
		this.get('favorites', args, callback);
	},
	
	fav_create: function(args, callback) {
		if (!args.id) return callback('missing arguments id');
		this.post('favorites/create', args, callback);
	},

	fav_destory: function(args, callback) {
		if (!args.id) return callback('missing argument id');
		this.delete('favorites/destory/' + args.id, callback);
	},	
	
	fav_destory_batch: function(args, callback) {
		if (!args.ids) return callback('missing argument ids');
		this.post('favorites/destory_batch', args, callback);
	},
}; 
/********* statuses API Method **********/
['public_timeline', 'friends_timeline', 'user_timeline', 'mentions', 'comments_timeline', 
'comments_by_me', 'comments_to_me','comments', 'counts', 'repost_timeline', 'repost_by_me', 
'unread', 'reset_count', 'friends', 'followers'].forEach(function(fnName) {
	sinaOAuth.prototype[fnName] = function(args, callback) {
		this.get('/2/statuses/' + fnName, args, callback)
	}
});
