if(process.env.NODE_ENV !== "production"){
require("dotenv").config();
}

const db_url = process.env.DB_URL;

// console.log(process.env.MAPBOX_TOKEN)
const { cloudinary } = require("./cloudinary/indexx");
const express = require('express');
const app = express();
const session= require("express-session")
const flash=require("connect-flash")
const path = require('path');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const ejsMate=require("ejs-mate");
const wrapAsync=require("./utils/wrapAsync");
const expressError= require("./utils/expressError");
const Campground = require('./module/campground');
const Review= require("./module/review")
const { wrap } = require('module');
const {camproundSchema,reviewSchema}= require("./schemas.js");
const review = require('./module/review');
// const userRoutes= require("./routes/users")
const {isLoggedIn}= require("./middleware")
const {storeReturnTo} = require("./middleware")

const multer  = require('multer')
const {storage}=require("./cloudinary/indexx")
const upload = multer({ storage })
const MongoStore= require('connect-mongo')
mongoose.connect('mongodb://127.0.0.1:27017/yelp1db')
.then(data =>{
    console.log('CONNECTION OPEN')
})
.catch(err =>{
    console.log(err)
})
const passport=require("passport")
const localStrategy=require("passport-local")
const User=require("./module/user")


const mbxGeocoding= require("@mapbox/mapbox-sdk/services/geocoding");
const mapbox= process.env.MAPBOX_TOKEN;
const geocoder=mbxGeocoding({accessToken:mapbox})

const mongoSanitize= require("express-mongo-sanitize");
app.use(mongoSanitize());
const store = MongoStore.create({
    mongoUrl: 'mongodb://127.0.0.1:27017/yelp1db',
    touchAfter: 24 * 60 * 60,
    crypto: {
        secret: 'thisshouldbeabettersecret!'
    }
});

const sesseionConfig={
store,
    secret:"thisisasecret",
    resave:false,
    saveUninitialized:true,
    cookie:{
        httpOnly:true,
        expires:Date.now()+60*60*1000*24*7,
        maxAge:60*60*1000*24*7
    }
}

// app.use("/",userRoutes)

app.use(session(sesseionConfig))
app.use(flash())
app.use(passport.initialize())
app.use(passport.session())
passport.use(new localStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())
app.use((req, res, next) => {
    // console.log(req.session)
    res.locals.currentUser = req.user;
    // res.locals.success = req.flash('success');
    // res.locals.error = req.flash('error');
    next();
})



app.engine("ejs",ejsMate)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))
app.use(express.static(path.join(__dirname,'/module')))
app.use(express.static(path.join(__dirname,'/views')))
app.use(express.static(path.join(__dirname,'/module/styles')))
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

const validateCampground = (req,res,next) =>{
    
    const {error}= camproundSchema.validate(req.body)
    if(error){
        const msg= error.details.map( el => el.message).join(',')
        throw new expressError(msg,400)
    }
    else{
        next()
    }
}

// const validateReview = (req,res,next) =>{
    
//     const {error}= reviewSchema.validate(req.body)
//     if(error){
//         const msg= error.details.map( el => el.message).join(',')
//         throw new expressError(msg,400)
//     }
//     else{
//         next()
//     }
// }





app.get('/', (req, res) => {
    res.render('home')
});
app.post("/login",storeReturnTo,  passport.authenticate('local',{failureFlash:true,failureRedirect:"/login"}), (req,res) =>{
    req.flash("success",'welcome Back');
    const redirectUrl = res.locals.returnTo || '/campgrounds';
        res.redirect(redirectUrl);
})
app.post("/registered",wrapAsync(async(req,res,next) =>{
    const {email, username,password}= req.body
    const user = new User({email, username})
    const registerUser= await User. register(user,password)
    console.log(registerUser)
    req.login(registerUser,err =>{
        if (err) return next(err)
        req.flash("success","YOU HAVE BEEN LOGED IN")
    res.redirect("/campgrounds")
    })
    // req.flash("success","yay you have been loged in");
    
}))
app.get('/campgrounds',wrapAsync( async (req, res) => {
    const campground = await Campground.find({});
    res.render('./campgrounds/index', { campground,msg:req.flash('success')})
}));

