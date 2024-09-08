<script setup>
import { inject, ref } from "vue"
import { useRouter } from "vue-router"
import socketManager from '../socketManager.js'

// #region global state
const userName = inject("userName")
// #endregion

// #region local variable
const router = useRouter()
const socket = socketManager.getInstance()
// #endregion

// #region reactive variable
const inputUserName = ref("")
// #endregion

// #region browser event handler
// 入室メッセージをクライアントに送信する
const onEnter = () => {
  // ユーザー名が入力されているかチェック
  if (inputUserName.value.trim() === "") {
    alert("ユーザー名を入力してください");
    return;
  }
  // 入室メッセージを送信
  socket.emit("enterEvent", inputUserName.value);
  // 全体で使用するnameに入力されたユーザー名を格納
  userName.value = inputUserName.value;
  // チャット画面へ遷移
  router.push({ name: "chat" })
}
// #endregion
</script>

<template>
  <div class="min-h-screen w-full flex justify-center items-center bg-gray">
    <div class="text-center">
      <!-- タイトル -->
      <h1 class="text-8xl font-newRocker text-white mb-16">Word Wolf</h1>

      <!-- 入力欄 -->
      <div class="flex items-center text-lg text-white mb-12">
        <span class="text-purple-500 text-5xl">const</span>
        <span class="mx-4 text-yellow-500 text-5xl">user_name</span>
        <span class="mx-4 text-5xl">=</span>
        <input type="text" v-model="inputUserName"
          class="w-64 h-12 bg-transparent border-4 border-solid border-white text-white pl-4 focus:outline-none text-4xl" />
      </div>

      <!-- ボタン -->
      <div class="flex justify-center">
        <button @click="onEnter" class="flex items-center text-5xl cursor-pointer">
          <span class="text-white">&lt;</span>
          <span class="text-red-500 mx-4">button</span>
          <span class="text-white">&gt;</span>
          <span class="mx-8 text-white">Start</span>
          <span class="text-white">&lt;/</span>
          <span class="text-red-500 mx-4">button</span>
          <span class="text-white">&gt;</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=New+Rocker&display=swap');

/* カスタムフォントの定義 */
.font-newRocker {
  font-family: 'New Rocker', cursive;
}
</style>
