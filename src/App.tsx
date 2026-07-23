import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/cn'
import { Users, UserPlus, MessageCircle, Search, UserMinus, Send, Home, LogOut, ChevronLeft, Plus, Calendar, MapPin, Star } from 'lucide-react'

interface Friend { id: string; name: string; email: string; addedAt: number }
interface Message { id: string; senderEmail: string; senderName: string; text: string; timestamp: number }
interface Activity { id: string; title: string; description: string; date: string; location: string; createdBy: string; createdAt: number; attendees: string[] }

function generateId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8) }
function getCurrUser() { try { return JSON.parse(localStorage.getItem('land-user') || 'null') } catch { return null } }
function getFriendsList(email: string): Friend[] { try { return JSON.parse(localStorage.getItem('land-friends-' + email) || '[]') } catch { return [] } }
function saveFriendsList(email: string, f: Friend[]) { localStorage.setItem('land-friends-' + email, JSON.stringify(f)) }
function getAllUsersData(): Record<string, { email: string; name: string }> { try { return JSON.parse(localStorage.getItem('land-users') || '{}') } catch { return {} } }
function getMessages(e1: string, e2: string): Message[] { const key = [e1, e2].sort().join('::'); try { return JSON.parse(localStorage.getItem('land-msg-' + key) || '[]') } catch { return [] } }
function saveMessages(e1: string, e2: string, m: Message[]) { const key = [e1, e2].sort().join('::'); localStorage.setItem('land-msg-' + key, JSON.stringify(m)) }
function getActivities(): Activity[] { try { return JSON.parse(localStorage.getItem('land-activities') || '[]') } catch { return [] } }
function saveActivities(a: Activity[]) { localStorage.setItem('land-activities', JSON.stringify(a)) }

