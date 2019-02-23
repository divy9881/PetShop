var express = require("express")
var bodyParser = require("body-parser")
var expressSanitizer = require("express-sanitizer")
var mongoose = require("mongoose")
var methodOverride = require("method-override")
var passport = require("passport")
var passportLocal = require("passport-local")
var passportLocalMongoose = require("passport-local-mongoose")
var expressSession = require("express-session")
var connectFlash = require("connect-flash")
var Pet = require("./Pet.js")
var User = require("./User.js")
var Comment = require("./Comment.js")

var app = express()

app.set("views","./ejs")

app.use(bodyParser.urlencoded({extended:true}))
app.use(expressSanitizer())
app.use(methodOverride("_method"))
app.use(connectFlash())

app.use(express.static("./css"))
app.use(express.static("./js"))

passport.use(new passportLocal(User.authenticate()))
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

app.use(expressSession({
	secret:"qwerty",
	resave:false,
	saveUninitialized:false
}))

app.use(passport.initialize())
app.use(passport.session())

app.use(function(req,res,next){
	res.locals.user = req.user
	next()
})

mongoose.connect("mongodb://localhost:27017/petshop",{useNewUrlParser:true})

app.get("/",function(req,res){
	res.render("home.ejs",{Failure:req.flash("failure")[0]})
})

app.get("/petshop",function(req,res){
	Pet.find({},function(err,Pets){
		if(err){
			conole.log(err)
		}
		else{
			res.render("petshop.ejs",{Pets:Pets,Failure:req.flash("error")[0],Success:req.flash("success")[0]})
		}
	})
})

app.get("/petshop/new",isLoggedIn,function(req,res){
	res.render("newPets.ejs",{Failure:req.flash("error")[0]})
})

app.post("/petshop/new",isLoggedIn,function(req,res){
	sanitize = req.sanitize
	Pet.create({
		name:sanitize(req.body.name),
		animal:sanitize(req.body.animal),
		breed:sanitize(req.body.breed),
		photo:sanitize(req.body.photo),
		details:sanitize(req.body.details),
		author:req.user
	},function(err,Pet){
		if(err){
			console.log(err)
		}
		else{
			res.redirect("/petshop")
		}
	})
})

app.get("/petshop/know/:id",function(req,res){
	Pet.findOne({_id:req.params.id}).populate([
		{path:"author"},
		{path:"comments",
		 populate:{path:"comments"}
		 }
	]).exec(function(err,pet){
		if(err)
		{
			console.log(err)
		}
		else
		{
			let CommentAuthors = []
			if(pet.comments.length!=0){
				pet.comments.forEach(function(comment){
					User.findById(comment.author,function(err,User){
						CommentAuthors.push(User.username)
						if(pet.comments.length == CommentAuthors.length)
						{
							res.render("knowMore.ejs",{Pet:pet,CUsers:CommentAuthors,Failure:req.flash("error")})
						}
					})
				})
			}
			else{
				res.render("knowMore.ejs",{Pet:pet,CUsers:CommentAuthors,Failure:req.flash("error")[0]})
			}
		}
	})
})

app.get("/petshop/edit/:id",isLoggedIn,function(req,res){
	Pet.findById(req.params.id,function(err,pet){
		if(err)
		{
			console.log(err)
		}
		else{
			res.render("editPet.ejs",{Pet:pet,Failure:req.flash("error")[0]})
		}
	})
})

app.put("/petshop/edit/:id",isLoggedIn,function(req,res){
	sanitize = req.sanitize
	Pet.findByIdAndUpdate(req.params.id,{
		name:sanitize(req.body.name),
		animal:sanitize(req.body.animal),
		breed:sanitize(req.body.breed),
		photo:sanitize(req.body.photo),
		details:sanitize(req.body.details),
		author:req.user
	},function(err,Pet){
		if(err){
			console.log(err)
		}
		else{
			res.redirect("/petshop/know/"+req.params.id)
		}
	})
})

app.delete("/petshop/delete/:id",isLoggedIn,function(req,res){
	Pet.findById(req.params.id,function(err,pet){
		if(err){
			console.log(err)
		}
		else if(toString(req.user._id) == toString(pet.author)){
			Pet.deleteOne(pet,function(err){
				if(err)
				{
					console.log(err)
				}
				else
				{
					res.redirect("/petshop")
				}
			})
		}
		else
		{
			res.redirect("/")
		}
	})
})

app.put("/petshop/comment/:id",isLoggedIn,function(req,res){
	var sanitize = req.sanitize
	Pet.findById(req.params.id,function(err,Pet){
		var comment = new Comment({
			Comment:sanitize(req.body.comment),
			author:req.user
		})
		Comment.create(comment,function(err,comment){
			Pet.comments.push(comment)
			Pet.save(function(err,Pet){
				if(err)
				{
					console.log(err)
				}
				else
				{
					res.redirect("/petshop/know/"+req.params.id)
				}
			})
		})		
	})
})

app.get("/login",isLoggedOut,function(req,res){
	res.render("login.ejs",{Failure:req.flash("error")[0]})
})

app.get("/signup",isLoggedOut,function(req,res){
	res.render("register.ejs",{Failure:req.flash("error")[0]})
})

app.get("/logout",isLoggedIn,function(req,res){
	req.logout()
	req.flash("success","Logged You out.")
	res.redirect("/petshop")
})

app.post("/signup",isLoggedOut,function(req,res){
	User.register(new User({username:req.body.username}),req.body.password,function(err,user){
		if(err)
		{
			console.log(err)
			res.redirect("/signup")
		}
		else{
			passport.authenticate("local")(req,res,function(){
				req.flash("success","Registered successfully")
				res.redirect("/petshop")
			})
		}
	})
})

app.post("/login",isLoggedOut,passport.authenticate("local",{
	successRedirect:"/petshop",
	failureRedirect:"/login",
	failureFlash:"Cannot login you",
	successFlash:"Successfully Logged you in"
}),function(req,res){
})

function isLoggedIn(req,res,next){
	if(req.user){
		next()
	}
	else{
		req.flash("error","Login Required.")
		res.redirect("/login")
	}
}

function isLoggedOut(req,res,next){
	if(!req.user){
		next()
	}
	else{
		req.flash(failure,"Logout Required.")
		res.redirect("/petshop")
	}
}

server = app.listen(process.env.PORT,process.env.IP,function(){
	console.log("Server is Running ...")
	console.log(server.address().port+" "+server.address().address)
})