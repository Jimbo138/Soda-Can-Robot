var Discord = require("discord.js");
var bot = new Discord.Client();

bot.on("message", msg => {
	var prefix = "!";
	if (!msg.content.startsWith(prefix) | msg.author.bot) {
		return;
	}
    if (msg.content.toLowerCase().startsWith(prefix + "do the roar")) {
        msg.channel.sendMessage("AAAAAAAAAAAAAAAAAA");
	} else if (msg.content.toLowerCase().startsWith(prefix + "well this one dont like manual labor")) {
		msg.channel.sendMessage("What on earth");
	} else if (msg.content.toLowerCase().startsWith(prefix + "mad cause")) {
		msg.channel.sendMessage("MAD CAUSE BAD");
	}
});

bot.on("ready", () => {
	console.log('Beep Boop, I am ready!');
});

// The token for the bot goes between the quotes in the following line.
bot.login("");
