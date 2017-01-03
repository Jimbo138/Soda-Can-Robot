/*	
 *	Soda Can Robot Version 1
 *	A Discord Voice Robot
 *	By Jimbo138
 *	Requires Node.js, Discord.js
 */	

var fs = require("fs");
var Discord = require("discord.js");
var bot = new Discord.Client();

var audioDirectory = ""; // insert your audio directory for soundclips to be played by the bot here.

bot.on("message", msg => {
	var voicePrefix = "!";
	if (!msg.content.startsWith(voicePrefix) | msg.author.bot) {
		return;
	}
	
	let voiceChannelID = ""; //Insert your desired voice channel ID here
	
	// voice commands
	if (msg.content.startsWith(voicePrefix)) {
		// initializes the voice bot if the exact message "!join" is sent.
		if (msg.content.substring(1).toLowerCase() === ("join")) {
			let genVoice = bot.channels.get(voiceChannelID);
			if (genVoice.type === "voice") {
				genVoice.join().then(connection => {
					connection.playFile(audioDirectory + "bot_startup.mp3"); // change this file to whatever you want
				}, error => {
					console.log("Join channel failure.");
				});
				msg.channel.sendMessage("Joining voice channel: \"" + genVoice.name + "\".");
				return;
			}
		}
		
		if (msg.content.substring(1).toLowerCase().startsWith("play")) {
			let fileName = msg.content.substring(6);
			if (fileName.substring(fileName.length - 4) !== ".mp3") {
				fileName = fileName + ".mp3";
			}
			fs.readdir(audioDirectory, (err, files) => {
				if (files.toString().indexOf(fileName) !== -1) {
					bot.channels.get(voiceChannelID).join().then(connection => {
						connection.playFile(audioDirectory + fileName);
					});
				} else {
					msg.channel.sendMessage("Sorry, that file doesn't exist.");
				}
			});
			return;
		}
		
		/*
		// makes the bot stop playing the current sound if the exact message is sent.
		if (msg.content.toLowerCase() === "#stop") {
			if (bot.VoiceConnections != null) {
				bot.internal.voiceConnection.stopPlaying();
			}
			return;
		}
		
		// makes the bot leave the voice channel if the exact message is sent
		if (msg.content.toLowerCase() === "#out") {
			bot.internal.leaveVoiceChannel();
			return;
		}
		
		// makes the bot play a sound if the message starts with #play and contains the name
		// of an audio file afterwards. There must be a space between "#play" and the name.
		if (msg.content.toLowerCase().startsWith("#play")) {
			bot.voiceConnections.playFile(audioDirectory + "what.mp3");
			return;
			// this is skipped temporarily. Needs to be fixed.
			if (bot.VoiceChannel != null) {
				bot.reply(msg, "Playing the sound.");
				var link = bot.internal.voiceConnection;
				var file = audioDirectory + msg.substring(6, msg.length());
				link.playFile(file);
			}
		}
		*/
	}
});

bot.on("ready", () => {
	console.log("Beep Boop, I am ready!");
});

// The token for the bot goes between the quotes in the following line.
bot.login("");
