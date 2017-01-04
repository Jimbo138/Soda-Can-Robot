/*	
 *	Soda Can Robot Version 4
 *	A Discord Voice Robot
 *	By Jimbo138
 *	Requires Node.js, Discord.js, ffmpeg, and mathjs
 */	

// require fs for scanning filesystem for sound file names
var fs = require("fs");
// require mathjs for random number generation
var mathjs = require("mathjs");
var Discord = require("discord.js");
var bot = new Discord.Client();
var commandPrefix = "!";
var playPrefix = "^";
var currentConnection;

// turn on for console output
var debugMode = true;

var audioDirectory = "";

// pre: 	filesArray is an array that contains strings
// 				fileName is a string
// post:	returns true if filesArray contains fileName
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
		if (debugMode) console.log("Attempted to play a sound while not connected to voice.")
		msg.channel.sendMessage("I am not connected to a voice channel.");
	}
}

// pre: 	parameter voiceChannel is a VoiceChannel object
// post: 	The bot will join the given voiceChannel
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

// fires every time the bot sees a message
bot.on("message", msg => {
	// if (debugMode) console.log("Handling message");
	
	// if (msg.channel.type == 'dm') bot.channels.find('id', "").sendMessage(msg.content);
	
	// ignores all messages with no relevant prefix
	// also ignores all messages sent by bots or through DM
	if ((!msg.content.startsWith(commandPrefix) & !msg.content.startsWith(playPrefix)) |
		msg.author.bot | msg.channel.type == 'dm') {
		// if (debugMode) console.log("DNPASS prefix/bot message check");
		return;
	}
	
	// initializes the voice bot iff the exact message "!join" is sent by a user.
	if (msg.content.toLowerCase() === commandPrefix + "join") {
		console.log("ATTEMPTING TO JOIN A CHANNEL");
		msg.channel.sendMessage("Attempting to join " + msg.author.username + "'s voice channel.");
		if (joinChannel(msg.member.voiceChannel)) {
			msg.channel.sendMessage("Success.");
		} else {
			// msg.channel.sendMessage("Failure.")
			msg.channel.sendMessage("You're not connected to a voice channel on this server.");
		}
	}
	
	// plays a random sound over the currentConnection
	if (msg.content.toLowerCase() === commandPrefix + "random") {
		fs.readdir(audioDirectory, (err, files) => {
			let fileName = files[mathjs.randomInt(0, files.length - 1)];
			if (debugMode) console.log("Attempting to play a random sound.");
			play(fileName, msg);
		});
  }

	// Chats the current sound index in the same text channel as the received message
	if (msg.content.toLowerCase() === commandPrefix + "index") {
		fs.readdir(audioDirectory, (err, files) => {
      if (debugMode) console.log("Serving index");
			msg.channel.sendMessage(files.toString().replace(/,/g, ",   "));
		});
	}

	// Chats the display menu in the same chat channel as as the received message
	if (msg.content.toLowerCase() === commandPrefix + "help") {
    if (debugMode) console.log("Serving help");
		msg.channel.sendMessage("Availible commands: ");
		msg.channel.sendMessage("'" + commandPrefix + "join' will make me join your voice channel");
		msg.channel.sendMessage("'" + commandPrefix + "leave' will make me disconnect from voice");
		msg.channel.sendMessage("'" + commandPrefix + "index' - display all sounds that you can play");
    	msg.channel.sendMessage("'" + commandPrefix + "random' will play a random sound");
		msg.channel.sendMessage("'" + playPrefix + "' followed by a valid file name will play a sound");
	}

	// Looks for play prefix
	// Scans string after the play prefix, assumed to be a filename of type .mp3
	// attempts to play that file over the currentConnection
	if (msg.content.startsWith(playPrefix)) {
		let fileName = msg.content.substring(1);
		if (fileName.substring(fileName.length - 4) !== ".mp3") {
			fileName = fileName + ".mp3";
		}
		play(fileName, msg);
	}

	// Attempts to leave the currentConnection, if it != null
	if (msg.content.toLowerCase().startsWith(commandPrefix + "leave")) {
    if (debugMode & currentConnection != null) console.log("Disconnecting from voice.");
		if (currentConnection != null) currentConnection.disconnect();
	}
});

bot.on("ready", () => {
	console.log("Bot activated");
  if (debugMode) console.log("debugMode enabled");
});
// The token for the bot goes between the quotes in the following line.
bot.login("");
