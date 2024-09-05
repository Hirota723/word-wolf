import Timer from '../src/lib/class/timer.js';
import Game from '../src/lib/class/game.js';
import User from '../src/lib/class/user.js';


let userList = [];
let voteList = [];

var timer
// 投票結果を取得する
const getVoteResult = () => {

  const voteResult = new Array(userList.length).fill(0);

  voteList.forEach(vote => {
    voteResult[vote.votee]++;
  });

  const corpse = voteResult.indexOf(Math.max(...voteResult));
  return corpse;
}

export default (io, socket) => {
  // 入室メッセージをクライアントに送信する
  socket.on("enterEvent", (data) => {
    // 他のクライアントに新しいユーザーの入室を通知
    socket.broadcast.emit("enterEvent", data)
    // 新しいユーザーオブジェクトを作成し、最初のユーザーならホストとして設定
    const user = new User(data, userList.length === 0);
    userList.push(user);
    // 全クライアントに更新されたユーザーリストを送信
    io.sockets.emit("updateUserList", userList);
  });

  socket.on("startGame", (duration) => {
    const game = new Game(userList);
    io.sockets.emit("startGame", game);
    timer = new Timer(duration);
    timer.start(() => {
      io.sockets.emit("timerEnd");
      timer = null
    }, (remainingTime) => {
      io.sockets.emit("timerUpdate", remainingTime);
  })});
  
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

 


  // 投票を開始する
  socket.on("initiateVoting", (duration) => {
    voteList.length = 0
    //  timer = new Timer(duration)
    // timer.start(() => {
    //   const corpse = getVoteResult();
    //   io.sockets.emit("votingEnd", corpse);
    //   timer.stop();
    //   timer = null;
    //   // voteListをクリア
    // }, (remainingTime) => {
    //   io.sockets.emit("votingUpdate", remainingTime);
    // });
  });


  // 投票を受け付ける
  socket.on("votingEvent", (data) => {
    voteList.push(data);
    if (voteList.length === userList.length) {
      // timer.stop()
      // timer = null
      const corpse = getVoteResult();
      io.sockets.emit("votingEnd", corpse);
    }
    console.log(voteList);

  });
}
