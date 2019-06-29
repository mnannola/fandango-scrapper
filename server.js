const express = require('express');
const scraper = require('./utils/scraper');

const app = express();

app.set('view engine', 'pug');

app.get('/', (req, res, next) => {
    try {
        const seats = new Promise((resolve, reject) => {
            scraper.fetchSeats().then(data => {
                resolve(data);
            })
            .catch(err => reject('Scraping Failed'));
        });
        seats.then(data => res.render('index', {data: {movies: data}}))
    } catch (e) {
        next(e);
    }
});

app.listen(process.env.PORT || 3000);