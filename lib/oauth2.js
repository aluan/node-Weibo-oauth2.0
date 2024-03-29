var querystring= require('querystring'),
    crypto= require('crypto'),
    https= require('https'),
    OAuthUtils= require('./_utils'),
    URL= require('url');

exports.OAuth2= function(clientId, clientSecret, baseSite, authorizePath, accessTokenPath) {
  this._clientId= clientId;
  this._clientSecret= clientSecret; 
  this._baseSite= baseSite; 
  this._authorizeUrl= authorizePath || "/oauth/authorize";
  this._accessTokenUrl= accessTokenPath || "/oauth/access_token";
  this._accessTokenName= "access_token";
}

// This 'hack' method is required for sites that don't use
// 'access_token' as the name of the access token (for requests).
// ( http://tools.ietf.org/html/draft-ietf-oauth-v2-16#section-7 )
// it isn't clear what the correct value should be atm, so allowing
// for specific (temporary?) override for now.
exports.OAuth2.prototype.setAccessTokenName= function ( name ) {
  this._accessTokenName= name;
}

exports.OAuth2.prototype._getAccessTokenUrl= function() {
  return this._baseSite + this._accessTokenUrl; /* + "?" + querystring.stringify(params); */
}

exports.OAuth2.prototype._request= function(method, url, headers, post_body, access_token, callback) {

  var creds = crypto.createCredentials({ });  
  var parsedUrl= URL.parse( url, true );   
  if( parsedUrl.protocol == "https:" && !parsedUrl.port ) parsedUrl.port= 443;
  
  var realHeaders= {}; 
  if( !headers['Content-Type']) {
    headers['Content-Type']= "application/x-www-form-urlencoded";
  }
  if( headers ) {
    for(var key in headers) {
      realHeaders[key] = headers[key];
    }
  }
  realHeaders['Host']= parsedUrl.host;

  realHeaders['Content-Length']= post_body ? Buffer.byteLength(post_body) : 0;
  if( access_token ) {
    if( ! parsedUrl.query ) parsedUrl.query= {};
    parsedUrl.query[this._accessTokenName]= access_token;
  }

  var result= "";
  var queryStr= querystring.stringify(parsedUrl.query);
  if( queryStr ) queryStr=  "?" + queryStr;
  var options = {
    host:parsedUrl.hostname,
    port: parsedUrl.port,
    path: parsedUrl.pathname + queryStr,
    method: method,
    headers: realHeaders
  };

  // Some hosts *cough* google appear to close the connection early / send no content-length header
  // allow this behaviour.
  var allowEarlyClose= OAuthUtils.isAnEarlyCloseHost(options.host);
  var callbackCalled= false;
  function passBackControl( response, result ) {
    if(!callbackCalled) {
      callbackCalled=true;  
	console.log('response.statusCode :'+response.statusCode);
      if( response.statusCode != 200 && (response.statusCode != 301) && (response.statusCode != 302) ) {
        callback({ statusCode: response.statusCode, data: result });
      } else {
        callback(null, result, response);
      }
    }
  }
   console.log('options:'+JSON.stringify(options));
  var request = https.request(options, function (response) {
    response.on("data", function (chunk) {
      result+= chunk
    });
    response.on("close", function (err) {
      if( allowEarlyClose ) {
        passBackControl( response, result );
      }
    });
    response.addListener("end", function () {
      passBackControl( response, result );
    });
  });
  request.on('error', function(e) {
    callbackCalled= true;
    callback(e);
  });

  if(  method == 'POST' && post_body ) { 
	console.log('post_body:'+post_body);
     request.write(post_body);
  }
  request.end();
} 


exports.OAuth2.prototype.getAuthorizeUrl= function( params ) {
  var params= params || {};
  params['client_id'] = this._clientId;
  params['redirect_uri'] = params['redirect_uri'];
  return this._baseSite + this._authorizeUrl + "?" + querystring.stringify(params);
}

exports.OAuth2.prototype.getOAuthAccessToken= function(type, params, callback) {
  var params= params || {};
  params['client_id'] = this._clientId;
  params['client_secret'] = this._clientSecret; 
	if ( type === 'token' ) {
		params['grant_type'] = 'refresh_token';
		params['refresh_token'] = params['refresh_token'];
	} else if ( type === 'code' ) {
		params['grant_type'] = 'authorization_code';
		params['code'] = params['code'];
		params['redirect_uri'] = params['redirect_uri'];
	} else if ( type === 'password' ) {
		params['grant_type'] = 'password';
		params['username'] = params['username'];
		params['password'] = params['password'];
	} else {
		throw new OAuthException("wrong auth type");
	}

  var post_data= querystring.stringify( params );   
  console.log('post_body:'+ post_data);
  var post_headers= {
       'Content-Type': 'application/x-www-form-urlencoded'
   };


  this._request("POST", this._getAccessTokenUrl(), post_headers, post_data, null, function(error, data, response) {
    if( error )  callback(error);
    else {
      var results;
      try {
        // As of http://tools.ietf.org/html/draft-ietf-oauth-v2-07
        // responses should be in JSON
        results= JSON.parse( data );
      }
      catch(e) {
        // .... However both Facebook + Github currently use rev05 of the spec
        // and neither seem to specify a content-type correctly in their response headers :(
        // clients of these services will suffer a *minor* performance cost of the exception
        // being thrown
        results= querystring.parse( data );
      }
      var access_token= results["access_token"];
      var refresh_token= results["refresh_token"];
      delete results["refresh_token"];
      callback(null, access_token, refresh_token,results);
    }
  });
} 

// Deprecated
exports.OAuth2.prototype.getProtectedResource= function(url, access_token, callback) {
  this._request("GET", url, {}, "", access_token, callback );
}

exports.OAuth2.prototype.get= function(url, access_token, callback) {
  this._request("GET", url, {}, "", access_token, callback );
}
exports.OAuth2.prototype.post= function(url, params,access_token, callback) {
  this._request("POST", url, {},params, access_token, callback );
}
