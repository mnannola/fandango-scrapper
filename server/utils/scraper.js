const puppeteer = require('puppeteer');

const ZIP_CODE = '78613';

const ZIPCODE_COOKIE =  {
        name: 'zip',
        value: ZIP_CODE,
        domain: '.fandango.com',
        path: '/'
};

const fetchTheaters = async(movieLink, date) => {
    const browser = await puppeteer.launch({headless: true});
    try {
        const page = await browser.newPage();
        // Set zip code before navigating to fandango.com
        await page.setCookie(ZIPCODE_COOKIE);
        
        await page.goto(movieLink);
        await page.goto(page.url().replace('movie-overview', `movie-times?date=${date}`));

        const listOfTheaters = await page.evaluate(() => {
            // Loop through theaters and find avail times for the movie
            return Array.from(document.querySelectorAll('.theater__wrap'))
            .map( theater => ({
                theaterName: theater.querySelector('.theater__name a.color-light').innerHTML,
                availableTimes: Array.from(theater.querySelectorAll('.showtime-btn--available'))
                    .map(time => ({
                        time: time.innerText,
                        timeLink: time.getAttribute('href'),
                        seats: []
                    }))
            }));
        });
        await browser.close();
        return listOfTheaters;
    } catch (err) {
        console.log(err);
        await browser.close();   
    }
}

const fetchSeats = async (listOfTheaters, numOfSeats) => {
    const browser = await puppeteer.launch({headless: true});
    try {        
        const page = await browser.newPage();
        // Set zip code before navigating to fandango.com
        await page.setCookie(ZIPCODE_COOKIE);
        
        /* for (let i = 0; i < listOfTheaters.length; i++) { */ 
        for (let i = 0; i < 1; i++) {
            let theater = listOfTheaters[i];
            console.log('Theater: ', theater.theaterName);            

            // Loop through available time results for theater
            for (let j = 0; j < theater.availableTimes.length; j++) {
                let time = theater.availableTimes[j];
                // TODO: Filter out time if it's too late

                await page.goto(time.timeLink);

                // Pick adult seats and click submit
                page.select('tbody:nth-child(1) select', numOfSeats);
                try {
                    await page.click('button#NewCustomerCheckoutButton');
                    await page.waitForSelector('div.standard.availableSeat', { timeout: 1000});
                    //await page.waitForNavigation({ waitUntil: 'networkidle0'});

                    let seats = await page.evaluate(() => {
                        // Get only available, non-handicap seats
                        let availableSeats = document.querySelectorAll('div.standard.availableSeat');

                        // Get ID's of rows
                        let seatIds = [];
                        availableSeats.forEach(seat => {
                            let id = seat.getAttribute('id');
                            seatIds.push(id);
                        });
                        
                        // Two styles of seat ID's. 
                        // Either 101 (first seat in first row)
                        // Or A1 (first seat in first row)
                        // Need to remove either all 1-- and 2--
                        // or A-- and B--
                        debugger;
                        seatIds = seatIds.filter(seatId => {
                            return !seatId.startsWith('A') &&
                            !seatId.startsWith('B') &&
                            !seatId.startsWith('1') &&
                            !seatId.startsWith('2');
                        });
                        debugger;
                        return seatIds;
                    });
                    if (seats.length >= parseInt(numOfSeats)) {
                        listOfTheaters[i].availableTimes[j].seats = seats;
                        console.log('Movie Time: ', time.time);
                        console.log('Seat Ids: ', seats);
                    }
                    
                } catch (e) {                    
                    //console.log('Most likely seats do not exist.');
                }
      
            }
        }        
        await browser.close();
        return listOfTheaters;
    } catch (err) {
        console.log(err);
        await browser.close();
    }
};

const fetchMovieList = async () => {
    const browser = await puppeteer.launch({headless: true});
    try {        
        const page = await browser.newPage();

        await page.setCookie(ZIPCODE_COOKIE);
        await page.goto(`https://www.fandango.com/moviesintheaters`);
        
        const movieList = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('.movie-list .visual-item'))
            .map( movie => ({
                title: movie.querySelector('.visual-title').textContent.trim(),
                link: movie.querySelector('.visual-title').getAttribute('href')
            }))
            .slice(0,20)
            .sort((a,b) => a.title.localeCompare(b.title)); // Sort by title asc
            
        });
        await browser.close();
        return movieList;

    } catch (err) {
        console.log(err);
        await browser.close();
    }
};

module.exports = {
    fetchTheaters,
    fetchSeats,
    fetchMovieList
};


