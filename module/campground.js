const mongoose = require('mongoose');
const Review = require('./review')
const User=require("./user")
const Schema = mongoose.Schema;
// ImageSchema.virtual('thumbnail').get(function () {
//     return this.url.replace('/upload', '/upload/w_200');
// });
const opts = { toJSON: { virtuals: true } };
const CampgroundSchema = new Schema({
    title: String,
    price: Number,
    description: String,
    geometry: {
        type: {
            type: String,
            // enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    images:[{
        url:String,
        filename:String,
    }],
    location: String,
    author:{
          type:Schema.Types.ObjectId,
          ref:'User'
    },
    review:[{
        type:Schema.Types.ObjectId,
        ref:'Review'
    }]
},opts);
CampgroundSchema.virtual('properties.popUpMarkup').get(function () {
    return `
    <strong><a href="/campgrounds/${this._id}">${this.title}</a><strong>
    <p>${this.location}...</p>`
});

CampgroundSchema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        await Review.deleteMany({
            _id: {
                $in: doc.reviews
            }
        })
    }
})
const Campground= mongoose.model('Campground', CampgroundSchema);
module.exports =Campground