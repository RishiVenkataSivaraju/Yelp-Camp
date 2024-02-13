const mongoose = require('mongoose');
const cities = require('./cities');
const { places, descriptors } = require('./seedHelpers');
const Campground = require('../module/campground');

mongoose.connect('mongodb://127.0.0.1:27017/yelp1db')
.then(data =>{
    console.log('CONNECTION OPEN')
})
.catch(err =>{
    console.log(err)
})

const db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

const sample = array => array[Math.floor(Math.random() * array.length)];


const seedDB = async () => {
    await Campground.deleteMany({});
    for (let i = 0; i < 300; i++) {
        const random1000 = Math.floor(Math.random() * 1000);
        const price=Math.floor(Math.random()*20)+10;
        const camp = new Campground({
            author:"64b017478c1dff930883d3ad",
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            title: `${sample(descriptors)} ${sample(places)}`,
            price,
            geometry: {
                type: "Point",
                coordinates: [
                        cities[random1000].longitude,
                        cities[random1000].latitude
                            ]},
            images: [
              {
                url: 'https://res.cloudinary.com/drpgvnojt/image/upload/v1689815361/YelpCamp/zbjh3vfrisqtvowhv0cz.png',
                filename: 'YelpCamp/zbjh3vfrisqtvowhv0cz'
              },
              {
                url: 'https://res.cloudinary.com/drpgvnojt/image/upload/v1689815365/YelpCamp/hlz3untscggzlqfdmtac.png',
                filename: 'YelpCamp/hlz3untscggzlqfdmtac'
              }
            ],
            description:"Lorem ipsum dolor sit amet consectetur adipisicing elit. Possimus quas ut doloremque eum, rerum accusamus error quae neque quam tempora aspernatur esse, reprehenderit ullam saepe alias dignissimos iusto repudiandae qui."
        })
        await camp.save();
    }
}

seedDB().then(() => {
    mongoose.connection.close();
})