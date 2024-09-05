class User {
    static userCount = 0;
    id;
    name;
    isHost;
    isWolf;
    subject;
    constructor(name, isHost) {
        this.id = User.userCount++;
        this.name = name
        this.isHost = isHost
    }
}
export default User;
