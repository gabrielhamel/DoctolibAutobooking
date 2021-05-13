const configs = require('./config');
const { Doctolib } = require('./doctolib');

async function main () {
    // const client = await configs.getDiscordBot();
    // const user = await client.users.fetch(configs.getDiscordUserId());
    // user.send('Heelllooo world');

    const doctolib = new Doctolib();
    await doctolib.login(configs.getDoctolibUser(), configs.getDoctolibPassword());
    await doctolib.searchByCity(configs.getVaccinationCity());
    const slots = await doctolib.getAvailableSlots();
    console.dir(slots, {
        depth: null,
    });
}

main();
