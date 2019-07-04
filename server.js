const express = require('express');
const scraper = require('./utils/scraper');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.set('view engine', 'pug');

app.get('/results', async (req, res, next) => {
    try {
        const seats = await scraper.fetchSeats();
        res.render('results', {data: {movies: seats}})
    } catch (e) {
        next(e);
    }
});

app.get('/search', async(req, res, next) => {
    try {
        const movieList = await scraper.fetchMovieList();
/*         const movieList = [{
            title: 'Anna',
            link:'http://www.fandango.com'
        }] */
        res.render('search', { data: { movieList: movieList } });
    } catch (e) {
        next(e);
    }
});

app.post('/results', async (req, res, next) => {
    try {
        const { body } = req;
/*         const seats = await scraper.fetchSeats(
            body.movie, 
            body.numOfSeats,
            body.date
        ); */
        const theaters = await scraper.fetchTheaters(body.movie, body.date);
        const seats = await scraper.fetchSeats(theaters, body.numOfSeats);
        res.render('results', {data: {movies: seats}});
    } catch (e) {
        next(e);
    }
});

app.listen(process.env.PORT || 3000);