//maxまでの整数値での乱数を生成
//wolfの割り当てで使用
import subjects from '../subject/subjects.json';

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function getSubject() {
  // ランダムでsubjectsからお題を選択
  const subjectSelectedIndex = getRandomInt(subjects.subjects.length);
  return subjects.subjects[subjectSelectedIndex];
}

// ゲームオブジェクトを定義
class Game {
    // ユーザーリスト
    users;

    // どのインデックスのユーザーがwolfか
    wolf;

    constructor(users) {
        //ユーザーが二人以下ならエラー発生
        if (users.length < 3) {
            throw new Error("二人以下でワードウルフはできません");
        }

        this.users = users
        // wolfを何番目のユーザーにするかを決める
        this.#assignWolf()
        this.#distributeSubject()
    }

    //wolfの割り当てを行う
    #assignWolf() {
        const max = this.users.length
        this.wolf = getRandomInt(max)
    }

    //ユーザーにお題を割り当て
    #distributeSubject() {
        const editedUsers = [];
        const subject = getSubject();
        for (let i = 0; i < this.users.length; i++) {
          const user = this.users[i];
          if (this.wolf === i) {
            user.subject = subject.wolf;
            user.isWolf = true;
          } else {
            user.subject = subject.common;
            user.isWolf = false;
          }
          editedUsers.push(user);
        }
        this.users = editedUsers;
      }
    }

    export default Game;
