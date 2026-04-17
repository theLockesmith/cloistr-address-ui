import { Router, Route } from '@solidjs/router';
import { AuthContext, createAuthStore } from './lib/nostr';
import { Welcome, Register, Purchase, Success, Dashboard, NotFound } from './pages';
import './index.css';

function App() {
  const authStore = createAuthStore();

  return (
    <AuthContext.Provider value={authStore}>
      <Router>
        <Route path="/" component={Welcome} />
        <Route path="/register" component={Register} />
        <Route path="/purchase/:username" component={Purchase} />
        <Route path="/success/:username" component={Success} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="*" component={NotFound} />
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
