const configs = require('./config');
const { Doctolib } = require('./doctolib');

function sendAvailableSlots(discord, location) {
    discord.users.fetch(configs.getDiscordUserId())
        .then(user => {
            let message = `**Rendez-vous disponibles:**\n\n`;
            message += `**Lieux:**\n`
            message += `${location.address}\n`
            message += `${location.name}\n\n`
            message += `**Créneaux:**\n`
            location.slots.forEach(slot => {
                message += `   - ${slot.date} ${slot.hour}\n`;
            });
            message += `\n`
            message += `${location.url}\n`
            user.send(message);
        })
}

async function main () {
    const doctolib = new Doctolib();
    const discord = await configs.getDiscordBot();

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
            sendAvailableSlots(discord, location)
            // There are available slots on this location
            try {
                await doctolib.bookFirstSlot(location);

                // Send confirmation via discord
                const user = await discord.users.fetch(configs.getDiscordUserId());
                user.send('Un rendez-vous a été réservé !');
            } catch (e) {
                console.log(e);
            }
        }
    }
}

main();
