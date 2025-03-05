## GAS 導入手順

1. Google Spreadsheet を作成します。
2. 「PlaylistData」「Settings」シートを作成します。
3. 「Settings」シートの A1 セルに「PlaylistID」と入力します。
4. A2 セルにソートを実施したいプレイリストの ID を入力します。

   ID は、プレイリストの URL の?list=の後の文字列です。
   URL が

   ```
   https://www.youtube.com/playlist?list=ABCDEFG123
   ```

   であれば、ID は

   ```
   ABCDEFG123
   ```

   となります。

5. A 列にキー、B 列にバリューを入力することでその他の設定が可能です。
   |キー|バリュー|必須|デフォルト値|
   |--|--|--|--|
   |PlaylistID|プレイリストの ID|Required|-|
   |SortKey1|第 1 ソートキー(「動画名」or「チャンネル名」)|Optional|チャンネル名|
   |SortKey2|第 2 ソートキー(「動画名」or「チャンネル名」)|Optional|動画名|
   |DiscordWebhook|DiscordWebhook の URL|Optional|指定なし(通知を送信しません)|

6. App Script を作成する。
   ![Image](https://github.com/user-attachments/assets/0030115e-6fd6-4a41-a674-ab0a5b2facd5)

7. サービスの Youtube Data Api v3 を追加。
   ![Image](https://github.com/user-attachments/assets/e125f4f3-3617-4e99-b535-dcb77311ad02)

8. 本リポジトリの.gs コードを貼り付ける。
   後述の Actions を使ってもよい。

9. トリガーから時間主導型のトリガーを以下を参考に追加する。

   ![Image](https://github.com/user-attachments/assets/3d72148d-ef9e-403d-9071-b56523e30c99)

   ![Image](https://github.com/user-attachments/assets/f62b0f5b-6883-419a-8b2f-876dd4d8fa06)

### DiscordWebhook 作成方法(Optional)

DiscordWebhook を指定することで、プレイリストが更新されるタイミングで Discord で通知を受け取ることができます。

1. Discord の Webhook を作成します。
   ![Image](https://github.com/user-attachments/assets/fec07da7-4c70-4421-8e89-4cc742ca2a3c)

2. Integrations > Webhooks から Webhook を作成します。
   ![Image](https://github.com/user-attachments/assets/e2a4d931-e81a-49f2-b506-836a1d32d1f4)

3. Copy WebhookURL で URL をコピーし、Spreadsheet の Settings シートで設定します。

   ↓Like This
   ![Image](https://github.com/user-attachments/assets/33ddb7d1-52c7-4c55-ba28-30a36a8a8e3d)

## GitHub 上での GAS コードの 更新を GitHub Actions で 自動反映する方法

1.  Node.js と clasp をインストールする。

    > 24H2 以降であれば以下コマンドでインストール可能。

    ```pwsh
    winget install OpenJS.NodeJS.LTS
    sudo npm install -g @google/clasp
    ```

2.  clasp にログインし、Autorize する

    ```pwsh
    clasp login
    ```

    以下のように URL が表示されるのでブラウザでアクセス

    ```
    Logging in globally…
    🔑 Authorize clasp by visiting this url:
    https://accounts.google.com/o/oauth2/xxx...
    ```

    認証する。
    ![Image](https://github.com/user-attachments/assets/8ecdd42a-7c61-4697-b706-e5b9aac37302)
    ![Image](https://github.com/user-attachments/assets/7927bfbc-3d18-4b57-b8f9-a65255c01af1)

3.  `~/.clasprc.json`が生成されるので、内容を Github Secrets へ登録する。

    Settings > Secrets and Variables > Actions > Actions secrets > Variables > Repository variable に設定する。

    - CLASP_ACCESS_TOKEN
    - CLASP_CLIENTID
    - CLASP_CLIENTSECRET
    - CLASP_ID_TOKEN
    - CLASP_REFRESH_TOKEN

    GAS のスクリプト ID も「GAS_SCRIPT_ID」として登録しておく。

    GAS のプロジェクトの設定 > ID から確認できる。

    ![Image](https://github.com/user-attachments/assets/eb3aa726-c438-4b4e-8eb2-bda6cb364932)

    ![Image](https://github.com/user-attachments/assets/3f4d45ff-8330-4f8b-ab3e-77bbfe0288a9)

4.  `release`の published、または`workflow_dispatch`をトリガーとして GAS にコードがデプロイされる。
