var mongoose=require("mongoose");

var PetSchema = mongoose.Schema({
	name:String,
	animal:String,
	breed:String,
	photo:String,
	details:String
});

module.exports = mongoose.model("Pet",PetSchema);