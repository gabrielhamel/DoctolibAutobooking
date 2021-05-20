const puppeteer = require('puppeteer-extra');
const parser = require('./parser');

const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
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
        const rawResults = await this.page.$eval('div.search-results-col-list', results => results.outerHTML);
        const results = parser.parseForSlots(rawResults);
        return results;
    }
}

module.exports = {
    Doctolib
}
