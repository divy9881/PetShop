var mongoose=require("mongoose")
var User = require("./User.js")
var Comment = require("./Comment.js")

var PetSchema = mongoose.Schema({
	name:String,
	animal:String,
	breed:String,
	photo:String,
	details:String,
	author:{
		type : mongoose.Schema.Types.ObjectId,
		ref : "User"
	},
	comments:[{
		type:mongoose.Schema.Types.ObjectId,
		ref:"Comment"
	}]
});

module.exports = mongoose.model("Pet",PetSchema);