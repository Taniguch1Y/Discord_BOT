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
    .setName("page_completion")
    .setDescription("ページの完成状況を管理")
    .addStringOption((option) =>
      option.setName("participant").setDescription("参加者名").setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("completion")
        .setDescription("完成状況")
        .setRequired(true)
        .addChoices(
          { name: "完成済", value: "done" },
          { name: "未完成", value: "not_done" }
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
      const completion = interaction.options.getString("completion");
      let message = "";
      let isSearchString = false;
      let done = 0;
      let not_done = 0;
      let n = 0;

      for (let i = 0; i < rows.length; i++) {
        if (rows[i].イラスト提出 == "×") {
          not_done++;
        } else {
          done++;
        }
        if (
          rows[i].Xアカウント名 == participant ||
          rows[i].Discordユーザー名 == participant
        ) {
          if (rows[i].ページ完成 == "〇" && completion == "done") {
            message = `${participant}さんのページは既に完成済みです`;
          } else if (rows[i].ページ完成 == "〇" && completion == "not_done") {
            message = `${participant}さんのページを未完成にしました`;
            rows[i].ページ完成 = '×';
            await rows[i].save();
            done--;
            not_done++;
          } else if (rows[i].ページ完成 == "×" && completion == "done") {
            message = `${participant}さんのページを完成済にしました`;
            rows[i].ページ完成 = '〇';
            await rows[i].save();
            done++;
            not_done--;
          } else if (rows[i].ページ完成 == "×" && completion == "not_done") {
            message = `${participant}さんのページは既に未完成です`;
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
            { name: `完成済`, value: `**${done}ページ**` },
            { name: `未完成`, value: `**${not_done}ページ**` },
            {
              name: `${participant}さんのスプシの内容\nXアカウント名`,
              value: `${rows[n].Xアカウント名}`,
            },
          );
          addFieldIfNotEmpty(embed, "支払い方法", rows[n].支払い方法);
          addFieldIfNotEmpty(embed, "イラスト形式", rows[n].イラスト形式);
          addFieldIfNotEmpty(embed, "提出会場", rows[n].アナログイラスト提出方法);
          addFieldIfNotEmpty(embed, "提出方法", rows[n].希望の提出方法);
          addFieldIfNotEmpty(embed, "Discordユーザー名", rows[n].Discordユーザー名);
          addFieldIfNotEmpty(embed, "イラスト提出", `**${rows[n].イラスト提出}**`);
          addFieldIfNotEmpty(embed, "ページ完成", `**${rows[n].ページ完成}**`);
          addFieldIfNotEmpty(embed, "参加費", rows[n].参加費);
          addFieldIfNotEmpty(embed, "参加費受領", `**${rows[n].参加費受領}**`);
          addFieldIfNotEmpty(embed, "備考", rows[n].備考);

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
