var express = require("express")
var bodyParser = require("body-parser")
var expressSanitizer = require("express-sanitizer")
var mongoose = require("mongoose")
var methodOverride = require("method-override")
var Pet = require("./Pet.js")

var app = express()

app.set("views","./ejs")

app.use(bodyParser.urlencoded({extended:true}))
app.use(expressSanitizer())
app.use(methodOverride("_method"))

app.use(express.static("./css"))
app.use(express.static("./js"))

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

app.get("/petshop/new",function(req,res){
	res.render("newPets.ejs")
})

app.post("/petshop/new",function(req,res){
	sanitize = req.sanitize
	Pet.create({
		name:sanitize(req.body.name),
		animal:sanitize(req.body.animal),
		breed:sanitize(req.body.breed),
		photo:sanitize(req.body.photo),
		details:sanitize(req.body.details)
	},function(err,Pet){
		if(err)
		{
			console.log(err)
		}
		else{
			res.redirect("/petshop")
		}
	})
})

app.get("/petshop/know/:id",function(req,res){
	Pet.findById(req.params.id,function(err,Pet){
		if(err){
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
		details:sanitize(req.body.details)
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
			res.redirect()
		}
	})
})
server = app.listen(process.env.PORT,process.env.IP,function(){
	console.log("Server is Running ...")
	console.log(server.address().port+" "+server.address().address)
})