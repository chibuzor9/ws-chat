import {useState, React} from 'react';
import Sidebar from "./components/sidebar/Sidebar"
import ChatView from "./components/chat/ChatView"
import UsernameModal from "./components/UsernameModal"

function App() {
    const [username, setUsername] = useState(() => localStorage.getItem("ws-chat:username") ?? "")

    const handleUsernameSubmit = (submittedUsername = "") => {
        const cleanedUsername = submittedUsername.trim()

        const actualUsername =
            cleanedUsername ||
            `anonymous-${crypto.randomUUID().slice(0, 8)}`

        setUsername(actualUsername)
        localStorage.setItem("ws-chat:username", actualUsername)
    }

    return (
        <div className="flex h-dvh w-full overflow-hidden bg-zinc-200">
            <aside className="w-64 shrink-0 border-r border-zinc-700">
                <UsernameModal 
                    open={!username} 
                    onSubmit={handleUsernameSubmit}
                />
                <Sidebar username={username || "anonymous"}/>
            </aside>
            <main className="min-w-0 flex-1">
                <ChatView username={username || "anonymous"} />
            </main>
        </div>
    )
}

export default App
