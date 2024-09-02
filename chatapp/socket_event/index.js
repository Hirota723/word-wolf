import Timer from '../src/lib/class/timer.js';
let userList = [];

export default (io, socket) => {
  // 入室メッセージをクライアントに送信する
  socket.on("enterEvent", (data) => {
    const newUser = { name: data, isHost: userList.length === 0 };
    userList.push(newUser);
    io.sockets.emit("updateUserList", userList);
  });

  // 退室メッセージをクライアントに送信する
  socket.on("exitEvent", (data) => {
    const index = userList.findIndex(user => user.name === data);
    let removedUser;
    if (index !== -1) {
      removedUser = userList.splice(index, 1)[0];
    }

    if (removedUser && removedUser.isHost && userList.length > 0) {
      userList[0].isHost = true;
    }

    io.sockets.emit("updateUserList", userList);
  });

  // 投稿メッセージを送信する
  socket.on("publishEvent", (data) => {
    io.sockets.emit("publishEvent", data);
  });

  // 全クライアントにお題を送信
  socket.on('subjectAssigned', (data) => {
    io.sockets.emit('subjectAssigned', data);  // 全クライアントに送信
  });

  // タイマーをスタートしカウントダウンを送信する
  socket.on("startTimer", (duration) => {
    const timer = new Timer(duration);  // Timer クラスを使用して新しいタイマーを作成

    timer.start(() => {
      io.sockets.emit("timerEnd");  // タイマー終了時に通知を送信
    }, (remainingTime) => {
      io.sockets.emit("timerUpdate", remainingTime);  // 残り時間をクライアントに送信
    });
  });
}
