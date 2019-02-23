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
	res.render("home.ejs")
})

app.get("/petshop",function(req,res){
	Pet.find({},function(err,Pets){
		if(err){
			conole.log(err)
		}
		else{
			res.render("petshop.ejs",{Pets:Pets})
		}
	})
})

app.get("/petshop/new",isLoggedIn,function(req,res){
	res.render("newPets.ejs")
})

app.post("/petshop/new",function(req,res){
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
			console.log(Pet)
			res.redirect("/petshop")
		}
	})
})

app.get("/petshop/know/:id",function(req,res){
	Pet.findById(req.params.id,function(err,Pet){
		if(err)
		{
			console.log(err)
		}
		else{
			res.render("knowMore.ejs",{Pet:Pet})
		}
	})
})

app.get("/petshop/edit/:id",function(req,res){
	Pet.findById(req.params.id,function(err,pet){
		if(err)
		{
			console.log(err)
		}
		else{
			res.render("editPet.ejs",{Pet:pet})
		}
	})
})

app.put("/petshop/edit/:id",function(req,res){
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

app.delete("/petshop/delete/:id",function(req,res){
	Pet.findByIdAndRemove(req.params.id,function(err,Pet){
		if(err){
			console.log(err)
		}
		else{
			res.redirect("/petshop")
		}
	})
})

app.get("/login",function(req,res){
	res.render("login.ejs")
})

app.get("/signup",function(req,res){
	res.render("register.ejs")
})

app.get("/logout",function(req,res){
	req.logout()
	res.redirect("/petshop")
})

app.post("/signup",function(req,res){
	User.register(new User({username:req.body.username}),req.body.password,function(err,user){
		if(err)
		{
			console.log(err)
			res.redirect("/signup")
		}
		else{
			passport.authenticate("local")(req,res,function(){
				res.redirect("/petshop")
			})
		}
	})
})

app.post("/login",passport.authenticate("local",{
	successRedirect:"/petshop",
	failureRedirect:"/login"
}),function(req,res){
})

function isLoggedIn(req,res,next){
	if(req.user){
		next()
	}
	else{
		res.redirect("/login")
	}
}

server = app.listen(process.env.PORT,process.env.IP,function(){
	console.log("Server is Running ...")
	console.log(server.address().port+" "+server.address().address)
})