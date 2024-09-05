//タイマーを制御するオブジェクト

class Timer {
    minute;
    remainingTime;
    intervalId;

    constructor(minute) {
        this.minute = minute;
        this.remainingTime = minute * 60; // 残り時間を秒で計算
    }

    start(callback, onTick) {
        this.intervalId = setInterval(() => {
            this.remainingTime--;
            onTick(this.remainingTime);  // Vueコンポーネントに残り時間を通知

            if (this.remainingTime <= 0) {
                clearInterval(this.intervalId);
                callback();
            }
        }, 1000);
    }

    stop() {
        clearInterval(this.intervalId);
        
    }
}

export default Timer;
