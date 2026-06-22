import '../styles/auth.css'
import { mockRoles } from '../data/mockDb'

export default function LoginPage({ onLogin }) {
  return (
    <div className="login-page">
      <div className="login-card">
          <div className="login-banner">
          <div className="brand-mark">O</div>
          <div>
            <h1>ONGC Login</h1>
            <p>Light, clean access for the workforce portal.</p>
          </div>
        </div>

        <form
          className="login-form"
          onSubmit={(e) => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            onLogin(formData.get('role'))
          }}
        >
          <div className="form-field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" placeholder="you@company.com" />
          </div>

          <div className="form-field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" placeholder="Enter your password" />
          </div>

          <div className="form-field">
            <label htmlFor="role">Role</label>
            <select id="role" name="role" defaultValue="" required>
              <option value="" disabled>
                Select your role
              </option>
              {mockRoles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="login-button">
            Sign in
          </button>
        </form>

        <div className="login-footer">
          <p>Need help? Contact IT support or your team lead.</p>
        </div>
      </div>
    </div>
  )
}
