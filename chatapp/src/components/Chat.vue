<script setup>
import { inject, ref, reactive, onMounted } from "vue"
import socketManager from '../socketManager.js'
import User from '../lib/class/user.js'
import Game from '../lib/class/game.js'
import router from "../router/index.js";


// #region global state
const userName = inject("userName")
// #endregion

// #region local variable
const socket = socketManager.getInstance()

var wolf = -1;  // 人狼のインデックス
// #endregion

// #region reactive variable
const chatContent = ref("")

const chatList = reactive([])
const userList = reactive([])  // ユーザーリストをリアクティブに管理
const terminal = reactive([]) // ターミナルをリアクティブに管理
let alertedForHost = false;  // ホストであることを通知済みかを管理
const isHost = ref(false);  // ホストであるかどうかを管理
const remainingTime = ref(0)  // 残り時間を表示するためのリアクティブ変数
const inGame = ref(false)  // ゲーム中かどうかを管理

//お題
const subject = ref('ここにお題が表示されます')

const promptInput = ref('')

//ダイアログの表示制御に使用
const isVoteOpen = ref(false)
const isVoteWaiting = ref(false)  // 投票待機中かどうかを管理
const isVoteEnded = ref(false)  // 投票が終了したかどうかを管理

//投票フェーズの状態を管理
const winner = ref('')  // 投票の結果を管理
const selectedPlayer = ref('')  // 投票対象のプレイヤーを管理
// const voteRemainingTime = ref(0)

// #endregion



// #region lifecycle
onMounted(() => {
  registerSocketEvent();
})
// #endregion

// 勝者を取得する関数
const getWinner = (corpse) => {
  if (corpse === wolf) {
    return 'citizens'
  } else {
    return 'wolf'
  }
}

// #region browser event handler
// 投稿メッセージをサーバに送信する
const onPublish = (message) => {
  if (message.trim() === "") return;

  socket.emit("publishEvent", {
    user: userName.value,
    message: message
  });

  // 入力欄を初期化
}

// 退室メッセージをサーバに送信する
const onExit = () => {
  socket.emit("exitEvent", userName.value);
}

// メモを画面上に表示する
const onMemo = (message) => {
  // メモの内容を表示
  chatList.unshift('// ' + message)
  // 入力欄を初期化
}
// #endregion

// #region socket event handler
// サーバから受信した入室メッセージ画面上に表示する
const onReceiveEnter = (data) => {
  chatList.unshift(`import ${data}さん // ${data}が入室しました。`);
}

// サーバから受信した退室メッセージを受け取り画面上に表示する
const onReceiveExit = (data) => {
  chatList.unshift(`export ${data}さん // ${data}が退出しました。`);
}

// サーバから受信した投稿メッセージを画面上に表示する
const onReceivePublish = (data) => {
  chatList.unshift(`{${data.user}: "${data.message}"}`);
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

  // socket.on("subjectAssigned", (data) => {
  //   if (data.name === userName.value) {
  //     alert(`あなたのお題は ${data.subject} です`);　//お題を通知
  //   }
  // })
  socket.on("startGame", (game) => {
    userList.length = 0;
    userList.push(...game.users)

    wolf = game.wolf;
    inGame.value = true;
    console.log(userList)
    userList.map(user => {
      if (user.name === userName.value) {
        subject.value = user.subject;
        alert(`あなたのお題は ${subject.value} です`);　//お題を通知
      }
    })
    // userList.value.forEach((user) => {
    //   if (user.name === userName.value) {
    //     subject.value = user.subject;
    //     alert(`あなたのお題は ${user.subject} です`);　//お題を通知
    //   }
    // })
  })

  socket.on("timerUpdate", (timeLeft) => {
    remainingTime.value = timeLeft;　// タイマーの残り時間を更新
  })

  socket.on("timerEnd", () => {
    alert("タイムアップ！投票を開始してください。");　// タイマー終了時に通知
    // 投票フェーズへ
    initiateVoting();
  })



  socket.on("votingEnd", (corpse) => {
    isVoteOpen.value = false;　// 投票ダイアログを閉じる
    isVoteWaiting.value = false;　// 投票待機中フラグをfalseに
    isVoteEnded.value = true;　// 投票終了フラグをtrueに
    winner.value = getWinner(corpse)　// 投票の結果を表示
    inGame.value = false;　// ゲーム終了
  })

  socket.on("votingUpdate", (timeLeft) => {
    console.log(timeLeft);
    voteRemainingTime.value = timeLeft;　// 投票時間の残り時間を更新
  })
}

// #endregion

//ikki: ここから下にゲームの進行部分を実装

//ゲームの進行を行う関数
//開始ボタン押下がトリガー
const promptTrigger = () => {

  if (promptInput.value.startsWith('memo ')) {
    promptInput.value = promptInput.value.replace('memo ', '');
    onMemo(promptInput.value);
  } else if (promptInput.value === 'game start' ) {
    if (isHost.value) {
      processGame();
    } else {
      alert('ホスト以外はゲームを開始できません');
    }

  } else if (promptInput.value === 'exit') {
    if (isHost.value) {
      alert('ホストは退出できません');
    } else if(inGame.value) {
      alert('ゲーム中は退出できません');
    } else {
      onExit();
      router.push('/')
    }
  } else {
    onPublish(promptInput.value);
  }
  terminal.push(promptInput.value);
  promptInput.value = '';
}

