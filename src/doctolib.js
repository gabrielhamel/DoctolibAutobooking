const puppeteer = require('puppeteer-extra');
const parser = require('./parser');
const h = require("htmlparser2");

const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function autoScroll(page){
    await page.evaluate(async () => {
        await new Promise((resolve, reject) => {
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
            }, 10);
        });
    });
}

class Doctolib {
    constructor () {
        this.launchPromise = puppeteer.launch({
            headless: false
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
    }

    async getAvailableSlots() {
        await this.page.reload();

        // Experimental
        await this.page.goto('https://www.doctolib.fr/vaccination-covid-19/toulouse?ref_visit_motive_ids[]=6970&ref_visit_motive_ids[]=7005&ref_visit_motive_ids[]=7107&ref_visit_motive_ids[]=7945');

        // Scroll until end
        await autoScroll(this.page);
        await this.page.waitForFunction(() => !document.querySelector('div.dl-loader'));
        const rawResults = await this.page.$eval('div.search-results-col-list', results => results.outerHTML);
        const results = parser.parseForSlots(rawResults);
        return results;
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
        const rawHtml = await page.$eval('#booking-content > div.booking.booking-compact-layout > div:nth-child(5) > div > div.dl-layout-container.dl-layout-spacing-xs-0 > div.dl-step-children.dl-layout-item.dl-layout-size-xs-12.dl-layout-size-sm-12 > div > div > div:nth-child(1) > div > div > div.dl-desktop-availabilities-days', result => result.outerHTML);
        const tmp = h.parseDocument(rawHtml);

        const calendar = parser.parseCalendar(h.parseDocument(rawHtml).firstChild.children);
        console.log(calendar);
    }
}

module.exports = {
    Doctolib
}
