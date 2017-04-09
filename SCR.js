/*
 *	Soda Can Robot Version 1.8
 *	A Discord Voice Robot
 *	By Jimbo138
 *	Requires Node.js, Discord.js version 11, ffmpeg, mathjs, nope-opus, and opusscript
 */

// used to scan for sound files in specified folders
var fs = require("fs");

// used to generate random numbers to play random sounds
var math = require("mathjs");
// required for interaction with Discord
var Discord = require("discord.js");

// initialize the bot
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
// must end with a '/' character.
var audioDirectory = "";

// The userThemes map will take user IDs as keys and will have their values
// be mapped to arrays containing information regarding the filepath of the theme song
// as well as whether or not the user wants their theme song to play when they join the bot's
// current voice channel.
var userThemes;
/*
 *	Obviously I will need to do a little bit of research regarding this feature
 *	first. I will need to create a separate js file containing methods for reading/writing
 *	userTheme files for saving and loading onto the robot.
 */

// This is the Discord User ID for the individual who is running the robot. This is included so that
// other users cannot use the eval command since it is a huge security risk.
var myID = "";

// when true,
var locked = false;

// pre:		filesArray is an array of strings
//				fileName is a string
// post: 	returns true if filesArray contains fileName
//				returns false otherwise
function contains(filesArray, fileName) {
	try {
		for (let i = 0; i < filesArray.length; i++) {
			if (filesArray[i].toLowerCase() === fileName.toLowerCase())
			 	return true;
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
	if (fileName.substring(fileName.length - 4) !== ".mp3")
		fileName = fileName + ".mp3";
	while (fileName.includes("/")) {
		inputDirectory = inputDirectory + fileName.substring(0,fileName.indexOf("/") + 1);
		fileName = fileName.substring(fileName.indexOf("/") + 1);
	}
	if (inputDirectory.substring(inputDirectory.length - 1) != "/")
		inputDirectory += "/";
	if (currentConnection != null) {
		fs.readdir(inputDirectory, (err, files) => {
			if (contains(files, fileName)) {
				if (dispatcher != null) {
					dispatcher.end();
				}
				if (debugMode)
					console.log("Playing sound:    " + fileName);
				dispatcher = currentConnection.playFile(inputDirectory + fileName);
			} else {
				if (debugMode)
					console.log("Invalid sound:    " + fileName);
				msg.channel.sendMessage("Sorry, that file does not exist.");
			}
		});
	} else {
		if (debugMode)
			console.log("Attempted to play a sound while not connected to a voice channel.");
		msg.channel.sendMessage("I am not connected to a voice channel.");
	}
}

// pre: 	Parameter voiceChannel is a Discord.VoiceChannel object
//			The bot has the proper permissions to join the voice channel
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
			console.log("voiceChannel.join() error: " + err.message);
			return false;
		}
		return true;
	} else {
		if (debugMode)
			console.log("Tried to join " + voiceChannel.name + " w/ insufficient permission");
		return false;
	}
}