const processGame = () => {

  //ゲーム開始処理（入退室を制限）
  if (userList.length < 3) {
    alert('ゲーム開始には3人以上のプレイヤーが必要です')
    return
  }

  socket.emit('startGame', 0.2) // ゲームを開始

  // //Gameクラスをインスタンス化
  // const game = new Game(userList);
  // const usersWithSubjects = game.users;
  // wolf = game.wolf
  // usersWithSubjects.forEach(user => {
  //   socket.emit('subjectAssigned', { name: user.name, subject: user.subject });　// 各ユーザにお題を通知
  // });

  // if (isHost.value) {
  //   socket.emit("startTimer", 0.1)　//　5分のタイマーを作成
  // }

  alert('ゲームを開始しました！お題を確認してください。');
}

// 投票フェーズを開始する関数
const initiateVoting = () => {
  socket.emit('initiateVoting',0.5);　// 30秒の投票時間を設定
  isVoteOpen.value = true;　// 投票ダイアログを表示
}

// 投票を送信
const onVoteHandler = (selectedPlayer) => {
  if (selectedPlayer === '') {
    alert('投票対象を選択してください');
    return;
  }
  socket.emit('votingEvent', { voter: userName.value, votee: selectedPlayer });
  isVoteOpen.value = false;　// 投票ダイアログを閉じる
  isVoteWaiting.value = true;　// 投票待機中フラグをtrueに
  isVoteEnded.value = false;　// 投票終了フラグをfalseに
}
</script>

<template>
  <!-- 投票用ダイアログの表示 -->


  <v-dialog v-model="isVoteOpen" width="auto" activator persistent>
    <v-card>
      <v-card-title>Who is the Wolf?</v-card-title>
      <!-- <p>投票残り時間: {{ Math.floor(voteRemainingTime / 60) }}分{{ voteRemainingTime % 60 }}秒</p> -->
      <select v-model="selectedPlayer">
      <option v-for="(user, index) in userList" 
        v-bind:value="index" 
        v-bind:key="index">
      {{ user.name }}
      </option>
      </select>
      <v-card-actions>
        <v-btn color="primary" block @click="onVoteHandler(selectedPlayer)"
          >Vote</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- 投票待ちダイアログの表示 -->
  <v-dialog v-model="isVoteWaiting" width="auto" activator persistent>
    <v-card>
      <v-card-title>
        他の人の投票を待っています
      </v-card-title>
    <!-- <p>投票残り時間: {{ Math.floor(voteRemainingTime / 60) }}分{{ voteRemainingTime % 60 }}秒</p> -->
  </v-card>
  </v-dialog>

  <!-- ゲーム結果ダイアログの表示 -->
  <v-dialog v-model="isVoteEnded" width="auto" activator persistent>
    <v-card>
      <v-card-title>{{ winner }} win!</v-card-title>
      <ul>
        <li v-for="(user, index) in userList" :key="index">
          {{ user.name }}: "{{ user.subject }}"
        </li>
      </ul>
      <v-card-actions>
        <v-btn color="primary" block @click="isVoteEnded = !isVoteEnded"
          >close</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
  <header>
    <p>{{ subject }}</p>
    <div v-if="remainingTime > 0">
        <p>残り時間: {{ Math.floor(remainingTime / 60) }}分{{ remainingTime % 60 }}秒</p>
      </div>
  </header>
  <div>
  <p>{{ userList.length }} people</p>
  <ul v-for="(user, i) in userList" :key="i">
    <li><span v-if="userName === user.name">*</span>{{ user.name }}<span v-if="isHost && userName === user.name">（ホスト）</span></li>
  </ul>
  </div>
  <div class="mx-auto my-5 px-4">
    <h1 class="text-h3 font-weight-medium">Vue.js Chat チャットルーム</h1>
    <div class="mt-10">
      <!-- <p>ログインユーザ：{{ userName }}さん</p> -->
      <!-- <textarea v-model="chatContent" variant="outlined" placeholder="投稿文を入力してください" rows="4" class="area"></textarea>
      <div class="mt-5">
        <button @click="onPublish" class="button-normal">投稿</button>
        <button @click="onMemo" class="button-normal util-ml-8px">メモ</button>
        <button v-if="isHost" @click="processGame" class="button-normal">ゲーム開始</button>
      </div> -->
      <div class="mt-5" v-if="chatList.length !== 0">
        <ul>
          <li class="item mt-4" v-for="(chat, i) in chatList" :key="i">{{ chat }}</li>
        </ul>
      </div>
      <div>
        <p>TERMINAL</p>
        <ul v-for="(line, i) in terminal">
          <li>{{ userName }}$ {{ line }}</li>
        </ul>
        <p>{{ userName }}$ <input type="text" v-model="promptInput" @keyup.enter="promptTrigger"></p>
      </div>
    </div>
    <!-- <router-link to="/" class="link">
      <button type="button" class="button-normal button-exit" @click="onExit">退室する</button>
    </router-link> -->
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
