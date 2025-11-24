'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { LockClosedIcon, UserIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { authService } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

export default function LoginPage() {
  const login = useAuthStore((state) => state.login);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  // Set mounted state after hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect to dashboard when authenticated (fixes auto-login loop)
  useEffect(() => {
    if (isAuthenticated && typeof window !== 'undefined' && !redirecting) {
      console.log('[LOGIN] User authenticated, redirecting to dashboard...');
      setRedirecting(true);
      // Use replace to prevent back button issues
      window.location.replace('/dashboard');
    }
  }, [isAuthenticated, redirecting]);

  // Parallax effect on mouse move (only after mount)
  useEffect(() => {
    if (!mounted) return;

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mounted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('[LOGIN] Starting login process...');
      
      // Step 1: Login and get token
      console.log('[LOGIN] Calling authService.login()');
      const data = await authService.login(username, password);
      console.log('[LOGIN] Login successful, got token:', data.access_token?.substring(0, 20) + '...');

      // Step 2: Get current user with the token (pass token to ensure we use it)
      console.log('[LOGIN] Fetching current user...');
      const user = await authService.getCurrentUser(data.access_token);
      console.log('[LOGIN] Got user:', user);

      // Step 3: Save to store (uses localStorage internally)
      console.log('[LOGIN] Saving to auth store...');
      login(data.access_token, user);
      
      // Ensure localStorage is synced before redirect
      if (typeof window !== 'undefined') {
        const authData = JSON.stringify({
          token: data.access_token,
          user,
          isAuthenticated: true
        });
        localStorage.setItem('auth-storage', authData);
        console.log('[LOGIN] Auth store updated and localStorage synced');
      }

      toast.success('ログインに成功しました');

      // Step 4: Navigate to dashboard IMMEDIATELY
      console.log('[LOGIN] Redirecting to dashboard...');
      if (typeof window !== 'undefined') {
        // Use replace to prevent back button issues
        window.location.replace('/dashboard');
      }
    } catch (error: any) {
      console.error('[LOGIN] Login failed', error?.response?.status, error?.response?.data);
      setLoading(false);
      toast.error(error.response?.data?.detail || 'ユーザー名またはパスワードが正しくありません');
    }
    // Don't set loading to false on success since we're redirecting
  };

  // Calculate parallax offset (only after mount to prevent hydration mismatch)
  const parallaxX = mounted && typeof window !== 'undefined' ? (mousePosition.x - window.innerWidth / 2) / 50 : 0;
  const parallaxY = mounted && typeof window !== 'undefined' ? (mousePosition.y - window.innerHeight / 2) / 50 : 0;

  return (
    <div className="relative min-h-screen flex overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating Orbs with Parallax */}
        <div
          className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse"
          style={{
            transform: mounted ? `translate(${parallaxX * 2}px, ${parallaxY * 2}px)` : 'translate(0, 0)',
            transition: mounted ? 'transform 0.3s ease-out' : 'none'
          }}
        />
        <div
          className="absolute top-1/2 -right-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"
          style={{
            transform: mounted ? `translate(${-parallaxX * 1.5}px, ${-parallaxY * 1.5}px)` : 'translate(0, 0)',
            transition: mounted ? 'transform 0.3s ease-out' : 'none',
            animationDelay: '1s'
          }}
        />
        <div
          className="absolute bottom-20 left-1/3 w-72 h-72 bg-gradient-to-br from-blue-300/15 to-cyan-300/15 rounded-full blur-3xl animate-pulse"
          style={{
            transform: mounted ? `translate(${parallaxX}px, ${parallaxY}px)` : 'translate(0, 0)',
            transition: mounted ? 'transform 0.3s ease-out' : 'none',
            animationDelay: '2s'
          }}
        />

        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`,
            backgroundSize: '64px 64px'
          }} />
        </div>
      </div>

      {/* Left Side - Premium Branding Panel */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        {/* Animated Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-indigo-600/20 to-purple-600/20 animate-pulse" />

        {/* Background Logo - Giant Watermark with Parallax - Inclinado 300 grados MÁS VISIBLE */}
        <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none overflow-hidden">
          <Image
            src="/logo-uns-corto-negro.png"
            alt="UNS-Kikaku background watermark"
            fill
            priority
            className="object-contain"
            sizes="100vw"
            style={{
              transform: mounted ? `translate(${parallaxX * -0.5}px, ${parallaxY * -0.5}px) scale(1.2) rotate(300deg)` : 'translate(0, 0) scale(1.2) rotate(300deg)',
              transition: mounted ? 'transform 0.3s ease-out' : 'none',
              filter: 'brightness(1.5) saturate(1.2) blur(0.5px)',
              mixBlendMode: 'overlay'
            }}
          />
        </div>

        {/* Geometric Shapes */}
        <div className="absolute top-20 right-20 w-64 h-64 border-2 border-blue-400/20 rounded-full"
          style={{
            transform: mounted ? `translate(${parallaxX * 0.8}px, ${parallaxY * 0.8}px)` : 'translate(0, 0)',
            transition: mounted ? 'transform 0.4s ease-out' : 'none'
          }}
        />
        <div className="absolute bottom-40 left-20 w-48 h-48 border-2 border-indigo-400/20 rounded-full"
          style={{
            transform: mounted ? `translate(${-parallaxX * 0.6}px, ${-parallaxY * 0.6}px)` : 'translate(0, 0)',
            transition: mounted ? 'transform 0.4s ease-out' : 'none'
          }}
        />

        <div className="relative z-10 flex flex-col justify-between w-full px-16 py-16">
          {/* Top Section - Logo */}
          <div>
            <div
              className="mb-8 transform transition-transform duration-500 hover:scale-105"
              style={{
                transform: mounted ? `translate(${parallaxX * 0.5}px, ${parallaxY * 0.5}px)` : 'translate(0, 0)',
                transition: 'transform 0.2s ease-out'
              }}
            >
              <Image
                src="/logo-uns-corto-negro.png"
                alt="UNS-Kikaku logo"
                width={320}
                height={80}
                className="w-auto drop-shadow-2xl"
                style={{ height: '80px' }}
                priority
              />
            </div>

            <div className="space-y-3 mb-12">
              <h1 className="text-5xl font-bold text-white tracking-tight leading-tight drop-shadow-lg">
                次世代人材管理<br />
                プラットフォーム
              </h1>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 text-white rounded-full text-xs font-bold shadow-xl shadow-blue-500/50 animate-pulse">
                  v4.2 Enterprise
                </span>
                <span className="text-sm font-medium text-blue-200">
                  Powered by AI
                </span>
              </div>
            </div>
          </div>

          {/* Middle Section - Premium Features */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white mb-6 tracking-tight drop-shadow-md">
              エンタープライズ機能
            </h2>

            <div className="space-y-5">
              {[
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  ),
                  title: 'エンタープライズセキュリティ',
                  description: '銀行レベルの暗号化とデータ保護'
                },
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  ),
                  title: 'AI駆動型分析',
                  description: 'リアルタイムインサイトと予測分析'
                },
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                  title: '24/7 可用性',
                  description: '99.9%アップタイム保証'
                }
              ].map((feature, index) => (
                <div
                  key={index}
                  className="group flex items-start gap-4 p-5 rounded-2xl bg-white/10 backdrop-blur-md border-2 border-white/20 hover:bg-white/20 hover:shadow-2xl hover:shadow-blue-500/30 hover:border-cyan-400/50 transition-all duration-300 transform hover:-translate-y-2 hover:scale-105"
                  style={{
                    animationDelay: `${index * 100}ms`
                  }}
                >
                  <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/50 group-hover:shadow-cyan-400/60 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    <div className="text-white">
                      {feature.icon}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white mb-2 text-base drop-shadow-md">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-blue-100 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Section - Trust Indicators */}
          <div className="pt-8 border-t border-white/10">
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2 text-white hover:text-cyan-300 transition-colors duration-200">
                <svg className="w-5 h-5 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-bold">SSL 256-bit</span>
              </div>
              <div className="flex items-center gap-2 text-white hover:text-blue-300 transition-colors duration-200">
                <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span className="font-bold">99.9% 稼働率</span>
              </div>
              <div className="flex items-center gap-2 text-white hover:text-indigo-300 transition-colors duration-200">
                <svg className="w-5 h-5 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-bold">ISO認証</span>
              </div>
            </div>
            <p className="text-xs text-blue-200/70 mt-4">
              © 2025 UNS企画株式会社. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative lg:px-12">
        {/* Glassmorphism effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50/50 to-blue-50/30 backdrop-blur-xl" />

        <div className="w-full max-w-md relative z-10">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-10 text-center">
            <div className="inline-block mb-4">
              <Image
                src="/logo-uns-corto-negro.png"
                alt="UNS-Kikaku logo"
                width={240}
                height={96}
                className="h-16 w-auto drop-shadow-lg"
                priority
              />
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full text-xs font-bold shadow-lg">
                v4.2 Enterprise
              </span>
            </div>
          </div>

          {/* Login Header - Más elegante */}
          <div className="mb-12">
            <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 mb-4 tracking-tight leading-tight">
              ログイン
            </h2>
            <p className="text-slate-500 text-lg font-medium tracking-wide">
              アカウント情報を入力してアクセスしてください
            </p>
          </div>

          {/* Login Form - Rediseñado más elegante */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Username - Elegante */}
            <div className="group">
              <label htmlFor="username" className="block text-sm font-black text-slate-800 mb-3 tracking-wide uppercase">
                ユーザー名
              </label>
              <div className="relative">
                <div className="absolute left-5 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-all duration-300 group-focus-within:scale-110">
                  <UserIcon className="w-6 h-6" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-16 pr-6 py-5 border-2 border-slate-300 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-600 transition-all duration-300 bg-white text-slate-900 placeholder-slate-400 text-lg font-semibold shadow-lg hover:shadow-xl hover:border-blue-400 tracking-wide"
                  placeholder="ユーザー名を入力"
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password - Elegante */}
            <div className="group">
              <label htmlFor="password" className="block text-sm font-black text-slate-800 mb-3 tracking-wide uppercase">
                パスワード
              </label>
              <div className="relative">
                <div className="absolute left-5 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-all duration-300 group-focus-within:scale-110">
                  <LockClosedIcon className="w-6 h-6" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-16 pr-16 py-5 border-2 border-slate-300 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-600 transition-all duration-300 bg-white text-slate-900 placeholder-slate-400 text-lg font-semibold shadow-lg hover:shadow-xl hover:border-blue-400 tracking-wide"
                  placeholder="パスワードを入力"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-all duration-200 p-2 hover:scale-110"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-6 h-6" />
                  ) : (
                    <EyeIcon className="w-6 h-6" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password - Mejorado */}
            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center gap-3">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="w-5 h-5 text-blue-600 border-2 border-slate-400 rounded-lg focus:ring-2 focus:ring-blue-600 cursor-pointer transition-all duration-200"
                />
                <label htmlFor="remember-me" className="text-base font-semibold text-slate-700 cursor-pointer select-none hover:text-blue-600 transition-colors">
                  ログイン状態を保持
                </label>
              </div>
              <a href="#" className="text-base font-bold text-blue-600 hover:text-blue-700 transition-colors duration-200 hover:underline decoration-2 underline-offset-4">
                パスワードを忘れた場合
              </a>
            </div>

            {/* Submit Button - Más elegante */}
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full py-6 px-8 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white font-black text-lg tracking-wider rounded-2xl shadow-2xl shadow-blue-500/50 hover:shadow-blue-600/60 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 transform hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg overflow-hidden mt-8"
            >
              {/* Shimmer effect mejorado */}
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />

              <span className="relative flex items-center justify-center uppercase">
                {loading ? (
                  <>
                    <svg className="animate-spin h-6 w-6 mr-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    認証中...
                  </>
                ) : (
                  <>
                    ログイン
                    <svg className="w-6 h-6 ml-3 group-hover:translate-x-2 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-10 p-5 bg-gradient-to-br from-blue-50 via-indigo-50/50 to-purple-50/30 border-2 border-blue-200/50 rounded-2xl backdrop-blur-sm shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-base font-bold text-slate-900">
                デモアカウント
              </p>
            </div>
            {process.env.NODE_ENV === 'development' ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-slate-200/50 shadow-sm">
                  <p className="text-xs font-semibold text-slate-600 mb-2">ユーザー名</p>
                  <p className="text-base font-mono font-bold text-slate-900">
                    {process.env.NEXT_PUBLIC_DEMO_USER || 'admin'}
                  </p>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-slate-200/50 shadow-sm">
                  <p className="text-xs font-semibold text-slate-600 mb-2">パスワード</p>
                  <p className="text-base font-mono font-bold text-slate-900">
                    {process.env.NEXT_PUBLIC_DEMO_PASS || 'admin123'}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-600 text-center">
                本番環境では管理者にお問い合わせください
              </p>
            )}
          </div>

          {/* Trust Indicators */}
          <div className="mt-10 pt-8 border-t border-slate-200/50">
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2 text-slate-700 hover:text-emerald-600 transition-colors duration-200">
                <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-bold">SSL 256-bit</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 hover:text-blue-600 transition-colors duration-200">
                <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span className="font-bold">99.9% 稼働率</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 hover:text-indigo-600 transition-colors duration-200">
                <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-bold">ISO認証</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
