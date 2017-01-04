/*	
 *	Soda Can Robot Version 3
 *	A Discord Voice Robot
 *	By Jimbo138
 *	Requires Node.js, Discord.js
 */	

var fs = require("fs");
var mathjs = require("mathjs");
var Discord = require("discord.js");
var bot = new Discord.Client();

var commandPrefix = "!";
var playPrefix = "^";

// turn on for console output
var debugMode = true;

var audioDirectory = ""; // directory for audio file folder goes here.

var voiceChannelID = ""; // desired voice channel for the robot goes here.

function contains(a, fileName) {
    for (let i = 0; i < a.length; i++) {
        if (a[i].toLowerCase() === fileName.toLowerCase()) return true;
    }
    return false;
}

function play(msg, fileName) {
    fs.readdir(audioDirectory, (err, files) => {
        if (contains(files, fileName)) {
            bot.channels.get(voiceChannelID).join().then(connection => {
                if (debugMode) console.log("Playing sound:        " + fileName);
                connection.playFile(audioDirectory + fileName);
            });
        } else {
            if (debugMode) console.log("Nonexistent request:  " + fileName);
            msg.channel.sendMessage("Sorry, that file doesn't exist.");
        }
    });
}



bot.on("message", msg => {
    // ignore all messages that don't have relevant prefixes.
	if ((!msg.content.startsWith(commandPrefix) & !msg.content.startsWith(playPrefix)) |
    msg.author.bot) {
		return;
	}

    /* IRRELEVANT FUNCTION, BOT MUST JOIN CHANNEL EACH TIME IT NEEDS TO PLAY A SOUND.
	// voice commands
	// initializes the voice bot iff the exact message "!join" is sent.
	// need to allow the bot to see what channel the speaker is in, and join their channel.
	if (msg.content.toLowerCase() === commandPrefix + "join") {
		let genVoice = bot.channels.get(voiceChannelID);
		if (genVoice.type === "voice") {
			genVoice.join().then(connection => {
				connection.playFile(audioDirectory + "bot_startup.mp3");
			}, error => {
				console.log("Join channel failure.");
			});
			msg.channel.sendMessage("Joining voice channel: \"" + genVoice.name + "\".");
		}
	}
    */

    if (msg.content.toLowerCase() === commandPrefix + "random") {
        fs.readdir(audioDirectory, (err, files) => {
            let fileName = files[mathjs.randomInt(0, files.length - 1)];
			bot.channels.get(voiceChannelID).join().then(connection => {
                if (debugMode) console.log("Playing random sound: " + fileName);
				connection.playFile(audioDirectory + fileName);
			});
		});
    }

	if (msg.content.toLowerCase() === commandPrefix + "index") {
		fs.readdir(audioDirectory, (err, files) => {
            if (debugMode) console.log("Serving index");
			msg.channel.sendMessage(files.toString().replace(/,/g, ",   "));
		});
	}

	if (msg.content.toLowerCase() === commandPrefix + "help") {
        if (debugMode) console.log("Serving help");
		msg.channel.sendMessage("Availible commands: ");
		// msg.channel.sendMessage("'" + commandPrefix + "join' will activate me");
		msg.channel.sendMessage("'" + commandPrefix + "index' will display all sound files that " +
        "you can play");
		msg.channel.sendMessage("'" + playPrefix + "' followed by a valid file name will " +
        "play a sound");
        msg.channel.sendMessage("'" + commandPrefix + "random' will play a random sound")
		msg.channel.sendMessage("'" + commandPrefix + "leave' will make me disconnect from voice");
	}

	// The only command that looks for the play prefix
	if (msg.content.startsWith(playPrefix)) {
		let fileName = msg.content.substring(1);
		if (fileName.substring(fileName.length - 4) !== ".mp3") {
			fileName = fileName + ".mp3";
		}
        play(msg, fileName);
	}

	if (msg.content.toLowerCase().startsWith(commandPrefix + "leave")) {
		bot.channels.get(voiceChannelID).join().then(connection => {
            if (debugMode) console.log("Disconnecting from voice.");
			connection.disconnect();
		});
	}
});

bot.on("ready", () => {
	console.log("Bot activated");
    if (debugMode) console.log("debugMode enabled");
});

// The token for the bot goes between the quotes in the following line.
bot.login("");