function FriendsTab() {
  const user = getCurrUser()
  const [friends, setFriends] = useState<Friend[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<{ email: string; name: string }[]>([])
  const [msg, setMsg] = useState('')

  useEffect(() => { if (user?.email) setFriends(getFriendsList(user.email)) }, [user])
  const showMsg = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  const handleSearch = () => {
    if (!searchQuery.trim()) { setSearchResults([]); return }
    const allUsers = getAllUsersData()
    const myEmail = user?.email?.toLowerCase()
    const q = searchQuery.toLowerCase()
    setSearchResults(Object.entries(allUsers)
      .filter(([email, data]) => email !== myEmail && !friends.some(f => f.email === email) && (email.includes(q) || data.name.toLowerCase().includes(q)))
      .map(([email, data]) => ({ email, name: data.name })))
  }

  const addFriend = (email: string, name: string) => {
    const f: Friend = { id: generateId(), name, email, addedAt: Date.now() }
    const updated = [...friends, f]; setFriends(updated); saveFriendsList(user.email, updated)
    setSearchResults(prev => prev.filter(r => r.email !== email)); showMsg('เพิ่ม ' + name + ' เป็นเพื่อนแล้ว!')
  }

  const removeFriend = (email: string, name: string) => {
    const updated = friends.filter(f => f.email !== email); setFriends(updated); saveFriendsList(user.email, updated); showMsg('ลบ ' + name + ' ออกแล้ว')
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold flex items-center gap-2"><Users className="h-5 w-5 text-emerald-400" /> เพื่อนของคุณ ({friends.length})</h2>
      {msg && <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm">{msg}</div>}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 pl-10 text-sm text-white" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="ค้นหาเพื่อน..." />
        </div>
        <button onClick={handleSearch} className="px-4 py-2 bg-emerald-600 rounded-lg hover:bg-emerald-500 transition text-sm">ค้นหา</button>
      </div>
      {searchResults.length > 0 && (
        <div className="space-y-2">
          {searchResults.map(r => (
            <div key={r.email} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm font-medium">{r.name.charAt(0)}</div>
                <div><p className="text-sm font-medium">{r.name}</p><p className="text-xs text-slate-400">{r.email}</p></div>
              </div>
              <button onClick={() => addFriend(r.email, r.name)} className="px-3 py-1 bg-emerald-600 rounded-lg hover:bg-emerald-500 text-sm flex items-center gap-1"><UserPlus className="h-3 w-3" /> เพิ่ม</button>
            </div>
          ))}
        </div>
      )}
      <div className="space-y-2">
        {friends.length === 0 ? <p className="text-slate-500 text-center py-6">ยังไม่มีเพื่อน</p> : friends.map(f => (
          <div key={f.id} className="flex items-center justify-between p-3 bg-slate-800 border border-slate-700 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-medium">{f.name.charAt(0)}</div>
              <div><p className="font-medium">{f.name}</p><p className="text-xs text-slate-400">{f.email}</p></div>
            </div>
            <button onClick={() => removeFriend(f.email, f.name)} className="p-2 text-slate-400 hover:text-red-400 transition"><UserMinus className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </div>
  )
}

function ChatTab() {
  const user = getCurrUser()
  const [friends, setFriends] = useState<Friend[]>([])
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMsg, setNewMsg] = useState('')
  const chatEnd = useRef<HTMLDivElement>(null)

  useEffect(() => { if (user?.email) setFriends(getFriendsList(user.email)) }, [user])
  useEffect(() => { if (selectedFriend && user?.email) setMessages(getMessages(user.email, selectedFriend.email)) }, [selectedFriend, user])
  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const sendMessage = () => {
    if (!newMsg.trim() || !selectedFriend || !user) return
    const msg: Message = { id: generateId(), senderEmail: user.email, senderName: user.name, text: newMsg.trim(), timestamp: Date.now() }
    const updated = [...messages, msg]; setMessages(updated); saveMessages(user.email, selectedFriend.email, updated); setNewMsg('')
  }

  if (!selectedFriend) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-2"><MessageCircle className="h-5 w-5 text-blue-400" /> เลือกเพื่อนคุย</h2>
        {friends.length === 0 ? <p className="text-slate-500 text-center py-6">เพิ่มเพื่อนก่อนแล้วค่อยคุย</p> : (
          <div className="space-y-2">
            {friends.map(f => (
              <button key={f.id} onClick={() => setSelectedFriend(f)} className="w-full flex items-center gap-3 p-3 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-750 transition text-left">
                <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-medium">{f.name.charAt(0)}</div>
                <div><p className="font-medium">{f.name}</p><p className="text-xs text-slate-400">{f.email}</p></div>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      <div className="flex items-center gap-3 pb-3 border-b border-slate-700 mb-3">
        <button onClick={() => setSelectedFriend(null)} className="p-1 text-slate-400 hover:text-white"><ChevronLeft className="h-5 w-5" /></button>
        <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-sm font-medium">{selectedFriend.name.charAt(0)}</div>
        <span className="font-medium">{selectedFriend.name}</span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-3 mb-3">
        {messages.length === 0 && <p className="text-slate-500 text-center py-8">เริ่มคุยกันเลย!</p>}
        {messages.map(m => (
          <div key={m.id} className={cn('flex', m.senderEmail === user?.email ? 'justify-end' : 'justify-start')}>
            <div className={cn('max-w-[75%] px-3 py-2 rounded-2xl text-sm', m.senderEmail === user?.email ? 'bg-emerald-600 text-white rounded-br-sm' : 'bg-slate-700 text-white rounded-bl-sm')}>
              <p>{m.text}</p>
              <p className="text-[10px] opacity-60 mt-1">{new Date(m.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        ))}
        <div ref={chatEnd} />
      </div>
      <div className="flex gap-2">
        <input className="flex-1 bg-slate-700 border border-slate-600 rounded-full px-4 py-2 text-sm text-white" value={newMsg} onChange={(e) => setNewMsg(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} placeholder="พิมพ์ข้อความ..." />
        <button onClick={sendMessage} className="p-2 bg-emerald-600 rounded-full hover:bg-emerald-500 transition"><Send className="h-4 w-4" /></button>
      </div>
    </div>
  )
}

function ActivitiesTab() {
  const user = getCurrUser()
  const [activities, setActivities] = useState<Activity[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [date, setDate] = useState('')
  const [location, setLocation] = useState('')

  useEffect(() => { setActivities(getActivities()) }, [])

  const createActivity = () => {
    if (!title.trim() || !date) return
    const a: Activity = { id: generateId(), title: title.trim(), description: desc, date, location, createdBy: user?.name || 'Anonymous', createdAt: Date.now(), attendees: [user?.email || ''] }
    const updated = [a, ...activities]; setActivities(updated); saveActivities(updated)
    setTitle(''); setDesc(''); setDate(''); setLocation(''); setShowCreate(false)
  }

  const joinActivity = (id: string) => {
    const updated = activities.map(a => a.id === id && !a.attendees.includes(user?.email) ? { ...a, attendees: [...a.attendees, user?.email] } : a)
    setActivities(updated); saveActivities(updated)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2"><Calendar className="h-5 w-5 text-purple-400" /> กิจกรรมชุมชน</h2>
        <button onClick={() => setShowCreate(true)} className="px-3 py-1.5 bg-emerald-600 rounded-lg hover:bg-emerald-500 text-sm flex items-center gap-1"><Plus className="h-3.5 w-3.5" /> สร้างกิจกรรม</button>
      </div>
      {showCreate && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3">
          <input className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ชื่อกิจกรรม" />
          <textarea className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white h-16 resize-none" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="รายละเอียด..." />
          <div className="grid grid-cols-2 gap-2">
            <input type="date" className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white" value={date} onChange={(e) => setDate(e.target.value)} />
            <input className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="สถานที่" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowCreate(false)} className="flex-1 px-3 py-2 bg-slate-700 rounded-lg text-sm">ยกเลิก</button>
            <button onClick={createActivity} disabled={!title.trim() || !date} className="flex-1 px-3 py-2 bg-emerald-600 rounded-lg text-sm disabled:opacity-50">สร้าง</button>
          </div>
        </div>
      )}
      {activities.length === 0 ? <p className="text-slate-500 text-center py-6">ยังไม่มีกิจกรรม</p> : activities.map(a => (
        <div key={a.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-2">
          <div className="flex items-start justify-between">
            <div><h3 className="font-semibold">{a.title}</h3>{a.description && <p className="text-sm text-slate-400 mt-1">{a.description}</p>}</div>
            <div className="flex items-center gap-1 text-xs text-slate-400"><Users className="h-3.5 w-3.5" /> {a.attendees.length}</div>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            {a.date && <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {a.date}</span>}
            {a.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {a.location}</span>}
          </div>
          {!a.attendees.includes(user?.email) && <button onClick={() => joinActivity(a.id)} className="px-3 py-1.5 bg-emerald-600 rounded-lg hover:bg-emerald-500 text-sm">เข้าร่วม</button>}
        </div>
      ))}
    </div>
  )
}

function LoginPage({ onLogin }: { onLogin: (user: { email: string; name: string }) => void }) {
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState(''); const [name, setName] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState('')
  const hash = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0 } return 'h_' + Math.abs(h).toString(36) }

  const handleSubmit = () => {
    setError('')
    if (!email || !password) { setError('กรุณากรอกข้อมูลให้ครบ'); return }
    const users = JSON.parse(localStorage.getItem('land-users') || '{}'); const key = email.toLowerCase().trim()
    if (tab === 'register') {
      if (!name) { setError('กรุณากรอกชื่อ'); return }
      if (password.length < 6) { setError('รหัสผ่านต้องมี 6+ ตัวอักษร'); return }
      if (users[key]) { setError('Email นี้มีอยู่แล้ว'); return }
      users[key] = { email: key, name, passwordHash: hash(password) }; localStorage.setItem('land-users', JSON.stringify(users)); onLogin({ email: key, name })
    } else {
      const stored = users[key]; if (!stored || stored.passwordHash !== hash(password)) { setError('Email หรือรหัสผ่านไม่ถูกต้อง'); return }
      onLogin({ email: key, name: stored.name })
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold flex items-center justify-center gap-2"><Users className="h-6 w-6 text-emerald-400" /> LAND KNUAM</h1>
          <p className="text-slate-400 text-sm mt-1">ชุมชนผู้เรียน</p>
        </div>
        <div className="flex bg-slate-700 rounded-lg p-1 mb-4">
          <button onClick={() => setTab('login')} className={cn('flex-1 py-2 rounded-md text-sm transition', tab === 'login' ? 'bg-emerald-600 text-white' : 'text-slate-400')}>เข้าสู่ระบบ</button>
          <button onClick={() => setTab('register')} className={cn('flex-1 py-2 rounded-md text-sm transition', tab === 'register' ? 'bg-emerald-600 text-white' : 'text-slate-400')}>สมัครสมาชิก</button>
        </div>
        {error && <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm mb-3">{error}</div>}
        <div className="space-y-3">
          {tab === 'register' && <input className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white" value={name} onChange={(e) => setName(e.target.value)} placeholder="ชื่อ" />}
          <input className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" />
          <input className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="รหัสผ่าน" type="password" />
          <button onClick={handleSubmit} className="w-full py-2.5 bg-emerald-600 rounded-lg hover:bg-emerald-500 transition font-medium">{tab === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}</button>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState<{ email: string; name: string } | null>(null)
  const [activeTab, setActiveTab] = useState<'home' | 'friends' | 'chat' | 'activities'>('home')
  useEffect(() => { const saved = getCurrUser(); if (saved) setUser(saved) }, [])
  const handleLogin = (u: { email: string; name: string }) => { localStorage.setItem('land-user', JSON.stringify(u)); setUser(u) }
  const handleLogout = () => { localStorage.removeItem('land-user'); setUser(null); setActiveTab('home') }
  if (!user) return <LoginPage onLogin={handleLogin} />

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <h1 className="font-bold flex items-center gap-2"><Users className="h-5 w-5 text-emerald-400" /> LAND KNUAM</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400">{user.name}</span>
          <button onClick={handleLogout} className="p-1.5 text-slate-400 hover:text-red-400 transition"><LogOut className="h-4 w-4" /></button>
        </div>
      </header>
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        {activeTab === 'home' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-emerald-600/20 to-blue-600/20 border border-emerald-500/30 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-2">สวัสดี {user.name}!</h2>
              <p className="text-slate-300 text-sm">ยินดีต้อนรับสู่ชุมชนผู้เรียน KNUAM</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setActiveTab('friends')} className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-left hover:bg-slate-750 transition">
                <Users className="h-8 w-8 text-emerald-400 mb-2" /><h3 className="font-semibold">เพื่อน</h3><p className="text-xs text-slate-400">เพิ่มและจัดการเพื่อน</p>
              </button>
              <button onClick={() => setActiveTab('chat')} className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-left hover:bg-slate-750 transition">
                <MessageCircle className="h-8 w-8 text-blue-400 mb-2" /><h3 className="font-semibold">แชท</h3><p className="text-xs text-slate-400">พูดคุยกับเพื่อน</p>
              </button>
              <button onClick={() => setActiveTab('activities')} className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-left hover:bg-slate-750 transition">
                <Calendar className="h-8 w-8 text-purple-400 mb-2" /><h3 className="font-semibold">กิจกรรม</h3><p className="text-xs text-slate-400">เข้าร่วมกิจกรรมชุมชน</p>
              </button>
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                <Star className="h-8 w-8 text-slate-600 mb-2" /><h3 className="font-semibold text-slate-500">เร็วๆ นี้</h3><p className="text-xs text-slate-600">ฟีเจอร์ใหม่กำลังมา</p>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'friends' && <FriendsTab />}
        {activeTab === 'chat' && <ChatTab />}
        {activeTab === 'activities' && <ActivitiesTab />}
      </main>
      <nav className="bg-slate-900 border-t border-slate-800 px-4 py-2 flex justify-around">
        {[{ key: 'home', icon: Home, label: 'หน้าแรก' }, { key: 'friends', icon: Users, label: 'เพื่อน' }, { key: 'chat', icon: MessageCircle, label: 'แชท' }, { key: 'activities', icon: Calendar, label: 'กิจกรรม' }].map((item) => (
          <button key={item.key} onClick={() => setActiveTab(item.key as typeof activeTab)} className={cn('flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition', activeTab === item.key ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300')}>
            <item.icon className="h-5 w-5" /><span className="text-[10px]">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}