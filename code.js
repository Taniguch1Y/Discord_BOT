const { Client, Events, GatewayIntentBits, ActivityType } = require("discord.js");
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

 client.on('ready', () => {
    client.user.setActivity(
       'お絵かき', { type: ActivityType.Playing }
     );
 });

const commandFiles = [
    './commands/search.js',
    './commands/illust.js',
    './commands/page.js',
    './commands/participation-fee.js',
    './commands/memberlist.js',
    './commands/twipla.js',
];

// スラッシュコマンドに応答するには、interactionCreateのイベントリスナーを使う必要があります
client.on(Events.InteractionCreate, async interaction => {

    // スラッシュ以外のコマンドの場合は対象外なので早期リターンさせて終了します
    // コマンドにスラッシュが使われているかどうかはisChatInputCommand()で判断しています
    if (!interaction.isChatInputCommand()) return;

    for (const filePath of commandFiles) {
        const commandFile = require(filePath);

        if (interaction.commandName === commandFile.data.name) {
            try {
                await commandFile.execute(interaction);
            } catch (error) {
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'コマンド実行時にエラーになりました。', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'コマンド実行時にエラーになりました。', ephemeral: true });
                }
            }
            return; 
        }
    }

    console.error(`${interaction.commandName}というコマンドには対応していません。`);
});

client.login(process.env.DISCORD_BOT_TOKEN);