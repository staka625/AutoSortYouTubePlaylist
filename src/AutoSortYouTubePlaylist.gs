/**
 * 設定シートの名前
 * @const {string}
 */
const SETTINGS_SHEET = "Settings";

/**
 * データシートの名前
 * @const {string}
 */
const DATA_SHEET = "PlaylistData";

/**
 * 設定シートのキー: プレイリストID
 * @const {string}
 */
const PLAYLIST_ID_KEY = "PlaylistID";

/**
 * 設定シートのキー: 並び替えの第1キー
 * @const {string}
 */
const SORT_KEY1 = "SortKey1";

/**
 * 設定シートのキー: 並び替えの第2キー
 * @const {string}
 */
const SORT_KEY2 = "SortKey2";

/**
 * 設定シートのキー: Discord通知用のWebhook URLのキー
 * @const {string}
 */
const DISCORD_WEBHOOK_URL = "DiscordWebhook";

/**
 * メイン処理: プレイリストを取得・並び替え・更新し、必要ならDiscordに通知を送信する
 */
function sortYouTubePlaylist() {
  const spreadSheet = SpreadsheetApp.getActiveSpreadsheet();
  const settingsSheet = spreadSheet.getSheetByName(SETTINGS_SHEET);
  const dataSheet = spreadSheet.getSheetByName(DATA_SHEET);

  // 設定情報を取得
  const settings = getSettings(settingsSheet);
  const playlistId = settings[PLAYLIST_ID_KEY];
  const key1 = settings[SORT_KEY1] || "チャンネル名"; // デフォルトソートキー1
  const key2 = settings[SORT_KEY2] || "動画名"; // デフォルトソートキー2
  const discordWebhookUrl = settings[DISCORD_WEBHOOK_URL];

  if (!playlistId) {
    const message = "⚠️ プレイリストIDが設定されていません。";
    if (discordWebhookUrl) {
      sendDiscordNotification(discordWebhookUrl, message);
    }
    return;
  }

  // プレイリスト情報を取得してスプレッドシートに書き込む
  const playlistItems = fetchPlaylistItems(playlistId);
  writePlaylistToSheet(dataSheet, playlistItems);

  // 並び替えと更新処理
  const originalOrder = playlistItems.map((item) => item.videoId);
  playlistItems.sort((a, b) => {
    return a[key1].localeCompare(b[key1]) || a[key2].localeCompare(b[key2]);
  });

  const newOrder = playlistItems.map((item) => item.videoId);
  if (JSON.stringify(originalOrder) === JSON.stringify(newOrder)) {
    const message = "✅ 並び順がすでに一致しています。変更はありません。";
    if (discordWebhookUrl) {
      sendDiscordNotification(discordWebhookUrl, message);
    }
    Logger.log(message);
    return;
  }

  // 並び順を更新
  const updateResult = updatePlaylistPositions(playlistItems);
  const message =
    `📢 プレイリストの更新が完了しました。\n` +
    `🎵 合計: ${updateResult.total} 曲\n` +
    `🔄 更新数: ${updateResult.diff}\n` +
    `✅ 成功数: ${updateResult.success}\n` +
    `⚠️ エラー数: ${updateResult.error}`;

  if (discordWebhookUrl) {
    sendDiscordNotification(discordWebhookUrl, message);
  }
  Logger.log(message);
}

/**
 * 並び替えた配列に従い、各アイテムのpositionを更新する
 * @param {Array<Object>} sortedItems 並び替え済みのアイテム配列
 * @return {Object} 更新結果の統計情報
 */
function updatePlaylistPositions(sortedItems) {
  let errorCnt = 0;
  let diffCnt = 0;

  sortedItems.forEach((item, index) => {
    if (item.snippet.position !== index) {
      diffCnt++;
      const updatedSnippet = {
        playlistId: item.snippet.playlistId,
        position: index,
        resourceId: item.snippet.resourceId,
      };
      const updatedItem = {
        id: item.id,
        snippet: updatedSnippet,
      };
      try {
        YouTube.PlaylistItems.update(updatedItem, "snippet");
      } catch (e) {
        Logger.log("Error updating item " + item.id + ": " + e);
        errorCnt++;
      }
    }
  });

  return {
    total: sortedItems.length,
    diff: diffCnt,
    error: errorCnt,
    success: diffCnt - errorCnt,
  };
}

/**
 * Discordにメッセージを送信する
 * @param {string} webhookUrl Discord Webhook URL
 * @param {string} message 送信するメッセージ
 */
function sendDiscordNotification(webhookUrl, message) {
  const payload = {
    content: message,
  };

  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
  };

  try {
    UrlFetchApp.fetch(webhookUrl, options);
  } catch (e) {
    Logger.log("Discord通知の送信中にエラーが発生しました: " + e);
  }
}
