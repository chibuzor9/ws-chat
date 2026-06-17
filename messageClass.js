// messageClass.js
class message {
    constructor(idOrOptions, type, content) {
        if (typeof idOrOptions === "object") {
            this.sender = idOrOptions.uid || null
            this.type = idOrOptions.type;
            this.content = idOrOptions.content;
        } else {
             this.uid = idOrOptions;
             this.type = type;
             this.content = content;
        }
    }

    static TYPES = {
        INIT: "init",
        CHAT: "chat",
        PING: "ping",
        PONG: "pong"
    };
};

export default message;
