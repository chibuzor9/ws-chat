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
        CHAT: "chat",
        PING: "ping",
        PONG: "pong"
    };
};

export default message;
