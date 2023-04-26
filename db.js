const mongoose = require('mongoose');
// const mongoURI = "mongodb+srv://ranar4722:ranar4722waala@cluster0.jtj8bq4.mongodb.net/cloudnotesDB?retryWrites=true&w=majority";
//mongodb://localhost:27017/cloudnotes
const mongoURI = process.env.DATABASE_URL;

const connectToMongo = () => {
    mongoose.connect(mongoURI);
    const db = mongoose.connection;

    //on error
    db.on('error', console.error.bind(console, 'error connecting to DB'));

    //else print success messsage
    db.once('open', function () {
        console.log('Successfully connected to the db!');
    });
}

module.exports = connectToMongo;