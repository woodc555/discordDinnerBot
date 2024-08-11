require('dotenv').config();

const {Client, IntentsBitField} = require('discord.js');

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ],
});

client.on('ready', (c) => {
    console.log('the bot is ready');
});

client.on('messageCreate', (message) => {
    if (message.content == '!DinDin'){
        message.reply('This is where the schedule will pop up!');
    }
});

client.login(process.env.TOKEN);