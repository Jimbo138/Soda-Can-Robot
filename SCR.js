/*
 *	Soda Can Robot Version 7b
 *	A Discord Voice Robot
 *	By Jimbo138
 *	Requires Node.js, Discord.js version 11, ffmpeg, mathjs, nope-opus, and opusscript
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

// This is the dispatcher. It is a streamDispatcher object that is used to play
// files over voice. This is a variable so that sounds can be stopped.
var dispatcher;

// Set this to false if you do not want console output whenever the bot plays sounds,
// joins or leaves channels, or executes commands.
var debugMode = true;

// The following should lead to the folder on your computer that contains the sounds
// and music that you want the bot to play over voice channels.
var audioDirectory = "C:/Users/Jimmy/Documents/Code/Discord Bot/Discord Audio/";

// pre:		filesArray is an array of strings
//				fileName is a string
// post: 	returns true if filesArray contains fileName
//				returns false otherwise
function contains(filesArray, fileName) {
	try {
		for (let i = 0; i < filesArray.length; i++) {
			if (filesArray[i].toLowerCase() === fileName.toLowerCase()) return true;
		}
	} catch (err) {
		console.log(err.message);
	}
	return false;
}

// pre:		msg is a message object
//				fileName is a string
// post:	plays the audio of the file that has the same name as fileName
//				if bot is not connected to a voice channel, or fileName is invalid,
//				bot will post this in the chat channel that msg originated from.
function play(fileName, msg, inputDirectory) {
	if (inputDirectory.substring(inputDirectory.length - 1) != "/") {
		inputDirectory += "/";
	}
	if (currentConnection != null) {
		fs.readdir(inputDirectory, (err, files) => {
			if (contains(files, fileName)) {
				if (dispatcher != null) dispatcher.stop();
				if (debugMode) console.log("Playing sound:    " + fileName);
				dispatcher = currentConnection.playFile(inputDirectory + fileName);
			} else {
				if (debugMode) console.log("Invalid sound:    " + fileName);
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
	// if we are currently connected to a voice channel, we must disconnect before attempting
	// to join another channel.
	if (voiceChannel.joinable) {
		if (currentConnection != null) {
			currentConnection.disconnect();
			currentConnection = null;
		}
		// try/catch for joining a channel, in case an unforeseen error occurs.
		try {
			voiceChannel.join().then(connection => {
				currentConnection = connection;
			});
		} catch (err) {
			console.log("voiceChannel.join() method error: " + err.message);
			return false;
		}
		return true;
	} else {
		if (debugMode) console.log(
		"Attempted to join " + voiceChannel.name + " with insufficient permissions");
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
				msg.reply("Attempting to join your voice channel.");
				if (msg.member.voiceChannel != null) {
					if (!joinChannel(msg.member.voiceChannel)) {
						msg.reply("Could not join due to an error.");
					}
				} else {
					msg.reply("Error! You are not connected to a voice channel that I can see.");
				}
				if (debugMode) console.log("Attempt completed.");
			}

			else if (msg.content.toLowerCase().startsWith(commandPrefix + "eval:") &
					msg.author.id === "202284467929219072") {
				try {
					eval(msg.content.substring(6));
					if (debugMode) console.log("EVALUATED:   " + msg.content.substring(6));
				} catch (e) {
					msg.channel.sendMessage(e.message);
					console.log("eval error:")
					console.log("code:       " + msg.content.substring(6));
					console.log("message:     " + e.message);
				}
			}

			// plays a blank sound file to override any
			// currently playing sounds.
			else if (msg.content.toLowerCase() === commandPrefix + "silence" |
					msg.content.toLowerCase() === commandPrefix + "stop" |
					msg.content.toLowerCase() === commandPrefix + "s") {
				if (debugMode) console.log("  Silencing");
				if (dispatcher != null) dispatcher.end();
			}

			// Leaves the current voice channel if connected,
			// and sets currentConnection to null.
			else if (msg.content.toLowerCase() === commandPrefix + "leave" |
							msg.content.toLowerCase() === commandPrefix + "disconnect") {
				if (currentConnection != null) {
					if (debugMode) console.log("LEAVING VOICE CHANNEL");
					msg.channel.sendMessage("Leaving voice channel.");
					currentConnection.disconnect();
					currentConnection = null;
				}
			}

			// Shuts the bot down.
			else if (msg.content.toLowerCase() === commandPrefix + "shutdown") {
				if (debugMode) console.log("SHUTTING DOWN");
				msg.channel.sendMessage("Goodbye.");
				if (currentConnection != null) currentConnection.disconnect();
				bot.destroy();
			}

			// Plays a random sound
			else if (msg.content.toLowerCase().startsWith(commandPrefix + "random")) {
				fs.readdir(audioDirectory, (err, files) => {
					if (msg.content.length > 8) {
						if (files.toString().includes(msg.content.substring(8))) {
							let directory = audioDirectory + msg.content.substring(8);
							fs.readdir(directory, (err, files) => {
								let fileName = files[math.randomInt(0, files.length - 1)];
								if (debugMode) console.log("Attempting to play a random sound.");
								play(fileName, msg, directory);
							});
						} else {
							msg.reply("That directory does not exist.");
						}
					} else {
						let fileName = files[math.randomInt(0, files.length - 1)];
						if (debugMode) console.log("Attempting to play a random sound.");
						play(fileName, msg, audioDirectory);
					}
				});
			}

			// sends a message containing all files that can be played
			// to the same text channel the request was received from.
			else if (msg.content.toLowerCase().startsWith(commandPrefix + "index")) {
				let directory = audioDirectory;
				var result = "";
				fs.readdir(directory, (err, files) => {
					result = files.toString();
					if (msg.content.length > 7) {
						if (result.includes(msg.content.substring(7))) {
							directory = directory + msg.content.substring(7);
							fs.readdir(directory, (err, files) => {
								result = files.toString();
								msg.channel.sendMessage("```" + result.replace(/,/g, "\n") + "```");
							});
							if (debugMode) console.log("Serving INDEX of " + directory);
						} else {
							msg.reply("That direcotry does not exist.");
						}
					} else {
						msg.channel.sendMessage("```" + result.replace(/,/g, "\n") + "```");
						if (debugMode) console.log("Serving INDEX of " + directory);
					}
				});
			}

			// sends a message containing information on how to use the
			// bot to the same text channel the request was received from.
			else if (msg.content.toLowerCase() === commandPrefix + "help") {
				if (debugMode) console.log("Serving HELP");
				msg.channel.sendMessage("```Availible commands: \n" +
					"'" + commandPrefix + "help' will display this menu (in case you didn't already know)\n" +
					"'" + commandPrefix + "join' will make me join your voice channel\n" +
					"'" + commandPrefix + "leave' will make me disconnect from voice\n" +
					"'" + commandPrefix + "index' will display all sounds that you can play\n" +
					"'" + commandPrefix + "index boosted' will display all boosted sounds you can play\n" +
					"'" + commandPrefix + "random' will play a random sound\n" +
					"'" + commandPrefix + "silence' will make me be quiet\n" +
					"'" + playPrefix + "' followed by a valid file name will play a sound" +
					"```")
			}

			else {
				msg.channel.sendMessage("Command not recognized.");
			}
		// attempts to play the a file with the name matching the
		// string following the playPrefix.
		} else if (msg.content.startsWith(playPrefix)) {
			let fileName = msg.content.substring(1);
			let inputDirectory = audioDirectory;
			if (fileName.substring(fileName.length - 4) !== ".mp3") fileName = fileName + ".mp3";
			if (fileName.includes("/")) { // currently this only supports "1-deep" folders.
				inputDirectory = inputDirectory + fileName.substring(0,fileName.indexOf("/") + 1);
				fileName = fileName.substring(fileName.indexOf("/") + 1);
				fileName.indexOf("/");
			}
			play(fileName, msg, inputDirectory);
		}
	}
});

bot.on("ready", () => {
	console.log("Bot activated");
  if (debugMode) console.log("debugMode enabled");
});

// The token for the bot goes between the quotes in the following line.
bot.login("");
