import dotenv from 'dotenv';
import connectDB from './db/index.js';
import { app } from './app.js';

dotenv.config({
    path: './env'
});

const port = process.env.PORT || 8000;

connectDB()
.then((response) => {
    app.listen(port, () => {
        console.log('Server is running on port: ', port);
    })

    app.on('error', (error) => {
        console.log('Error', error);
        throw(error);
    })
})
.catch((err) => {
    console.log('Error connecting the database', err);
});