// Fires every time the bot sees a message.
bot.on("message", msg => {
	// ignore messages sent by bots or sent through direct messages.
	if (!msg.author.bot | msg.channel.type != 'dm') {
		if (locked = false | msg.author.id === myID) {
			if (msg.content.startsWith(commandPrefix)) {
				let userMessage = msg.content.toLowerCase().substring(commandPrefix.length);
				// Attempts to join the voice channel the
				// message's sender is connected to, if the sender
				// is connected to a voice channel at all.
				if (userMessage === "join") {
					if (debugMode)
						console.log("ATTEMPTING TO JOIN A CHANNEL");
					if (!joinChannel(msg.member.voiceChannel))
						msg.reply("Could not join due to an error.");
					if (debugMode)
						console.log("Attempt completed.");
				}

				//
				else if (userMessage.startsWith("eval") & msg.author.id === myID) {
					try {
						eval(msg.content.substring(5));
						if (debugMode)
							console.log("EVALUATED:   " + msg.content.substring(5));
					} catch (e) {
						msg.channel.sendMessage(e.message);
						console.log("eval error:")
						console.log("code:       " + msg.content.substring(5));
						console.log("message:     " + e.message);
					}
				}

				// plays a blank sound file to override any
				// currently playing sounds.
				else if (userMessage === "silence" |
						userMessage === "stop" |
						userMessage === "s") {
					if (debugMode)
						console.log("Silencing");
					if (dispatcher != null) {
						dispatcher.end();
						dispatcher = null;
					}
				}

				// Leaves the current voice channel if connected,
				// and sets currentConnection to null.
				else if (userMessage === "leave" |
						userMessage === "disconnect") {
					if (currentConnection != null) {
						if (debugMode)
							console.log("LEAVING VOICE CHANNEL");
						msg.channel.sendMessage("Leaving voice channel.");
						currentConnection.disconnect();
						currentConnection = null;
						dispatcher = null;
					}
				}

				// Shuts the bot down.
				// Ends dispatcher if !null
				// Disconnects currentConnection if !null
				else if (userMessage === "shutdown") {
					if (debugMode)
						console.log("SHUTTING DOWN");
					msg.channel.sendMessage("Goodbye.");
					if (dispatcher != null)
						dispatcher.end();
					if (currentConnection != null)
						currentConnection.disconnect();
					bot.destroy();
				}

				// Plays a random sound
				else if (userMessage.startsWith("random")) {
					let directory = audioDirectory + msg.content.substring(8);
					fs.readdir(directory, (err, files) => {
						if (files == null) {
							msg.reply("Invalid directory.");
						} else {
							let fileName = files[math.randomInt(0, files.length - 1)];
							if (debugMode)
								console.log("Attempting to play a random sound.");
							play(fileName, msg, directory);
						}
					});
				}

				// sends a message containing all files that can be played
				// to the same text channel the request was received from.
				else if (userMessage.startsWith("index")) {
					let directory = audioDirectory + msg.content.substring(9);
					fs.readdir(directory, (err, files) => {
						if (files != null) {
							for (i = 0; i < files.length; i++) {
								if (!files[i].includes('.')) {
									files.splice(i,1);
									i--;
								}
							}
							let result = files.toString();
							msg.channel.sendMessage("```" + result.replace(/,/g, "\n") + "```");
							if (debugMode)
								console.log("Serving INDEX of " + directory);
						} else {
							msg.reply("Invalid directory.")
						}
					});
				}

				else if (userMessage.startsWith("indices")) {
					// base this off of index, except have it omit all strings containing periods
					let directory = audioDirectory + msg.content.substring(9);
					fs.readdir(directory, (err, files) => {
						if (files != null) {
							for (i = 0; i < files.length; i++) {
								if (files[i].includes('.')) {
									files.splice(i,1);
									i--;
								}
							}
							let result = files.toString();
							msg.channel.sendMessage("```" + result.replace(/,/g, "\n") + "```");
							if (debugMode)
								console.log("Serving INDEX of " + directory);
						} else {
							msg.reply("Invalid directory.")
						}
					});
				}

				else if (userMessage.startsWith("vol")) {
					value = msg.content.substring(msg.content.indexOf(' ') + 1);
					if (dispatcher != null)
						dispatcher.setVolumeDecibels(value);
				}

				// sends a message containing information on how to use the
				// bot to the same text channel the request was received from.
				else if (userMessage === "help") {
					if (debugMode)
						console.log("Serving HELP");
					result = "```";
					commands = [ // need to do another once-over to make sure everything is consistent
						"'help' will display this menu",
						"'join' will make me join your voice channel.",
						"'leave' will make me disconnect from the voice channel.",
						"'index' will display all files within the general index. If followed by a" +
							" subdirectory name, it will display all files within that folder instead.",
						"'indices' will display all folders within the general folder. If followed" +
							" by a subdirectory name, it will display all files within that folder instead.",
						"'random' will play a random sound. If followed by the name of a subfolder," +
							" it will play a random sound from the specified subfolder only.",
						"'silence', 'stop', or 's' will stop the current sound that is playing."
					];

					for (i = 0; i < commands.length; i++) {// loop through all commands, add them to the string with appropriate prefixes
						result += commands[i] + "\n\n";
					}
					result += "If I am connected to voice, " + playPrefix +
					" followed by a valid filepath will play the specified sound. ```"; // add the playFile function and the ending ```
					msg.channel.sendMessage(result);
				}

				// We have reached the end of all recognizable commands. Since there have been no
				// matches, the robot will inform the user that their request was invalid.
				else {
					msg.channel.sendMessage("Command not recognized. Request invalid.");
				}
			}
			// attempts to play the file with the name matching the string following playPrefix.
			else if (msg.content.startsWith(playPrefix)) {
				let fileName = msg.content.substring(1);
				let inputDirectory = audioDirectory;
				play(fileName, msg, inputDirectory);
			}
		}
	}
});

bot.on("ready", () => {
	console.log("Bot activated");
  if (debugMode)
  	console.log("debugMode enabled");
});

// The token for the bot goes between the quotes in the following line.
bot.login("");
