const { mineflayer: mineflayerViewer } = require("prismarine-viewer");
bot.once("spawn", () => {
  mineflayerViewer(bot, { port: 12345, firstPerson: true }); // port is the minecraft server port, if first person is false, you get a bird's-eye view
});