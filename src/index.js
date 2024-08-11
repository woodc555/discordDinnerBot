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

    //List of Commands
    if (message.content == "!botCommands"){
        message.channel.send("View Din Din Schedule: **!din**\nAdd To Schedule: **!addToSch**\nRemove From Schedule: **!remFromSch**\n");
    }

     //Checking Schedule
     if (message.content == '!din'){
        const scheduleResp = dinSchArry.join('\n');

        message.channel.send(scheduleResp);
    }

    //Addding People to Schedule
    if (message.content == '!addToSch'){
        await message.channel.send('Who would you like to Add? Please only type the name.');

        userStates.set(userId, 'waiting_to_add');
    };

    if (addWaiting === 'waiting_to_add'){
        const addResponse = message.content;

        await message.channel.send(`You will be adding: "${addResponse}" to the DinDin Schdule.`);
        dinSchArry.push(addResponse);

        userStates.delete(userId);
        return;
    }

    //Removing People from Schedule
    if (message.content == '!remFromSch'){
        const scheduleResp = dinSchArry.join('\n');
        await message.channel.send(`Who would you like to remove?\n${scheduleResp}`);

        userStates.set(userId, 'waiting_to_remove');
    };

    if (addWaiting === 'waiting_to_remove'){
        const removeResponse = message.content;

        if(dinSchArry.includes(removeResponse)){
            await message.channel.send(`You have removed... "${removeResponse}"`);

            var remIndex = dinSchArry.indexOf(removeResponse);
            
            dinSchArry.splice(remIndex, 1);
        } else {
            await message.channel.send(`${removeResponse} is not in the schedule.`);
        }

        userStates.delete(userId);
        return;
    }

    //Switching Positions in Schedule
    if (message.content == '!switchDuties'){
        const scheduleResp = dinSchArry.join('\n');
        await message.channel.send(`Which two people would you like to switch?\n${scheduleResp}`);

        userStates.set(userId, 'waiting_to_switch_part1');
    }

    if (addWaiting === 'waiting_to_switch_part1'){
        switchRespA = message.content;

        if(dinSchArry.includes(switchRespA)){
            tempDinSch = dinSchArry.slice();
            var remIndex = tempDinSch.indexOf(switchRespA);
            tempDinSch.splice(remIndex, 1);

            const tempScheduleResp = tempDinSch.join('\n');

            await message.channel.send(`Who is switching with ${switchRespA}?\n${tempScheduleResp}`);
            userStates.set(userId, 'waiting_to_switch_part2');
        } else {
            await message.channel.send(`${switchRespA} is not someone on the schedule. Try again.`);
        }

    } else if (addWaiting === 'waiting_to_switch_part2'){
        const switchRespB = message.content;

        if(tempDinSch.includes(switchRespB)){
            var switchIndexA = dinSchArry.indexOf(switchRespA);
            var switchIndexB = dinSchArry.indexOf(switchRespB);

            [dinSchArry[switchIndexA], dinSchArry[switchIndexB]] = [dinSchArry[switchIndexB], dinSchArry[switchIndexA]];

            const scheduleResp = dinSchArry.join('\n');

            await message.channel.send(`${switchRespA} will be swapped with ${switchRespB}!\n${scheduleResp}`);

            userStates.delete(userId);
            return;
        } else {
            await message.channel.send(`${switchRespB} is not someone on the schedule. Try again.`);
        }
        
     }
});

client.login(process.env.TOKEN);