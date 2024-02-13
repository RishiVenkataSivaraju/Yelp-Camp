const express= require('express');
// const app= express()
const Router = express.Router();
const User= require("../module/user")

Router.get("/register",(req,res)=>{
    res.render("users/register")
});

Router.post("/registered",(req,res) =>{
    res.send(req.body)
})
module.exports=Router