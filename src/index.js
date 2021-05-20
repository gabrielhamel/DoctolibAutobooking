const configs = require('./config');
const { Doctolib } = require('./doctolib');

const parser = require('./parser');

// const client = await configs.getDiscordBot();
// const user = await client.users.fetch(configs.getDiscordUserId());
// user.send('Heelllooo world');

async function main () {
    const doctolib = new Doctolib();

    // Login
    await doctolib.login(configs.getDoctolibUser(), configs.getDoctolibPassword());

    // Go to specified city
    await doctolib.searchByCity(configs.getVaccinationCity());


    while (true) {
        // Looking for slots
        const slots = await doctolib.getAvailableSlots();
        for (let location of slots) {
            if (!location.slots.length)
                continue;
            // There are available slots on this location
            await doctolib.bookFirstSlot(location);

            return;
        }
    }
}

main();
