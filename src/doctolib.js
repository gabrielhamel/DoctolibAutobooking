const puppeteer = require('puppeteer-extra');
const parser = require('./parser');
const h = require("htmlparser2");

const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function autoScroll(page){
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            var totalHeight = 0;
            var distance = 100;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;
                if(totalHeight >= scrollHeight){
                    clearInterval(timer);
                    resolve();
                }
            }, 50);
        });
    });
}

async function scrollToTop(page) {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            window.scroll({
                top: 0
            });
            resolve();
        })
    })
}

class Doctolib {
    constructor () {
        this.launchPromise = puppeteer.launch({
            headless: true
        });
        this.browser = null;
        this.page = null;
    }

    async checkBrowser() {
        if (this.browser === null) {
            this.browser = await this.launchPromise;
        }
    }

    async login(user, password) {
        await this.checkBrowser();
        this.page = await this.browser.newPage();
        await this.page.goto('https://www.doctolib.fr/sessions/new');

        // Accept cookie
        await this.page.waitForSelector('#didomi-notice-agree-button');
        await this.page.click('#didomi-notice-agree-button');

        await this.page.type('#username', user);
        await this.page.type('#password:not(.dc-text-input-disabled)', password);
        await this.page.click('.Tappable-inactive.dl-button-DEPRECATED_yellow.dl-toggleable-form-button.dl-button.dl-button-block.dl-button-size-normal');
        await this.page.waitForSelector('body > div.js-navbar > nav > div > div:nth-child(2) > a.dl-desktop-navbar-link.dl-desktop-navbar-link-active');
    }

    async searchByCity(city) {
        await this.page.goto('https://www.doctolib.fr');
        await this.page.type('#autocomplete-default', 'Vaccination COVID-19');
        await this.page.waitForSelector('button[id="5494-Vaccination COVID-19"]');
        await this.page.click('button[id="5494-Vaccination COVID-19"]');
        await this.page.type('#autocomplete-default[placeholder="Où ?"]', city);
        await this.page.waitForSelector('#search-place-input-results-container');

        // Select city
        const rowSearch = await this.page.$eval('#search-place-input-results-container', results => results.outerHTML);
        const cityId = parser.parseForCities(rowSearch);
        await this.page.click(`#${cityId}`);

        // Launch search
        await this.page.click('.Tappable-inactive.dl-button-DEPRECATED_yellow.searchbar-submit-button.dl-button.dl-button-size-normal');

        // Select priority
        await this.page.waitForSelector('label[for="eligibility-3"]');
        await this.page.click('label[for="eligibility-3"]');
        await this.page.click('.Tappable-inactive.dl-button-primary.dl-button.dl-button-size-normal');

        await this.page.waitForTimeout(2000);
    }

    async getAvailableSlots() {
        try {
            await this.page.goto(this.page.url());
            await scrollToTop(this.page);

            // Scroll until end (can be better with an auto scroller and wait for selector)
            await autoScroll(this.page);
            await this.page.waitForFunction(() => !document.querySelector('div.dl-loader'));

            const rawResults = await this.page.$eval('div.search-results-col-list', results => results.outerHTML);
            return parser.parseForSlots(rawResults);
        } catch (e) {
            console.log(e);
            return [];
        }
    }

    async parseAndBookCalendar(page) {
        try {
            await page.waitForSelector('.Tappable-inactive.availabilities-slot', {
                timeout: 100
            });
            const rawHtml = await page.$eval('div.dl-desktop-availabilities-days', result => result.outerHTML);
            await page.waitForSelector('.Tappable-inactive.dl-button-info-link.dl-button.dl-button-block.dl-button-size-normal > span', {
                timeout: 100
            });
            const calendar = parser.parseCalendar(h.parseDocument(rawHtml).firstChild.children);
            const slot = calendar.slots[0];
            await page.click(`.Tappable-inactive.availabilities-slot[aria-label="${slot.date} ${slot.hour}"]`);
        } catch (e) {

        }
    }

    async bookFirstSlot(location) {
        const page = await this.browser.newPage();
        await page.goto(location.url);
        await page.waitForSelector('#booking_motive');
        const rawMotivs = await page.$eval('#booking_motive', result => result.outerHTML);
        const motivs = parser.parseForMotive(rawMotivs);
        for (let motiv of motivs) {
            if (motiv.includes('1')) {
                await page.select('#booking_motive', motiv);
                break;
            }
        }
        do {
            await this.parseAndBookCalendar(page);
        } while (await page.$('body > div.js-appointment-rules-dialog.dl-modal') === null);

        // Click on "J'accepte" buttons
        do {
            await this.parseAndBookCalendar(page);
        } while (await page.$('body > div.js-appointment-rules-dialog.dl-modal') === null);

        do {
            try {
                await page.waitForSelector('div.dl-button-check-outer > button:not([disabled])', {
                    timeout: 100
                });
                await page.click('div.dl-button-check-outer > button:not([disabled])');
            } catch (e) {

            }
        } while (await page.$('button.Tappable-inactive.dl-button-primary.booking-motive-rule-button.dl-button.dl-button-block.dl-button-size-normal') === null);

        // Read and accept button
        await page.click('button.Tappable-inactive.dl-button-primary.booking-motive-rule-button.dl-button.dl-button-block.dl-button-size-normal');

        // Select me
        await page.waitForSelector('span > .dl-radio-button-input');
        await page.click('span > .dl-radio-button-input');

        // Already consult
        await page.waitForSelector('body > div.appointment-booking > div.dl-booking-funnel > div > div > div.col-sm-8 > div > div > form > div:nth-child(1) > div > div > div > label:nth-child(2)');
        await page.click('body > div.appointment-booking > div.dl-booking-funnel > div > div > div.col-sm-8 > div > div > form > div:nth-child(1) > div > div > div > label:nth-child(2)');

        // Confirm
        await page.waitForSelector('body > div.appointment-booking > div.dl-booking-funnel > div > div > div.col-sm-8 > div > div > form > div.dl-card.dl-card-bg-white.dl-margin.dl-card.dl-padding-b-none > div > button');
        await page.click('body > div.appointment-booking > div.dl-booking-funnel > div > div > div.col-sm-8 > div > div > form > div.dl-card.dl-card-bg-white.dl-margin.dl-card.dl-padding-b-none > div > button');
    }
}

module.exports = {
    Doctolib
}
