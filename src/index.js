require('dotenv').config();

const {Client, IntentsBitField, Collection} = require('discord.js');

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ],
});

const userStates = new Collection();
const dinSchArry = ['NameA', 'NameB', 'NameC'];

client.on('ready', (c) => {
    console.log('the bot is ready');
});

client.on('messageCreate', async (message) =>{
    if (message.author.bot){
        return;
    ;}

    const userId = message.author.id;
    const addWaiting = userStates.get(userId);

    //Addding People to Schedule
    if (addWaiting === 'waiting_to_add'){
        const addResponse = message.content;
        console.log(message.content);

        await message.channel.send(`You will be adding: "${addResponse}" to the DinDin Schdule.`);
        dinSchArry.push(addResponse);

        console.log(dinSchArry);

        userStates.delete(userId);
        return;
    }

    if (message.content == '!addToSch'){
        await message.channel.send('Who would you like to Add? Please only type the name.');

        userStates.set(userId, 'waiting_to_add');
    };

    //Removing People from Schedule
    if (addWaiting === 'waiting_to_remove'){
        const removeResponse = message.content;
        console.log(message.content);

        if(dinSchArry.includes(removeResponse)){
            await message.channel.send(`You have removed... "${removeResponse}"`);

            var remIndex = dinSchArry.indexOf(removeResponse);
            
            dinSchArry.splice(remIndex, 1);
        } else {
            await message.channel.send(`${removeResponse} is not in the schedule.`);
        }
        //dinSchArry.push(reResponse);

        console.log(dinSchArry);

        userStates.delete(userId);
        return;
    }

    if (message.content == '!remFromSch'){
        const scheduleResp = dinSchArry.join('\n');
        await message.channel.send(`Who would you like to remove?\n${scheduleResp}`);

        userStates.set(userId, 'waiting_to_remove');
    };

    //Checking Schedule
    if (message.content == '!din'){
        const scheduleResp = dinSchArry.join('\n');

        message.channel.send(scheduleResp);
    }
});

client.login(process.env.TOKEN);