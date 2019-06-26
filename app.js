const express = require('express');
const app = express();
const body_parser = require('body-parser');
const Quiz = require('./models/quiz');
const Answer = require('./models/answer');
const path=require('path');


//mongoose connection
const mongoose = require('mongoose');
mongoose.connect("mongodb+srv://admin:admin@cluster0-awadb.mongodb.net/quiz?retryWrites=true",{ useNewUrlParser: true })
    .then(() => {
        console.log("connected");
    })
    .catch(() => {
        console.log("error");
    });


//nodemailer configuration
const nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'noreply.avinashvidyarthi@gmail.com',
        pass: 'rupakumari'
    }
});

//bodyparser configuration
app.use(body_parser.json());
//app.use(body_parser.urlencoded());


//header configuration
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Origin,X-Requested-With,Accept")
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    next();
});

app.use("/",express.static(path.join(__dirname,"quiz")));

//to send the otp and return it
app.post('/api/send_otp', (req, res, next) => {
    const email = req.body.email;
    const name = req.body.name;
    otp = Math.floor(Math.random() * (9999 - 1000)) + 1000;
    var mailOptions = {
        from: 'avinashvidyarthi',
        to: email,
        subject: 'OTP Verification',
        html: "Dear <b>" + name + "</b>" + ",<br>Your OTP is: " + otp
    };
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            res.status(200).json({
                msg: 'otp_not_sent'
            });
        } else {
            res.status(200).json({
                msg: 'otp_sent',
                otp: otp
            });
        }
    });
});


//to create the quiz
app.post('/api/create_quiz', (req, res, next) => {
    const quiz = new Quiz(req.body);
    quiz.save().then((result) => {
        res.status(200).json({
            msg: 'quiz_created'
        })
    });
})

//to fetch all quiz id and title
app.get('/api/get_quiz', (req, res, next) => {
    var quizzes = new Array();
    Quiz.find().then(result => {
        result.forEach(function (item) {
            var data = {
                id: item._id,
                title: item.title,
                author: item.author.name
            }
            quizzes.push(data);
        });
        res.status(200).json({
            msg: 'quiz_fetched',
            quiz: quizzes
        });
    });
});

//to fetch one quiz to take test without answer
app.get('/api/get_one_quiz/:quiz_id', (req, res, next) => {
    Quiz.findById({ _id: req.params.quiz_id }).then((result) => {
        new_ques_arr = new Array();
        result.ques_arr.forEach(function (ques) {
            new_ques = {
                id: ques._id,
                ques: ques.ques,
                opt_a: ques.opt_a,
                opt_b: ques.opt_b,
                opt_c: ques.opt_c,
                opt_d: ques.opt_d
            }
            new_ques_arr.push(new_ques);
        });
        result.ques_arr = new_ques_arr;
        res.status(200).json({
            quiz: result
        });
    });
});


//to evaluate the answers and send back the result abd saving the answers on the database
app.post('/api/evaluate', (req, res, next) => {
    var correct = 0;
    var incorrect = 0;
    var unattempt = 0;
    Quiz.findById({ _id: req.body.quiz_id }).then((result) => {
        for (var i = 0; i < result.ques_arr.length; i++) {
            if (req.body.ans_arr[i].ans === "") {
                unattempt++;
            } else {
                if (result.ques_arr[i].ans === req.body.ans_arr[i].ans) {
                    correct++;
                } else {
                    incorrect++;
                }
            }
        }
        var ans = new Answer({
            quiz_id:req.body.quiz_id,
            stud:{
                name:req.body.stud.name,
                email:req.body.stud.email
            },
            ans_arr:req.body.ans_arr
        });
        ans.save().then(() => {
            var mailOptions = {
                from: 'avinashvidyarthi',
                to: req.body.stud.email,
                subject: 'Result',
                html: "Dear <b>" + req.body.stud.name + "</b>" + "<br> Your results are: <br>Correct: "+correct+"<br>Incorrect: "+incorrect+"<br>Unattempted: "+unattempt
            };
            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    res.status(200).json({
                        msg: 'otp_not_sent'
                    });
                } else {
                    res.status(200).json({
                        msg: 'otp_sent',
                        otp: otp
                    });
                }
            });
            res.status(200).json({
                msg: "success",
                total: result.ques_arr.length,
                correct: correct,
                incorrect: incorrect,
                unattempt: unattempt
            });
        });
    });
});

//for searching the quiz
app.post('/api/search_quiz',(req,res,next)=>{
    const keyword=req.body.keyword;
    var matched_quiz=new Array();
    Quiz.find().or([
        {'author.name':{'$regex':keyword,'$options':'i'}},
        {'title':{'$regex':keyword,'$options':'i'}}
    ]).then(result=>{
        result.forEach(function(item){
            var data={
                id: item._id,
                title: item.title,
                author: item.author.name
            }
            matched_quiz.push(data);
        });
        res.status(200).json(matched_quiz);
    })
});

//fro getting the results
app.get('/api/get_result/:quiz_id',(req,res,next)=>{
    const quiz_id=req.params.quiz_id;
    final_arr=new Array();
    Answer.find({quiz_id:quiz_id}).then(ans_data=>{
        Quiz.find({_id:quiz_id}).then(quiz_data=>{
            const ques_arr=quiz_data[0].ques_arr;

            ans_data.forEach(one_ans=>{
                var correct=0;
                var incorrect=0;
                var unattempt=0;

                for(var i=0;i<ques_arr.length;i++){
                    if(one_ans.ans_arr[i].ans===""){
                        unattempt++;
                    }else{
                        if(one_ans.ans_arr[i].ans==ques_arr[i].ans){
                            correct++;
                        }else{
                            incorrect++;
                        }
                    }
                }
                var result={
                    name:one_ans.stud.name,
                    email:one_ans.stud.email,
                    correct:correct,
                    incorrect:incorrect,
                    unattempt:unattempt
                }
                final_arr.push(result);
            });


            return res.status(200).json({
                quiz_name:quiz_data[0].title,
                no_of_ques:quiz_data[0].ques_arr.length,
                author:quiz_data[0].author.name,
                attempts:ans_data.length,
                each_result:final_arr
            });
            // return res.status(200).json(quiz_data);
        });
    });
});

app.use((req,res,next)=>{
    res.sendFile(path.join(__dirname,"quiz","index.html"));
});

module.exports = app;