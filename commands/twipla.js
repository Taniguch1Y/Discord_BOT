const axios = require("axios");
const cheerio = require("cheerio");
const {
  Client,
  Intents,
  EmbedBuilder,
  SlashCommandBuilder,
} = require("discord.js");

// スプシのモジュールを読み込む
const { GoogleSpreadsheet } = require("google-spreadsheet");
// APIキーを読み込む
const API_KEY_JSON = "./../api-key.json";
const CREDS = require(API_KEY_JSON);
const { spreadsheet_url, twipla_url } = require("./../config.json");
const doc = new GoogleSpreadsheet(spreadsheet_url);

// スクレイピング関数
async function scrapeNamelist(url) {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const TwiPlaMembers = [];

    $(".float_left.member_list.round_border")
      .first()
      .find("ul li")
      .each((index, element) => {
        const name = $(element).find("a.card.namelist").attr("n");
        //const id =  $(element).find("a.card.namelist").attr("s");
        //const url = `[${name}](<https://x.com/${id}>)`
        TwiPlaMembers.push(name);
      });

    return TwiPlaMembers;
  } catch (error) {
    console.error("Error fetching the URL:", error);
    return [];
  }
}

function formatMemberMessage(members) {
  let message = "";
  members.forEach((member) => {
    message += `${member}\n`;
  });
  message = message.slice(0, -1);
  //console.log(message);
  return message;
}

function compareArrays(arr1, arr2) {
  // 配列をセットに変換
  const set1 = new Set(arr1);
  const set2 = new Set(arr2);

  // arr1にしかない要素をフィルタリング
  const onlyInArr1 = arr1.filter((item) => !set2.has(item));
  // arr2にしかない要素をフィルタリング
  const onlyInArr2 = arr2.filter((item) => !set1.has(item));

  return {
    onlyInArr1,
    onlyInArr2,
  };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("twipla")
    .setDescription("TwiPlaとスプシの提出を比較する"),

  execute: async function (interaction) {
    try {
      await doc.useServiceAccountAuth(CREDS);
      await doc.loadInfo();
      const sheet = doc.sheetsByTitle["回答"];
      const Tmembers = await scrapeNamelist(twipla_url);
      const formattedMessage = formatMemberMessage(Tmembers);

      const rows = await sheet.getRows();
      const Gmembers = [];
      let firstColumnValues = ``;
      rows.forEach((row) => {
        Gmembers.push(row.Xアカウント名);
        firstColumnValues += `${row.Xアカウント名}、`;
      });
      firstColumnValues = firstColumnValues.slice(0, -1);
      const result = compareArrays(Tmembers, Gmembers);
      let Tonly = ``;
      result.onlyInArr1.forEach((item) => (Tonly += `${item}\n`));
      Tonly = Tonly.slice(0, -1);
      let Gonly = ``;
      result.onlyInArr2.forEach((item) => (Gonly += `${item}\n`));
      Gonly = Gonly.slice(0, -1);

      let embed = new EmbedBuilder()
        .setTitle(`TwiPlaの参加者一覧【${Tmembers.length}人】`)
        .setColor("ffacc6")
        .addFields(
          {
            name: `スプシの送信がまだの人【${result.onlyInArr1.length}人】`,
            value: `${Tonly} `,
          },
          {
            name: `TwiPlaでの参加表明がまだの人【${result.onlyInArr2.length}人】`,
            value: `${Gonly} `,
          }
        );

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Error retrieving rows:", error);
      await interaction.reply("TwiPlaのデータを取得中にエラーが発生しました。");
    }
  },
};
