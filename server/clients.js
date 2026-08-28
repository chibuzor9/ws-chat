const clients = new Map();       // clientId -> { id, socket, username }

const usernameTOID = new Map();  // username -> clientId

const getSocketByUsername = (username) => {
    const clientId = usernameTOID.get(username);

    if (clientId) {
        return clients.get(clientId)?.socket ?? null;
    }

    return null;
};

const getSocketById = (clientId) => {
    return clients.get(clientId)?.socket ?? null;
};

export default { clients, usernameTOID, getSocketByUsername, getSocketById };