app.get('/campgrounds/new', isLoggedIn,(req, res) => {
    res.render('./campgrounds/new');
})
app.post('/campgrounds',upload.array("campground[image]"), wrapAsync( async (req, res,next) => {
    // if(!req.body.campground) throw new expressError("Invalid Campground Data",400)
    const campground = new Campground(req.body.campground);
    const geodata = await geocoder.forwardGeocode({
        query:req.body.campground.location,
        limit:1
    }).send()
campground.geometry.coordinates=geodata.body.features[0].geometry.coordinates;
console.log(geodata.body.features[0].type)
campground.geometry.type= geodata.body.features[0].type
    campground.images=req.files.map(f =>({url:f.path,filename:f.filename}));
    campground.author=req.user._id;
// console.log(geodata.body.features[0].geometry.coordinates)
    
    // console.log(req.body.campground)
    await campground.save();
    console.log(campground)
    req.flash("success","successfully made a new campground")
    res.redirect(`/campgrounds/${campground._id}`)
    // console.log(req.files)
    // res.send("it worked")
  
}))

app.get('/campgrounds/:id',wrapAsync( async (req, res,) => {
    const campground = await Campground.findById(req.params.id).populate({
        path:'review',
        populate:{
            path:'author'
        }
    }).populate('author');
    console.log(campground)
    res.render('./campgrounds/show ', { campground ,msg:req.flash('success'),msg:req.flash("error")});
}));

app.get('/campgrounds/:id/edit',isLoggedIn,wrapAsync( async (req, res) => {
    const {id} =req.params
    const campground= await Campground.findById(id)
    if(!campground.author.equals(req.user._id))
    {
     req.flash("error","You do not have permission to do that");
     res.redirect(`/campgounds/${id}`);
    }
     await Campground.findById(id)
    res.render('./campgrounds/edit', { campground });
}))

app.put('/campgrounds/:id', upload.array("campground[image]"), wrapAsync( async (req, res) => {
    const { id } = req.params;
    const campground= await Campground.findById(id)
    if(!campground.author.equals(req.user._id))
    {
     req.flash("error","You do not have permission to do that");
     res.redirect(`/campgounds/${id}`);
    }
    await Campground.findByIdAndUpdate(id, { ...req.body.campground });
    const imgs= req.files.map(f =>({url:f.path,filename:f.filename}));
    campground.images.push(...imgs);
    await campground.save()
    if (req.body.deleteImages) {
        for (let filename of req.body.deleteImages) {
            await cloudinary.uploader.destroy(filename);
        }
        await campground.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } })
    }
    res.redirect(`/campgrounds/${id}`)
}));

app.delete('/campgrounds/:id', wrapAsync( async (req, res) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id);
    res.redirect('/campgrounds');
}))

app.post("/campgrounds/:id/reviews",  wrapAsync(async(req,res) =>{
    const campground =  await Campground.findById(req.params.id) ;
    const review= new Review(req.body.review);
    campground.review.push(review);
    await review.save();
    await campground.save();
    res.redirect(`/campgrounds/${campground._id}`)
}))

app.delete('/campgrounds/:id/reviews/:reviewId', wrapAsync(async (req, res) => {
    const { id, reviewId } = req.params;
    await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    res.redirect(`/campgrounds/${id}`);
}))

app.get("/register",(req,res) =>{
    res.render("users/register");
})

app.get("/login",(req,res) =>{
    res.render("users/login",{msg:req.flash("warning")})
})

app.get("/logout",(req,res,next) =>{
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        req.flash('success', 'Goodbye!');
        res.redirect('/campgrounds');
    })
})
// router.get('/logout', (req, res, next) => {
//     req.logout(function (err) {
//         if (err) {
//             return next(err);
//         }
//         req.flash('success', 'Goodbye!');
//         res.redirect('/campgrounds');
//     });
// }); 
app.all("*",(req,res,next) =>{
    next(new expressError("something went wrong",404))
})

app.use((err,req,res,next) =>{
    const{message='Something went wrong',statuscode=500}=err
    res.status(statuscode).render('error',{err})
    // res.send("Oh BoY SOMETHING WENT WRONG")
})

app.listen(8080, () => {
    console.log('Serving on port 3000')
})
