const puppeteer = require('puppeteer');

const NUMBER_OF_SEATS = '3';
const MOVIE_PAGE = 'avengers-endgame-2019-215871';
const ZIP_CODE = '78613';
const DATE = '?date=2019-04-27';
//const DATE = '';
const THEATER_PAGE = '&pn=2';
// const THEATER_PAGE = '';

(async () => {
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
        await page.setRequestInterception(true);
        page.on('request', interceptedRequest => {
            if (interceptedRequest.url().endsWith('.gif')
            || interceptedRequest.url().endsWith('.jpg')) {
                interceptedRequest.abort();
            } else {
                interceptedRequest.continue();
            }        
        });
        await page.goto(`https://www.fandango.com/${MOVIE_PAGE}/movie-times${DATE}${THEATER_PAGE}`);

        const result = await page.evaluate(() => {
            // Loop through each theater on page
            const theaters = document.querySelectorAll('.theater__wrap');
            const theaterCount = theaters.length;
            let theaterArray = [];
            for (let i = 0; i < theaterCount; i++) {
                const theaterName = theaters[i].querySelector('.theater__name a.color-light').innerHTML;

                // Check for available times for the theater
                const availableTimeButtons =  theaters[i].querySelectorAll('.showtime-btn--available');                 
                const availableTimes = [];
                for (let j = 0; j < availableTimeButtons.length; j++) {
                    availableTimes.push({
                        time: availableTimeButtons[j].innerText,
                        timeLink: availableTimeButtons[j].getAttribute('href')
                    });
                }

                theaterArray.push({
                    theaterName,
                    availableTimes
                });
            }

            // Loop through available times
            // Print available times
            return { theaterCount, theaterArray }
        });
        //console.log('Theater Count on page: ', result.theaterCount);

        // Loop through theater results
        let theaterArray = result.theaterArray;
        for (let i = 0; i < theaterArray.length; i++) {
            let theater = result.theaterArray[i];
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
                    await page.waitForSelector('input#NextButton', { timeout: 1000});

                    const ids = await page.evaluate(() => {
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
                        seatIds = seatIds.filter(seatId => {
                            return !seatId.startsWith('A') &&
                            !seatId.startsWith('B') &&
                            !seatId.startsWith('1') &&
                            !seatId.startsWith('2');
                        });
                        return {seatIds};
                    });
                    if (ids.seatIds.length >= parseInt(NUMBER_OF_SEATS)) {
                        console.log('Movie Time: ', time.time);
                        console.log('Seat Ids: ', ids.seatIds);
                    }
                    
                } catch (e) {                    
                    //console.log('Most likely seats do not exist.');
                }
      
            }
        }
        await browser.close();
    } catch (err) {
        console.log(err);
        await browser.close();
    }
})();
