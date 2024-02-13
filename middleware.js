module.exports.isLoggedIn = (req, res, next) => {
    console.log(req.path, req.originalUrl);
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl;
        req.flash("warning", "Sorry You Have To be logged in");
        return res.redirect('/login',)
    }
    else {
        next();
    }
}
module.exports.storeReturnTo = (req, res, next) => {
    if (req.session.returnTo) {
        res.locals.returnTo = req.session.returnTo;
    }
    next();
}