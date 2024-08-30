//タイマーを制御するオブジェクト

class Timer {
    minute;
    constructor(minute) {
        this.minute = minute
    }

    start(callback) {
        //　タイマーの表示をコントロール
        var count = 0
        const interval =  setInterval(() => {
            count++
            //この下の3行を消して、タイマーの制御を追加
            console.log(count)
            if (count / 60 > this.minute ) {
                clearInterval(interval)
            }
            
        }, 1000)
        // {minute}分後にcallbackを実行
        setTimeout(callback, this.minute * 1000 * 60)
    }
}