const mongoose=require('mongoose');

const ansSchema=mongoose.Schema({
    quiz_id:String,
    stud:{
        name:String,
        email:String
    },
    ans_arr:[{
        ans:String
    }]
});

module.exports=mongoose.model("Answer",ansSchema);