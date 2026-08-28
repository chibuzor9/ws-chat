//clients messageHandler
import Message from "../../../shared/Message.js";

/*
const errorMessage = (error) => {
    return new Message({
        type: Message.TYPES.ERROR,
        content: error
    });
}
*/

const messageHandler = (message) => { // message string
    const msg = JSON.parse(message);

    const msgType = msg.type;
    const msgContent = msg.content;

    if (!Object.values(Message.TYPES).includes(msgType)) {
        console.error(`Invalid message type: ${msg.type}`);
        return;
    }

    switch (msgType) {
        case Message.TYPES.INIT_ACK:
            return {
                senderId: msgContent.clientId,
                status: "online",
                users: msgContent.users,
                groups: msgContent.groups
            };
        case Message.TYPES.PONG:
            return {
                awaitingPong: false,
                status: "online"
            };
        case Message.TYPES.CHAT: {
            const chatResponse = {
                id: msgContent.messageId,
                kind: msgContent.messageKind,
                senderId: msgContent.senderId,
                receiverId: msgContent.receiverId,
                content: msgContent.content,
                createdAt: msgContent.createdAt
            };

            return { chat: chatResponse};
        }
        case Message.TYPES.CREATE_GROUP: {
            const groupResponse = {
                groupId: msgContent.groupId,
                groupLabel: msgContent.groupLabel
            };

            return {
                group: groupResponse
            };
        }
        case Message.TYPES.FETCH_MESSAGES:
            return {
                conversationId: msgContent.conversationId,
                messages: msgContent.messages
            };
        case Message.TYPES.ERROR:
            console.log(`Error message received: ${msgContent}`);
            break;
        default:
            console.log(`Undefined message type used: ${msgType}`);
    }
};

export default messageHandler;
