import Sidebar from "./components/sidebar/Sidebar"
import ChatView from "./components/chat/ChatView"

function App() {

    return (
        <div className={"flex h-screen w-screen bg-gray-100 split-x-2 lg:split-x-4"}>
            <Sidebar />
            <ChatView />
        </div>
    )
}

export default App
