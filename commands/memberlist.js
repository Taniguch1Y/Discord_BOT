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
    .setName("member_list")
    .setDescription("参加者の概要を表示"),

  execute: async function (interaction) {
    try {
      // スプレッドシートからデータを取得
      await doc.useServiceAccountAuth(CREDS);
      await doc.loadInfo();
      const sheet = doc.sheetsByTitle["回答"];
      const rows = await sheet.getRows();
      const illust_done = rows.filter(row => row.イラスト提出 === '〇').length;
      const illust_not_done = rows.filter(row => row.イラスト提出 === '×').length;
      const page_done = rows.filter(row => row.ページ完成 === '〇').length;
      const page_not_done = rows.filter(row => row.ページ完成 === '×').length;
      const participant_fee_done = rows.filter(row => row.参加費受領 === '〇').length;
      const participant_fee_not_done = rows.filter(row => row.参加費受領 === '×').length;
      const analog_number = rows.filter(row => row.イラスト形式 === 'アナログイラスト').length;
      const degital_number = rows.filter(row => row.イラスト形式 === 'デジタルイラスト').length;
      let analog_participation = ""
      let degital_participation = ""
      
      for (let i = 0; i < rows.length; i++) {
        if (rows[i].イラスト形式 == "アナログイラスト") {
          analog_participation += `${rows[i].Xアカウント名}(${rows[i].アナログイラスト提出方法})\n`
        } else {
          degital_participation += `${rows[i].Xアカウント名} `
        }
      }
      
      


      let embed = new EmbedBuilder()
        .setTitle(`参加者の概要**【${rows.length}人】**`)
        .setColor("ffacc6")
        .addFields(
          { name: `デジタルイラスト参加者**【${degital_number}人】**`, value: `${degital_participation}` },
          { name: `アナログイラスト参加者**【${analog_number}人】**`, value: `${analog_participation}` },
           { name: `参加費`, value: `${rows[0].参加費}` },         
          { name: `参加費支払い済み`, value: `**${participant_fee_done}人**` },
          { name: `参加費未支払い`, value: `**${participant_fee_not_done}人**` },
          { name: `イラスト提出済`, value: `**${illust_done}人**` },
          { name: `イラスト未提出`, value: `**${illust_not_done}人**` },          
          { name: `ページ完成`, value: `**${page_done}人**` },
          { name: `ページ未完成`, value: `**${page_not_done}人**` },
          
        );


        await interaction.reply({ embeds: [embed] });
      
    } catch (error) {
      console.error("Error retrieving rows:", error);
      await interaction.reply(
        "スプレッドシートのデータを取得中にエラーが発生しました。"
      );
    }
  },
};