const puppeteer = require('puppeteer');

const NUMBER_OF_SEATS = '1';
const MOVIE_PAGE = 'toy-story-4-185803';
const ZIP_CODE = '78613';
const DATE = '?date=2019-06-29';
//const DATE = '';
//const THEATER_PAGE = '&pn=2';
 const THEATER_PAGE = '';

const fetchSeats = async () => {
    const browser = await puppeteer.launch({headless: false});
    try {        
        const page = await browser.newPage();
        // Set zip code before navigating to fandango.com
        await page.setCookie({
            name: 'zip', 
            value: ZIP_CODE,
            domain: '.fandango.com',
            path: '/'
        });

        await page.goto(`https://www.fandango.com/${MOVIE_PAGE}/movie-times${DATE}${THEATER_PAGE}`);

        const listOfTheaters = await page.evaluate(() => {
            // Loop through each theater on page
            const theaters = document.querySelectorAll('.theater__wrap');
            let theaterArray = [];
            for (let i = 0; i < theaters.length; i++) {
                const theaterName = theaters[i].querySelector('.theater__name a.color-light').innerHTML;

                // Check for available times for the theater
                const availableTimeButtons =  theaters[i].querySelectorAll('.showtime-btn--available');                 
                const availableTimes = [];
                for (let j = 0; j < availableTimeButtons.length; j++) {
                    availableTimes.push({
                        time: availableTimeButtons[j].innerText,
                        timeLink: availableTimeButtons[j].getAttribute('href'),
                        seats: []
                    });
                }

                theaterArray.push({
                    theaterName,
                    availableTimes
                });
            }

            // Loop through available times
            // Print available times
            return theaterArray;
        });
        // Loop through theater results
        
        /* for (let i = 0; i < listOfTheaters.length; i++) { */ 
        for (let i = 0; i < 1; i++) {
            let theater = listOfTheaters[i];
            console.log('Theater: ', theater.theaterName);            

            // Loop through available time results for theater
            for (let j = 0; j < theater.availableTimes.length; j++) {
                let time = theater.availableTimes[j];
                // TODO: Filter out time if it's too late

                await page.goto(time.timeLink);
                /* await page.waitFor(1000); */

                // Pick adult seats and click submit  //TODO: Pass this value in
                page.select('tbody:nth-child(1) select', NUMBER_OF_SEATS);
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
                    if (seats.length >= parseInt(NUMBER_OF_SEATS)) {
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

module.exports.fetchSeats = fetchSeats;