import { useState } from 'react'
import { useAuth } from '../lib/nostr'
import { LoginButton } from '../components'

// Known NIP-05 providers to search
const NIP05_PROVIDERS = [
  { domain: 'cloistr.xyz', name: 'Cloistr' },
  { domain: 'primal.net', name: 'Primal' },
  { domain: 'nostr.band', name: 'Nostr.band' },
  { domain: 'snort.social', name: 'Snort' },
  { domain: 'iris.to', name: 'Iris' },
  { domain: 'nostrplebs.com', name: 'Nostr Plebs' },
  { domain: 'getalby.com', name: 'Alby' },
  { domain: 'stacker.news', name: 'Stacker News' },
]

interface SearchResult {
  username: string
  domain: string
  pubkey: string
  relays?: string[]
  provider: string
}

// Fuzzy match function - returns true if query matches username loosely
function fuzzyMatch(query: string, username: string): boolean {
  query = query.toLowerCase()
  username = username.toLowerCase()

  // Exact match
  if (username === query) return true

  // Contains match
  if (username.includes(query) || query.includes(username)) return true

  // Levenshtein distance for typos (simple version)
  if (query.length >= 3 && username.length >= 3) {
    const distance = levenshteinDistance(query, username)
    const maxLen = Math.max(query.length, username.length)
    // Allow ~30% difference
    if (distance / maxLen < 0.3) return true
  }

  return false
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  return matrix[b.length][a.length]
}

async function queryNip05Provider(
  domain: string,
  providerName: string,
  searchQuery: string
): Promise<SearchResult[]> {
  try {
    // First try exact match
    const exactUrl = `https://${domain}/.well-known/nostr.json?name=${encodeURIComponent(searchQuery)}`
    const exactResponse = await fetch(exactUrl, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(5000)
    })

    if (exactResponse.ok) {
      const data = await exactResponse.json()
      const results: SearchResult[] = []

      if (data.names && typeof data.names === 'object') {
        for (const [username, pubkey] of Object.entries(data.names)) {
          if (typeof pubkey === 'string' && fuzzyMatch(searchQuery, username)) {
            results.push({
              username,
              domain,
              pubkey,
              relays: data.relays?.[pubkey as string],
              provider: providerName,
            })
          }
        }
      }

      return results
    }
  } catch (e) {
    // Silently fail for individual providers
    console.debug(`Failed to query ${domain}:`, e)
  }

  return []
}

export function Lookup() {
  const auth = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null)

  const handleSearch = async () => {
    const query = searchQuery.trim().toLowerCase()
    if (!query || query.length < 2) return

    // Remove @domain if user included it
    const cleanQuery = query.split('@')[0]

    setIsSearching(true)
    setHasSearched(true)
    setResults([])
    setSelectedResult(null)

    // Query all providers in parallel
    const allResults = await Promise.all(
      NIP05_PROVIDERS.map(p => queryNip05Provider(p.domain, p.name, cleanQuery))
    )

    // Flatten and dedupe by pubkey+domain
    const flatResults = allResults.flat()
    const seen = new Set<string>()
    const uniqueResults = flatResults.filter(r => {
      const key = `${r.pubkey}@${r.domain}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    // Sort: exact matches first, then by provider order
    uniqueResults.sort((a, b) => {
      const aExact = a.username.toLowerCase() === cleanQuery
      const bExact = b.username.toLowerCase() === cleanQuery
      if (aExact && !bExact) return -1
      if (!aExact && bExact) return 1
      return 0
    })

    setResults(uniqueResults)
    setIsSearching(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const formatPubkey = (pubkey: string): string => {
    if (pubkey.length <= 16) return pubkey
    return `${pubkey.slice(0, 8)}...${pubkey.slice(-8)}`
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (e) {
      console.error('Failed to copy:', e)
    }
  }

  return (
    <div className="page lookup-page">
      <header className="header">
        <div className="header-content">
          <a href="/" className="logo">
            <img src="/cloistr-logo.svg" alt="Cloistr" className="logo-img" />
          </a>
          <nav className="nav">
            <a href="/register" className="nav-link">Get Address</a>
            {auth.state.pubkey && (
              <a href="/dashboard" className="nav-link">Dashboard</a>
            )}
            <LoginButton />
          </nav>
        </div>
      </header>

      <main className="main">
        <section className="hero">
          <h1 className="hero-title">Look Up Address</h1>
          <p className="hero-subtitle">
            Search for Nostr identities across multiple providers
          </p>
        </section>

        <section className="search-section">
          <div className="search-box">
            <input
              type="text"
              className="search-input"
              placeholder="Enter username (e.g., alice)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button
              className="btn btn-primary"
              onClick={handleSearch}
              disabled={isSearching || searchQuery.trim().length < 2}
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>
          <p className="search-hint">
            Searches {NIP05_PROVIDERS.length} NIP-05 providers including Cloistr, Primal, Snort, and more
          </p>
        </section>

        {hasSearched && (
          <section className="results-section">
            {results.length > 0 ? (
              <>
                <h2 className="results-title">
                  Found {results.length} result{results.length !== 1 ? 's' : ''}
                </h2>
                <div className="results-list">
                  {results.map((result, index) => (
                    <div
                      key={`${result.pubkey}-${result.domain}-${index}`}
                      className={`result-card ${selectedResult?.pubkey === result.pubkey && selectedResult?.domain === result.domain ? 'selected' : ''}`}
                      onClick={() => setSelectedResult(result)}
                    >
                      <div className="result-address">
                        <span className="result-username">{result.username}</span>
                        <span className="result-domain">@{result.domain}</span>
                      </div>
                      <div className="result-provider">{result.provider}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="no-results">
                {!isSearching && (
                  <>
                    <p>No addresses found matching "{searchQuery}"</p>
                    <p className="no-results-hint">
                      Want this address? <a href="/register">Register it on Cloistr</a>
                    </p>
                  </>
                )}
              </div>
            )}
          </section>
        )}

        {selectedResult && (
          <section className="profile-section">
            <div className="profile-card">
              <h3 className="profile-address">
                {selectedResult.username}@{selectedResult.domain}
              </h3>

              <div className="profile-field">
                <label>Public Key (hex)</label>
                <div className="profile-value">
                  <code>{formatPubkey(selectedResult.pubkey)}</code>
                  <button
                    className="btn-copy"
                    onClick={() => copyToClipboard(selectedResult.pubkey)}
                    title="Copy full pubkey"
                  >
                    Copy
                  </button>
                </div>
              </div>

              {selectedResult.relays && selectedResult.relays.length > 0 && (
                <div className="profile-field">
                  <label>Recommended Relays</label>
                  <ul className="relay-list">
                    {selectedResult.relays.map((relay, index) => (
                      <li key={index}>{relay}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="profile-actions">
                <a
                  href={`https://njump.me/${selectedResult.pubkey}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                >
                  View on njump.me
                </a>
                <a
                  href={`https://primal.net/p/${selectedResult.pubkey}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                >
                  View on Primal
                </a>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="footer">
        <p>Part of the <a href="https://cloistr.xyz">Cloistr</a> ecosystem</p>
      </footer>
    </div>
  )
}
