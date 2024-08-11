const {Client, IntentsBitField} = require('discord.js');

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ],
});

client.login("OTUzMDQ1MzI5ODMyNDU2MTky.GbLLPa.U0hPJHaceiS5_LqZN5nm1mjirjLWgKgGPAzfoQ");
