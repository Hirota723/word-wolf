<script setup>
import { inject, ref, reactive, onMounted } from "vue"
import socketManager from '../socketManager.js'

// #region global state
const userName = inject("userName")
// #endregion

// #region local variable
const socket = socketManager.getInstance()
// #endregion

// #region reactive variable
const chatContent = ref("")
const chatList = reactive([])
// #endregion

// #region lifecycle
onMounted(() => {
  registerSocketEvent()
})
// #endregion

// #region browser event handler
// 投稿メッセージをサーバに送信する
const onPublish = () => {
  if (chatContent.value.trim() === "") return;

  socket.emit("publishEvent", {
    user: userName.value,
    message: chatContent.value
  });

  // 入力欄を初期化
  chatContent.value = "";
}

// 退室メッセージをサーバに送信する
const onExit = () => {
  socket.emit("exitEvent", userName.value);
}

// メモを画面上に表示する
const onMemo = () => {
  // メモの内容を表示
  chatList.unshift(`${userName.value}さんのメモ: ${chatContent.value}`);
  // 入力欄を初期化
  chatContent.value = "";
}
// #endregion

// #region socket event handler
// サーバから受信した入室メッセージ画面上に表示する
const onReceiveEnter = (data) => {
  chatList.unshift(`${data}さんが入室しました`);
}

// サーバから受信した退室メッセージを受け取り画面上に表示する
const onReceiveExit = (data) => {
  chatList.unshift(`${data}さんが退室しました`);
}

// サーバから受信した投稿メッセージを画面上に表示する
const onReceivePublish = (data) => {
  chatList.unshift(`${data.user}さん: ${data.message}`);
}
// #endregion

// #region local methods
// イベント登録をまとめる
const registerSocketEvent = () => {
  // 入室イベントを受け取ったら実行
  socket.on("enterEvent", (data) => {
    // ikki: ここでユーザーオブジェクトのリストに、入室するユーザーを追加
    // 最初に入室したユーザーについて、isHostをtrueに


    onReceiveEnter(data);
  })

  // 退室イベントを受け取ったら実行
  socket.on("exitEvent", (data) => {
    // ikki: ここでユーザーオブジェクトのリストから、退出するユーザーを削除
    // isHostがtrueのユーザーが入室した場合、その次のユーザーのisHostがtrueに


    onReceiveExit(data);
  })

  // 投稿イベントを受け取ったら実行
  socket.on("publishEvent", (data) => {
    onReceivePublish(data);
  })
}
// #endregion

//ikki: ここから下にゲームの進行部分を実装


//ゲームの進行を行う関数
//開始ボタン押下がトリガー
const processGame = () => {

  //ゲーム開始処理（入退室を制限）


  //Gameクラスをインスタンス化
  //const game = new Game(userList)

  //game.user.all()から、isWolfとsubjectが入ったUserオブジェクトのリストを取得できる
  //各ユーザーにお題を表示する

  // Timerクラスをインスタンス化
  // Timerクラスの仕様についてはfigmaのフローチャート参照
  // const timer = new Timer(minute)

  // await timer.start()

  // タイマー終了後の処理（投票〜処刑〜結果発表）を以下に記述

  // ゲーム終了処理(入室制限解除)


}

</script>

<template>
  <div class="mx-auto my-5 px-4">
    <h1 class="text-h3 font-weight-medium">Vue.js Chat チャットルーム</h1>
    <div class="mt-10">
      <p>ログインユーザ：{{ userName }}さん</p>
      <textarea v-model="chatContent" variant="outlined" placeholder="投稿文を入力してください" rows="4" class="area"></textarea>
      <div class="mt-5">
        <button @click="onPublish" class="button-normal">投稿</button>
        <button @click="onMemo" class="button-normal util-ml-8px">メモ</button>
      </div>
      <div class="mt-5" v-if="chatList.length !== 0">
        <ul>
          <li class="item mt-4" v-for="(chat, i) in chatList" :key="i">{{ chat }}</li>
        </ul>
      </div>
    </div>
    <router-link to="/" class="link">
      <button type="button" class="button-normal button-exit" @click="onExit">退室する</button>
    </router-link>
  </div>
</template>

<style scoped>
.link {
  text-decoration: none;
}

.area {
  width: 500px;
  border: 1px solid #000;
  margin-top: 8px;
}

.item {
  display: block;
}

.util-ml-8px {
  margin-left: 8px;
}

.button-exit {
  color: #000;
  margin-top: 8px;
}
</style>