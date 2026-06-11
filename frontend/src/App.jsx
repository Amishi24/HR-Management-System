import { useState, useEffect } from 'react'
import { supabase } from './utils/supabaseClient' // Ensure this path matches your folder structure
import './App.css'

function App() {
  // 1. State for our database data, loading status, and any potential errors
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState(null)

  // 2. Fetch data from Supabase when the app loads
  useEffect(() => {
    async function fetchLocations() {
      try {
        const { data, error } = await supabase
          .from('location')
          .select('*')

        if (error) throw error

        console.log("Success! Data received:", data)
        setLocations(data || [])
      } catch (error) {
        console.error("Error fetching data:", error.message)
        setErrorMsg(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchLocations()
  }, [])

  // 3. Render the Dashboard UI
  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', textAlign: 'left' }}>
      <h1>HR Manpower Dashboard</h1>
      <p style={{ color: '#888' }}>Live Database Connection Test</p>

      {/* Show Loading State */}
      {loading && <p>Connecting to Supabase cloud...</p>}

      {/* Show Error State if the .env.local fails again */}
      {errorMsg && (
        <div style={{ color: '#ff4a4a', padding: '1rem', border: '1px solid #ff4a4a', borderRadius: '8px', marginTop: '1rem' }}>
          <p><strong>Connection Error:</strong> {errorMsg}</p>
          <p>Please double-check your .env.local file and restart the Vite server.</p>
        </div>
      )}

      {/* Show the Data if successful */}
      {!loading && !errorMsg && (
        <div style={{ background: '#242424', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
          <h3 style={{ borderBottom: '1px solid #444', paddingBottom: '10px', marginTop: 0 }}>
            Active Locations
          </h3>
          
          {locations.length === 0 ? (
            <p style={{ color: '#aaa' }}>Database connected, but no locations found. Tell Developer A to insert "Delhi HQ"!</p>
          ) : (
            <ul style={{ listStyleType: 'none', padding: 0 }}>
              {locations.map((loc) => (
                <li key={loc.id} style={{ margin: '10px 0', padding: '15px', background: '#1a1a1a', borderRadius: '6px', border: '1px solid #333' }}>
                  <strong style={{ fontSize: '1.2rem', color: '#fff' }}>{loc.name}</strong> <br />
                  <small style={{ color: '#666', fontFamily: 'monospace' }}>UUID: {loc.id}</small>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default App