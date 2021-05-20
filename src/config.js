const Discord = require('discord.js');
const getenv = require('getenv');

require('dotenv').config();

function getDiscordBotToken() {
    return getenv('DISCORD_BOT_TOKEN');
}

function getDiscordUserId() {
    return getenv('DISCORD_USER_ID');
}

function getDoctolibUser() {
    return getenv('DOCTOLIB_USER');
}

function getDoctolibPassword() {
    return getenv('DOCTOLIB_PASSWORD');
}

function getVaccinationCity() {
    return getenv('VACCINATION_CITY');
}


let discordClient = null;
/**
 * Return the bot client when is fully operational
 * @returns {Promise<Discord.Client>}
 */
function getDiscordBot() {
    return new Promise((resolve) => {
        if (discordClient)
            return resolve(discordClient);
        const client = new Discord.Client();
        client.on('ready', () => {
            discordClient = client;
            resolve(discordClient);
        });
        client.login(getDiscordBotToken());
    });
}

module.exports = {
    getDiscordUserId,
    getDiscordBot,
    getDoctolibUser,
    getDoctolibPassword,
    getVaccinationCity
}
