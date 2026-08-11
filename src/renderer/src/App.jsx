import { useEffect, useState } from 'react'
import Login from './screens/Login.jsx'
import CreateFirstUser from './screens/CreateFirstUser.jsx'
import Dashboard from './screens/Dashboard.jsx'

// App-level states:
//   loading        - checking whether any user account exists yet
//   needsFirstUser - no accounts exist; show the one-time setup screen
//   needsLogin     - an account exists; show the login screen
//   authed         - logged in; show the dashboard
export default function App() {
  const [status, setStatus] = useState('loading')
  const [user, setUser] = useState(null)

  useEffect(() => {
    window.api.auth.hasAnyUser().then((exists) => {
      setStatus(exists ? 'needsLogin' : 'needsFirstUser')
    })
  }, [])

  function handleAuthenticated(loggedInUser) {
    setUser(loggedInUser)
    setStatus('authed')
  }

  function handleLogout() {
    setUser(null)
    setStatus('needsLogin')
  }

  if (status === 'loading') {
    return <div className="app-loading">Loading…</div>
  }

  if (status === 'needsFirstUser') {
    return <CreateFirstUser onCreated={handleAuthenticated} />
  }

  if (status === 'needsLogin') {
    return <Login onLogin={handleAuthenticated} />
  }

  return <Dashboard user={user} onLogout={handleLogout} />
}
