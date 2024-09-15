const { REST, Routes } = require("discord.js");

const searchFile1 = require("./commands/search.js");
const searchFile2 = require("./commands/memberlist.js");
const searchFile3 = require("./commands/twipla.js");
const searchFile4 = require("./commands/participation-fee.js");
const searchFile5 = require("./commands/page.js");
const searchFile6 = require("./commands/illust.js");

const { applicationId, guildId, token } = require("./config.json");

const commands = [
  searchFile1.data.toJSON(),
  searchFile2.data.toJSON(),
  searchFile3.data.toJSON(),
  searchFile4.data.toJSON(),
  searchFile5.data.toJSON(),
  searchFile6.data.toJSON(),

];

const rest = new REST({ version: "10" }).setToken(token);

(async () => {
  try {
    await rest.put(Routes.applicationGuildCommands(applicationId, guildId), {
      body: commands,
    });
    console.log("サーバー固有のコマンドが登録されました！");
  } catch (error) {
    console.error("コマンドの登録中にエラーが発生しました:", error);
  }
})();
