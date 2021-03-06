var User = require('../models/user');
var GithubStrategy = require('passport-github').Strategy;
var GoogleStrategy = require('passport-google-oauth2').Strategy;


var passportGithub = function(passport){
	passport.serializeUser( function(user,done){
		done(null, user.id);
	});
	passport.deserializeUser(function(id,done){
		var newId;
		if(typeof id!=='string') newId = id[0]._id;
		else newId = id;
		console.log(newId);
		User.findById(newId, function(err,user){
			console.log('deserializing user...',user);
			done(err, user);
		});
	});

  passport.use('google', new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    passReqToCallback: true,
  }, function(request, accessToken, refreshToken, profile, done){
      console.log('This is where we are!!!');
      console.log(profile.emails[0].value);
      User.findOne({'ga_email': profile.emails[0].value}, function(err, user){
        if (err) {
          return done(err);
        } else {
          if (user) {
            return done(null, user);
          } else {
            return done(null, null);
          }
        }
      });
  }));

	passport.use('github', new GithubStrategy({
		clientID: process.env.GITHUB_API_KEY,
		clientSecret: process.env.GITHUB_API_SECRET,
		callbackURL: process.env.GITHUB_CALLBACK_URL,
		enableProof: true,
		profileFields: ['name', 'email']
	}, function(access_token, refresh_token, profile, done){
		process.nextTick(function(){
			User.findOne({'github_username': profile._json.login})
				.then(function(user){
					if(user){
						return user;
					}
					else{
						console.log(profile);
						var newUser = new User();
						newUser.access_token =access_token;
						newUser.name =profile._json.name;
						newUser.email =profile._json.email;
            newUser.github_username =profile._json.login;
						newUser.github = profile._json.html_url;
						newUser.city = profile._json.location;
						newUser.avatar =profile._json.avatar_url;
						newUser.role='student';
						newUser.student_status= 'new applicant';
						return newUser.save();
					}
				})
				.then(function(user){
					return done(null,user);
				})
				.catch(function(err){
					throw err;
				});
		});
	}));
};

module.exports = passportGithub;
