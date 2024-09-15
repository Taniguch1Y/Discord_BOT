const { GoogleSpreadsheet } = require("google-spreadsheet");
const {
  Client,
  Intents,
  EmbedBuilder,
  SlashCommandBuilder,
} = require("discord.js");
const API_KEY = "./../api-key.json";
const CREDS = require(API_KEY);
const { spreadsheet_url } = require("./../config.json");
const doc = new GoogleSpreadsheet(spreadsheet_url);

// 空でないフィールドを追加する関数
const addFieldIfNotEmpty = (embed, name, value) => {
  if (value && value.trim()) {
    embed.addFields({ name: name, value: value });
  }
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName(`search`)
    .setDescription("検索クエリを含むスプシの行を返す")
    .addStringOption(
      (option) =>
        option.setName("query")
      .setDescription("検索クエリ")
      .setRequired(true) //trueで必須、falseで任意
    ),

  execute: async function (interaction) {
    const searchString = interaction.options.getString("query");
    //const searchAccount = search
    // const regex = /<@(\w+)>/;
    //const match = searchString.user.username;
    try {
      await doc.useServiceAccountAuth(CREDS);
      await doc.loadInfo();
      const sheet = doc.sheetsByTitle["回答"];
      const rows = await sheet.getRows();
      let matchingRows = rows.filter((row) => {
        return Object.values(row._rawData).some((value) =>
          value.includes(searchString)
        );
      });
      let results = "";

      if (matchingRows.length > 0) {
        const matchingList = "";
        for (let i = 0; i < matchingRows.length; i += 10) {
          let chunk = matchingRows.slice(
            i,
            Math.min(i + 10, matchingRows.length)
          );

          let embeds = chunk.map((row, index) => {
            const c = index % 2;
            const color = ["ffacc6", "86dbaa"]; //pink(ffacc6), green(86dbaa)
            let embed = new EmbedBuilder()
              .setTitle(`検索結果${index + 1 + i}`)
              .setColor(color[c])
              .setDescription(`検索クエリ:${searchString}`);
            results += `${row._rawData[1]} `;
            // 空でないフィールドを追加
            addFieldIfNotEmpty(
              embed,
              "Xアカウント名",
              `**${row.Xアカウント名}**`
            );
            addFieldIfNotEmpty(embed, "支払い方法", row.支払い方法);
            addFieldIfNotEmpty(embed, "イラスト形式", row.イラスト形式);
            addFieldIfNotEmpty(embed, "提出会場", row.アナログイラスト提出方法);
            addFieldIfNotEmpty(embed, "提出方法", row.希望の提出方法);
            addFieldIfNotEmpty(embed, "Discordユーザー名", row.Discordユーザー名);
            addFieldIfNotEmpty(embed, "イラスト提出", `**${row.イラスト提出}**`);
            addFieldIfNotEmpty(embed, "ページ完成", `**${row.ページ完成}**`);
            addFieldIfNotEmpty(embed, "参加費", row.参加費);
            addFieldIfNotEmpty(embed, "参加費受領", `**${row.参加費受領}**`);
            addFieldIfNotEmpty(embed, "備考", row.備考);

            return embed;
          });
          if (i == 0) {
            await interaction.reply({ embeds });
          } else {
            await interaction.followUp({ embeds });
          }
        }
        let embedd = new EmbedBuilder()
          .setTitle(`検索結果まとめ`)
          .setColor("ffacc6")
          .setDescription(`検索クエリ:${searchString}`)
          .addFields({
            name: `Xアカウント名一覧**【${matchingRows.length}人】**`,
            value: `${results}`,
          });
        await interaction.followUp({ embeds: [embedd] });
      } else {
        await interaction.reply(
          `"${searchString}"を含む行は見つかりませんでした。`
        );
      }
    } catch (error) {
      console.error("Error retrieving rows:", error);
      await interaction.reply(
        "スプレッドシートのデータを取得中にエラーが発生しました。"
      );
    }
  },
};
