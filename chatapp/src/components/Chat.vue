<script setup>
import { inject, ref, reactive, onMounted } from "vue"
import socketManager from '../socketManager.js'
import User from '../lib/class/user.js'
import Game from '../lib/class/game.js'
import Timer from '../lib/class/timer.js'


// #region global state
const userName = inject("userName")
// #endregion

// #region local variable
const socket = socketManager.getInstance()
// #endregion

// #region reactive variable
const chatContent = ref("")
const chatList = reactive([])
const userList = reactive([])  // ユーザーリストをリアクティブに管理
let alertedForHost = false;  // ホストであることを通知済みかを管理
const isHost = ref(false);  // ホストであるかどうかを管理
const remainingTime = ref(0)  // 残り時間を表示するためのリアクティブ変数


// #endregion

// #region lifecycle
onMounted(() => {
  registerSocketEvent();
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
  chatList.unshift(`${userName.value}$ memo ${chatContent.value}`);
  // 入力欄を初期化
  chatContent.value = "";
}
// #endregion

// #region socket event handler
// サーバから受信した入室メッセージ画面上に表示する
const onReceiveEnter = (data) => {
  chatList.unshift(`import ${data}さん // ${data}が入室しました。`);
}

// サーバから受信した退室メッセージを受け取り画面上に表示する
const onReceiveExit = (data) => {
  chatList.unshift(`return ${data}さん // ${data}が退出しました。`);
}

// サーバから受信した投稿メッセージを画面上に表示する
const onReceivePublish = (data) => {
  chatList.unshift(`${data.user}$ ${data.message}`);
}
// #endregion

// #region local methods
// イベント登録をまとめる
const registerSocketEvent = () => {
  // ikki: ここでユーザーオブジェクトのリストに、入室するユーザーを追加
  // 最初に入室したユーザーについて、isHostをtrueに
  // サーバからのユーザリストで更新
  socket.on("updateUserList", (serverUserList) => {
    userList.length = 0;
    userList.push(...serverUserList.map(user => new User(user.name, user.isHost)));

    const currentUser = userList.find(user => user.name === userName.value);
    if (currentUser && currentUser.isHost && !alertedForHost) {
      alert(`${currentUser.name}さんがホストです`);
      alertedForHost = true;
      isHost.value = true;
    } else if (!isHost.value) {
      isHost.value = false;
    }
  });

  socket.on("enterEvent", (data) => {
    onReceiveEnter(data);
  })

  socket.on("exitEvent", (data) => {
    // ikki: ここでユーザーオブジェクトのリストから、退出するユーザーを削除
    // isHostがtrueのユーザーが入室した場合、その次のユーザーのisHostがtrueに
    onReceiveExit(data);
  })

  socket.on("publishEvent", (data) => {
    onReceivePublish(data);
  })

  socket.on("subjectAssigned", (data) => {
    if (data.name === userName.value) {
      alert(`あなたのお題は ${data.subject} です`);　//お題を通知
    }
  })

  socket.on("timerUpdate", (timeLeft) => {
    remainingTime.value = timeLeft;　// タイマーの残り時間を更新
  })

  socket.on("timerEnd", () => {
    alert("タイムアップ！投票を開始してください。");　// タイマー終了時に通知
    // 投票フェーズへ
    initiateVoting();
  })
}
// #endregion

//ikki: ここから下にゲームの進行部分を実装


//ゲームの進行を行う関数
//開始ボタン押下がトリガー
const processGame = () => {

  //ゲーム開始処理（入退室を制限）


  //Gameクラスをインスタンス化
  const game = new Game(userList);
  const usersWithSubjects = game.users;

  usersWithSubjects.forEach(user => {
    socket.emit('subjectAssigned', { name: user.name, subject: user.subject });　// 各ユーザにお題を通知
  });

  if (isHost.value) {
    socket.emit("startTimer", 5)　//　5分のタイマーを作成
  }

  alert('ゲームを開始しました！お題を確認してください。');
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
        <button v-if="isHost" @click="processGame" class="button-normal">ゲーム開始</button>
      </div>
      <div class="mt-5" v-if="chatList.length !== 0">
        <ul>
          <li class="item mt-4" v-for="(chat, i) in chatList" :key="i">{{ chat }}</li>
        </ul>
      </div>
      <div v-if="remainingTime > 0">
        <p>残り時間: {{ Math.floor(remainingTime / 60) }}分{{ remainingTime % 60 }}秒</p>
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
