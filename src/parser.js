const h = require("htmlparser2");
const { NodeWithChildren } = require('domhandler');

/**
 * Retrieve the first slot available in the city specified
 * @param {string} rawHTML
 * @returns {NodeWithChildren[]}
 */
 function filterSlots(rawHTML) {
    const document = h.parseDocument(rawHTML);
    const results = document.children[0].children;
    // Get results between the <h1> and <h2> tag
    const locations = [];
    for (let idx = 5; ; idx++) {
        const elem = results[idx];
        if (elem.name === 'h2')
            break;
        locations.push(elem);
    }
    return locations;
}

/**
 * Find title, ...
 * @param {NodeWithChildren} raw
 * @returns
 */
function parsePresentation(raw) {
    return {
        name: h.DomUtils.getText(raw.firstChild.lastChild.firstChild.firstChild.firstChild).split('\n').join(' '),
        address: h.DomUtils.getText(raw.children[1].lastChild.firstChild).split('\n').join(' -'),
        url: `https://www.doctolib.fr${h.DomUtils.getAttributeValue(raw.lastChild.firstChild, 'href')}`
    };
}

/**
 * Find avaible slot, ...
 * @param {NodeWithChildren} raw
 */
function parseCalendar(raw) {
    let slots = [];
    try {
        const rawDays = raw.firstChild.firstChild.firstChild.firstChild.firstChild.firstChild.firstChild.children;
        rawDays.shift();
        rawDays.pop();
        slots = rawDays.map(rawDay => {
            const date = `${h.DomUtils.getText(rawDay.firstChild.firstChild)} ${h.DomUtils.getText(rawDay.firstChild.lastChild)}`;
            const slots = rawDay.lastChild.children.map(slot => {
                if (slot.attribs.class === 'availabilities-empty-slot')
                    return null;
                return {
                    date,
                    hour: h.DomUtils.getText(slot)
                }
            });
            return slots.filter(s => !!s);
        }).reduce((acc, curr) => acc.concat(curr), []);
    } catch (e) {

    }
    return {
        slots
    };
}

/**
 * Parse one location dom to json
 * @param {NodeWithChildren} raw
 */
function parseLocation(raw) {
    return {
        ...parsePresentation(raw.firstChild),
        ...parseCalendar(raw.lastChild)
    };
}

function parseForCities(rawHTML) {
    const parsed = h.parseDocument(rawHTML);
    const city = parsed.firstChild.children[1];
    return city.attribs.id;
}

function parseForSlots(rawHTML) {
    const locations = filterSlots(rawHTML);
    return locations.map(l => parseLocation(l));
}

module.exports = {
    parseForSlots,
    parseForCities
}
