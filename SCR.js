/*	
 *	Soda Can Robot Version 4
 *	A Discord Voice Robot
 *	By Jimbo138
 *	Requires Node.js, Discord.js, ffmpeg, and mathjs
 */	

// used to scan for sound files in specified folders
var fs = require("fs");

// used to generate random numbers to play random sounds
var math = require("mathjs");
var Discord = require("discord.js");
var bot = new Discord.Client();

// The bot looks for these prefixes in the discord text chat to activate commands and play sounds.
// Change these to your personal liking.
var commandPrefix = "!";
var playPrefix = "^";

// This is the VoiceConnection object that the bot uses to broadcast sounds over a voice channel.
// This is not initialized until the bot actually joins a channel.
var currentConnection;

// Set this to false if you do not want console output whenever the bot plays sounds,
// joins or leaves channels, or executes commands.
var debugMode = true;

// The following should lead to the folder on your computer that contains the sounds
// that you want the bot to play over voice channels.
var audioDirectory = "";

// pre:		filesArray is an array of strings
//				fileName is a string
// post: 	returns true if filesArray contains fileName
//				returns false otherwise
function contains(filesArray, fileName) {
	for (let i = 0; i < filesArray.length; i++) {
		if (filesArray[i].toLowerCase() === fileName.toLowerCase()) return true;
	}
	return false;
}

// pre:		msg is a message object
//				fileName is a string
// post:	plays the audio of the file that has the same name as fileName
//				if bot is not connected to a voice channel, or fileName is invalid,
//				bot will post this in the chat channel that msg originated from. 	
function play(fileName, msg) {
	if (currentConnection != null) {
		fs.readdir(audioDirectory, (err, files) => {
			if (contains(files, fileName)) {
				if (debugMode) console.log("Playing sound:        " + fileName);
				currentConnection.playFile(audioDirectory + fileName);
			} else {
				if (debugMode) console.log("Nonexistent request:  " + fileName);
				msg.channel.sendMessage("Sorry, that file does not exist.");
			}
		});
	} else {
		if (debugMode) console.log("Attempted to play a sound while not connected to a voice channel.");
		msg.channel.sendMessage("I am not connected to a voice channel.");
	}
}

// pre: 	Parameter voiceChannel is a Discord.VoiceChannel object
//				The bot has the proper permissions to join the voice channel
// post: 	The bot will join the voiceChannel
function joinChannel(voiceChannel) {
	try {
		voiceChannel.join().then(connection => { 
			currentConnection = connection; 
		});
		if (debugMode) console.log("Joined voice channel: " + voiceChannel.name);
		return true;
	} catch (err) {
		console.log(err.message);
		return false;
	}
}

// Fires every time the bot sees a message.
bot.on("message", msg => {
	// ignore messages sent by bots or sent through direct messages.
	if (!msg.author.bot | msg.channel.type != 'dm') {
		if (msg.content.startsWith(commandPrefix)) { 
			// Attempts to join the voice channel the
			// message's sender is connected to, if the sender
			// is connected to a voice channel at all.
			if (msg.content.toLowerCase() === commandPrefix + "join") { 
				if (debugMode) console.log("ATTEMPTING TO JOIN A CHANNEL");
				msg.channel.sendMessage("Attempting to join " + msg.author.username + "'s voice channel.");
				if (joinChannel(msg.member.voiceChannel)) {
					if (debugMode) console.log("  SUCCESS");
					msg.channel.sendMessage("Success.");
				} else {
					if (debugMode) console.log("  FAILURE");
					msg.channel.sendMessage("Error, could not join.");
				}
			}
			
			// plays a blank sound file to override any 
			// currently playing sounds.
			if (msg.content.toLowerCase() === commandPrefix + "silence" |
					msg.content.toLowerCase() === commandPrefix + "stop" |
					msg.content.toLowerCase() === commandPrefix + "s") {
				if (debugMode) console.log("  Silencing");
				// not using play(fileName, msg) function since fileName "../silence.mp3" will not
				// pass the contains(files, fileName) check.
				if (currentConnection != null) {
					currentConnection.playFile(audioDirectory + "../silence.mp3");
				}
			}
			
			// Leaves the current voice channel if connected, 
			// and sets currentConnection to null.
			if (msg.content.toLowerCase() === commandPrefix + "leave") {
				if (currentConnection != null) {
					if (debugMode) console.log("LEAVING VOICE CHANNEL");
					msg.channel.sendMessage("Leaving voice channel.");
					currentConnection.disconnect();
					currentConnection = null;
				}
			}
			
			// Shuts the bot down.
			if (msg.content.toLowerCase() === commandPrefix + "shutdown") { 
				if (debugMode) console.log("SHUTTING DOWN");
				msg.channel.sendMessage("Goodbye.");
				bot.destroy();
			}
			
			// Plays a random sound
			if (msg.content.toLowerCase() === commandPrefix + "random") {
				fs.readdir(audioDirectory, (err, files) => {
					let fileName = files[math.randomInt(0, files.length - 1)];
					if (debugMode) console.log("Attempting to play a random sound.");
					play(fileName, msg);
				});
			}
			
			// sends a message containing all files that can be played
			// to the same text channel the request was received from.
			if (msg.content.toLowerCase() === commandPrefix + "index") {
				fs.readdir(audioDirectory, (err, files) => {
					if (debugMode) console.log("Serving INDEX");
					msg.channel.sendMessage("```" + files.toString().replace(/,/g, "\n") + "```");
				});
			}
			
			// sends a message containing information on how to use the
			// bot to the same text channel the request was received from.
			if (msg.content.toLowerCase() === commandPrefix + "help") {
				if (debugMode) console.log("Serving HELP");
				msg.channel.sendMessage("```Availible commands: \n" + 
					"'" + commandPrefix + "help' will display this menu (in case you didn't already know)\n" +
					"'" + commandPrefix + "join' will make me join your voice channel\n" + 
					"'" + commandPrefix + "leave' will make me disconnect from voice\n" + 
					"'" + commandPrefix + "index' will display all sounds that you can play\n" + 
					"'" + commandPrefix + "random' will play a random sound\n" + 
					"'" + commandPrefix + "silence' will make me be quiet\n" + 
					"'" + playPrefix + "' followed by a valid file name will play a sound" +
					"```")
			}
		// attempts to play the a file with the name matching the
		// string following the playPrefix.
		} else if (msg.content.startsWith(playPrefix)) {
			let fileName = msg.content.substring(1);
			if (fileName.substring(fileName.length - 4) !== ".mp3") {
				fileName = fileName + ".mp3";
			}
			play(fileName, msg);
		}
	}
});

bot.on("ready", () => {
	console.log("Bot activated");
  if (debugMode) console.log("debugMode enabled");
});

// The token for the bot goes between the quotes in the following line.
bot.login("");
