const mongoose=require('mongoose');

const quiz_schema=mongoose.Schema({
    title:String,
    author:{
        name:String,
        email:String
    },
    ques_arr:[{
        ques:String,
        opt_a:String,
        opt_b:String,
        opt_c:String,
        opt_d:String,
        ans:String
    }]
});

module.exports=mongoose.model('Quiz',quiz_schema);