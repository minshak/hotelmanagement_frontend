"use client";
import axios from "axios";
import { useState, useEffect } from "react";
import { User, Lock, Eye, EyeOff, Star } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (localStorage.getItem("isLoggedIn") === "true") {
      router.push("/dashboard");
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevents page reload on form submission

    if (!username || !password) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      setError("");
      setLoading(true);

      const response = await axios.post(
        "http://localhost:8000/api/token/",
        {
          username,
          password,
        }
      );
      const data = response.data;

      console.log("TOKEN RESPONSE:", data);

      if (data.access && data.refresh) {
        localStorage.setItem("access", data.access);
        localStorage.setItem("refresh", data.refresh);
        localStorage.setItem("isLoggedIn", "true");

        router.push("/dashboard");
      } else {
        setError("Invalid response structure from server");
      }
    } catch (error: unknown) {
      console.error(error);
if (axios.isAxiosError(error)) {
  setError(
    error.response?.data?.detail ||
    error.response?.data?.message ||
    "Invalid Username or Password"
  );
} else {
  setError("Something went wrong");

    }} finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#0f0f2d] to-[#1b1464] flex items-center justify-center relative overflow-hidden">
      {/* Logo */}
      <h1 className="absolute top-8 left-8 text-white text-3xl font-bold">
        ZenithHMS
      </h1>

      {/* Login Card */}
      <div className="w-[420px] bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-8 shadow-2xl">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="bg-blue-700 p-4 rounded-full">
            <Star className="text-white" size={24} />
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-white text-4xl font-bold text-center mt-5">
          Welcome Back
        </h2>

        <p className="text-gray-300 text-center mt-2">
          Enter your credentials to access the command center.
        </p>

        {/* Form elements wrapped for clean layout intercept validation */}
        <form onSubmit={handleLogin}>
          {/* Username */}
          <div className="mt-8">
            <label className="text-gray-300 text-sm">Username</label>

            <div className="flex items-center bg-black/30 border border-white/10 rounded-xl mt-2 px-3">
              <User className="text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Property Manager ID"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-transparent p-3 outline-none text-white placeholder-gray-500"
              />
            </div>
          </div>

          {/* Password */}
          <div className="mt-5">
            <label className="text-gray-300 text-sm">Password</label>

            <div className="flex items-center bg-black/30 border border-white/10 rounded-xl mt-2 px-3">
              <Lock className="text-gray-400" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent p-3 outline-none text-white"
              />
              {showPassword ? (
                <Eye
                  size={18}
                  className="text-gray-400 cursor-pointer"
                  onClick={() => setShowPassword(false)}
                />
              ) : (
                <EyeOff
                  size={18}
                  className="text-gray-400 cursor-pointer"
                  onClick={() => setShowPassword(true)}
                />
              )}
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex justify-between items-center mt-4 text-sm">
            <label className="text-gray-300 flex items-center cursor-pointer">
              <input type="checkbox" className="mr-2" />
              Remember device
            </label>

            <a href="#" className="text-blue-400 hover:text-blue-300">
              Forgot Password?
            </a>
          </div>

          {/* Error Rendering */}
          {error && <p className="text-red-400 text-center mt-3 text-sm">{error}</p>}

          {/* Authorization Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full mt-6 py-3 rounded-xl bg-white/10 border border-white/20 backdrop-blur-md text-white font-semibold transition duration-300 ${loading ? "opacity-50 cursor-not-allowed" : "hover:bg-white/20"
              }`}
          >
            {loading ? "Verifying Context..." : "Authorize Access"}
          </button>
        </form>

        {/* Status indicator */}
        <div className="flex justify-center items-center gap-2 mt-8 text-green-400 text-sm">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          SYSTEM STATUS: OPERATIONAL
        </div>
      </div>
    </div>
  );
}