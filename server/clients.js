const clients = new Map();       // clientId -> { id, socket, username, hasInitialized }

const usernameTOID = new Map();  // username -> clientId

const getSocketByUsername = (username) => {
    const clientId = usernameTOID.get(username);

    if (clientId) {
        return clients.get(clientId).socket;  
    }

    return null;
};

export default { clients, usernameTOID, getSocketByUsername };
