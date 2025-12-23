import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Signup from './pages/Signup'
import Login from './pages/Login'
import { ChatPage } from './pages/chat/ChatPage'
import { RandomChat } from './pages/chat/RandomChat'
import { FriendsList } from './pages/chat/FriendsList'
import { FriendChat } from './pages/chat/FriendChat'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route path="/chat" element={<ChatPage />}>
        <Route index element={<RandomChat />} />
        <Route path="friends" element={<FriendsList />} />
        <Route path="friend/:id" element={<FriendChat />} />
      </Route>
    </Routes>
  )
}

export default App