// messageClass.js
class message {
    constructor(typeOrOptions, content) {
        if (typeof typeOrOptions === "object") {
            this.type = typeOrOptions.type;
            this.content = typeOrOptions.content;
        } else {
             this.type = typeOrOptions;
             this.content = content;
        }
    }

    static TYPES = {
        INIT: "init",
        CHAT: "chat",
        PING: "ping",
        PONG: "pong",
        ERROR: "error"
    };
};

export default message;
