import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginEmployee } from "../api/authApi";
import { login } from "../utils/auth";

export default function LoginPage() {
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await loginEmployee(employeeId);
      const userRole = (data.role || "EMPLOYEE").toUpperCase();

      login({
        employee_id: data.employee_id || employeeId,
        employee_name: data.employee_name,
        role: userRole,
      });

      if (userRole === "DEPT_HEAD") {
        navigate("/dept-head/manager", { replace: true });
      } else if (userRole === "LOC_HEAD") {
        navigate("/loc-head/manager", { replace: true });
      } else if (userRole === "TRANSFER_HEAD") {
        navigate("/transfer-head/manager", { replace: true });
      } else {
        navigate("/employee/dashboard", { replace: true });
      }
    } catch (err) {
      console.error("Login failure:", err);
      const errorMessage =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Unable to sign in with that employee ID.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f8fafc] px-4">
      <div className="w-full max-w-md bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-100 p-8">
        {/* Brand Header Group */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#e0ecfb] flex items-center justify-center text-[#2563eb] font-bold text-lg">
            o
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">
              ONGC Login
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Light, clean access for the workforce portal.
            </p>
          </div>
        </div>

        {/* Error Banner Alert */}
        {error && (
          <div className="mb-4 p-3 text-xs bg-rose-50 border border-rose-100 text-rose-600 rounded-lg">
            {error}
          </div>
        )}

        {/* Main Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="employeeId"
              className="block text-sm font-semibold text-slate-700 mb-1.5"
            >
              Employee ID
            </label>
            <input
              id="employeeId"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              required
              placeholder="Enter your employee ID"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value.replace(/\D/g, ""))}
              disabled={loading}
              className="w-full bg-[#f1f5f9] border border-transparent focus:border-slate-200 focus:bg-white text-slate-800 placeholder-slate-400 text-sm rounded-lg px-4 py-3 transition-all outline-hidden"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-slate-700 mb-1.5"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full bg-[#f1f5f9] border border-transparent focus:border-slate-200 focus:bg-white text-slate-800 placeholder-slate-400 text-sm rounded-lg px-4 py-3 transition-all outline-hidden"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#4472c4] hover:bg-[#365f9d] active:bg-[#2d4f82] text-white text-sm font-semibold py-3 px-4 rounded-lg shadow-sm transition-colors focus:outline-hidden disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed mt-2"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {/* Footer Subtext Link Support */}
        <p className="text-xs text-slate-400 text-left mt-6">
          Need help? Contact IT support or your team lead.
        </p>
      </div>
    </div>
  );
}
