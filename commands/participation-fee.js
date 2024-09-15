const {
  Client,
  Intents,
  EmbedBuilder,
  SlashCommandBuilder,
} = require("discord.js");

const axios = require("axios");
const cheerio = require("cheerio");
// スプシのモジュールを読み込む
const { GoogleSpreadsheet } = require("google-spreadsheet");
// APIキーを読み込む
const API_KEY_JSON = "./../api-key.json";
const CREDS = require(API_KEY_JSON);
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
    .setName("participation_fee")
    .setDescription("参加費に支払い状況を管理")
    .addStringOption((option) =>
      option.setName("participant").setDescription("参加者名").setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("payment")
        .setDescription("支払い状況")
        .setRequired(true)
        .addChoices(
          { name: "支払い済", value: "done" },
          { name: "未支払い", value: "not_done" }
        )
    ),

  execute: async function (interaction) {
    try {
      // スプレッドシートからデータを取得
      await doc.useServiceAccountAuth(CREDS);
      await doc.loadInfo();
      const sheet = doc.sheetsByTitle["回答"];
      const rows = await sheet.getRows();

      // 選択された参加者を取得
      const participant = interaction.options.getString("participant");
      const payment = interaction.options.getString("payment");
      let message = "";
      let isSearchString = false;
      let done = 0;
      let not_done = 0;
      let n = 0;

      for (let i = 0; i < rows.length; i++) {
        if (rows[i].参加費受領 == "×") {
          ++not_done;
        } else {
          ++done;
        }
        if (
          rows[i].Xアカウント名 == participant ||
          rows[i].Discordユーザー名 == participant
        ) {
          if (rows[i].参加費受領 == "〇" && payment == "done") {
            message = `${participant}さんは既に参加費を支払い済みです`;
          } else if (rows[i].参加費受領 == "〇" && payment == "not_done") {
            message = `${participant}さんを参加費未支払いにしました`;
            rows[i].参加費受領 = '×';
            await rows[i].save();
            --done;
            ++not_done;
          } else if (rows[i].参加費受領 == "×" && payment == "done") {
            message = `${participant}さんを参加費支払い済みにしました`;
            rows[i].参加費受領 = '〇';
            await rows[i].save();
            ++done;
            --not_done;
          } else if (rows[i].参加費受領 == "×" && payment == "not_done") {
            message = `${participant}さんは既に参加費未支払いです`;
          }
          n = i;
          isSearchString = true;
        }
      }

      if (!isSearchString) {
        await interaction.reply(
          `"${participant}"と一致する行は見つかりませんでした。`
        );
      } else {
        let embed = new EmbedBuilder()
          .setTitle(message)
          .setColor("ffacc6")
          .addFields(
            { name: `支払い済`, value: `**${done}人**` },
            { name: `未支払い`, value: `**${not_done}人**` },
            {
              name: `${participant}さんのスプシの内容\nXアカウント名`,
              value: `${rows[n]._rawData[1]}`,
            }
          );
        addFieldIfNotEmpty(embed, "支払い方法", rows[n]._rawData[2]);
        addFieldIfNotEmpty(embed, "イラスト形式", rows[n]._rawData[3]);
        addFieldIfNotEmpty(embed, "提出会場", rows[n]._rawData[4]);
        addFieldIfNotEmpty(embed, "提出方法", rows[n]._rawData[5]);
        addFieldIfNotEmpty(embed, "Discordユーザー名", rows[n]._rawData[7]);
        addFieldIfNotEmpty(embed, "イラスト提出", `**${rows[n]._rawData[9]}**`);
        addFieldIfNotEmpty(embed, "ページ完成", `**${rows[n]._rawData[10]}**`);
        addFieldIfNotEmpty(embed, "参加費", rows[n]._rawData[11]);
        addFieldIfNotEmpty(embed, "参加費受領", `**${rows[n]._rawData[12]}**`);
        addFieldIfNotEmpty(embed, "備考", rows[n]._rawData[8]);

        await interaction.reply({ embeds: [embed] });
      }
    } catch (error) {
      console.error("Error retrieving rows:", error);
      await interaction.reply(
        "スプレッドシートのデータを取得中にエラーが発生しました。"
      );
    }
  },
};
