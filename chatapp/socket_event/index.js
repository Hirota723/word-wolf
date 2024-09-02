import Timer from '../src/lib/class/timer.js';
let userList = [];

export default (io, socket) => {
  // 入室メッセージをクライアントに送信する
  socket.on("enterEvent", (data) => {
    // 他のクライアントに新しいユーザーの入室を通知
    socket.broadcast.emit("enterEvent", data)
    // 新しいユーザーオブジェクトを作成し、最初のユーザーならホストとして設定
    const newUser = { name: data, isHost: userList.length === 0 };
    userList.push(newUser);
    // 全クライアントに更新されたユーザーリストを送信
    io.sockets.emit("updateUserList", userList);
  });

  // 退室メッセージをクライアントに送信する
  socket.on("exitEvent", (data) => {
    // 他のクライアントに退室を通知
    socket.broadcast.emit("exitEvent", data)
    // 退室するユーザーをリストから削除し、そのユーザーがホストだった場合は新しいホストを設定
    const index = userList.findIndex(user => user.name === data);
    let removedUser;
    if (index !== -1) {
      removedUser = userList.splice(index, 1)[0];
    }
    if (removedUser && removedUser.isHost && userList.length > 0) {
      userList[0].isHost = true;
    }
    // 全クライアントに更新されたユーザーリストを送信
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
