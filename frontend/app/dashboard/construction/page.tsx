'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Zap, Clock, ArrowRight } from 'lucide-react';

export default function ConstructionPage() {
  const [mounted, setMounted] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  useEffect(() => {
    setMounted(true);
    // Generate random particles for background animation
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2,
    }));
    setParticles(newParticles);
  }, []);

  if (!mounted) return null;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: 'easeOut',
      },
    },
  };

  const floatingVariants = {
    animate: {
      y: [0, -20, 0],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const pulseVariants = {
    animate: {
      scale: [1, 1.05, 1],
      opacity: [0.5, 1, 0.5],
      transition: {
        duration: 2,
        repeat: Infinity,
      },
    },
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-1 h-1 bg-blue-400 rounded-full"
            initial={{ x: `${particle.x}%`, y: `${particle.y}%`, opacity: 0 }}
            animate={{
              y: [`${particle.y}%`, `${particle.y - 100}%`],
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: 10 + Math.random() * 5,
              repeat: Infinity,
              delay: particle.delay,
            }}
          />
        ))}
      </div>

      {/* Gradient orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
      <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
        <motion.div
          className="w-full max-w-2xl mx-auto text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Icon with floating animation */}
          <motion.div
            className="mb-8 flex justify-center"
            variants={floatingVariants}
            animate="animate"
          >
            <div className="relative">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-2xl opacity-50"
                animate={pulseVariants}
              />
              <div className="relative bg-gradient-to-br from-blue-600 to-purple-600 p-6 rounded-full">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                >
                  <Zap className="w-12 h-12 text-white" />
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Main heading */}
          <motion.div variants={itemVariants} className="mb-6">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                工事中
              </span>
            </h1>
            <div className="h-1 w-24 bg-gradient-to-r from-blue-400 to-purple-400 mx-auto rounded-full" />
          </motion.div>

          {/* Subtitle */}
          <motion.h2
            variants={itemVariants}
            className="text-2xl sm:text-3xl text-slate-200 mb-6 font-semibold"
          >
            素晴らしい何かが来ています
          </motion.h2>

          {/* Description */}
          <motion.p
            variants={itemVariants}
            className="text-lg text-slate-300 mb-8 leading-relaxed max-w-xl mx-auto"
          >
            このページはまだ準備中です。新機能と素晴らしい更新をお届けするため、チームは努力しております。もう少しお待ちください！
          </motion.p>

          {/* Additional info */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
            <motion.div
              className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 p-4 rounded-lg border border-blue-500/30 backdrop-blur-sm"
              whileHover={{ scale: 1.05, borderColor: 'rgb(59, 130, 246)' }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-center gap-2 text-blue-300 mb-2">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-semibold">新機能</span>
              </div>
              <p className="text-xs text-slate-400">革新的な機能が開発中</p>
            </motion.div>

            <motion.div
              className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 p-4 rounded-lg border border-purple-500/30 backdrop-blur-sm"
              whileHover={{ scale: 1.05, borderColor: 'rgb(168, 85, 247)' }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-center gap-2 text-purple-300 mb-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-semibold">近日公開</span>
              </div>
              <p className="text-xs text-slate-400">まもなくご利用いただけます</p>
            </motion.div>

            <motion.div
              className="bg-gradient-to-br from-pink-500/20 to-pink-600/10 p-4 rounded-lg border border-pink-500/30 backdrop-blur-sm"
              whileHover={{ scale: 1.05, borderColor: 'rgb(236, 72, 153)' }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-center gap-2 text-pink-300 mb-2">
                <Zap className="w-4 h-4" />
                <span className="text-sm font-semibold">楽しみに</span>
              </div>
              <p className="text-xs text-slate-400">エキサイティングな更新</p>
            </motion.div>
          </motion.div>

          {/* Progress bar animation */}
          <motion.div
            variants={itemVariants}
            className="mb-12 max-w-md mx-auto"
          >
            <div className="mb-3 flex justify-between items-center">
              <span className="text-sm text-slate-400">開発進捗</span>
              <span className="text-sm font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                進行中...
              </span>
            </div>
            <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <motion.div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: '75%' }}
                transition={{ duration: 2, ease: 'easeInOut' }}
              />
            </div>
          </motion.div>

          {/* Status message */}
          <motion.div
            variants={itemVariants}
            className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm"
          >
            <div className="flex items-start gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1" />
              </motion.div>
              <div className="text-left">
                <p className="text-slate-200 font-semibold mb-1">
                  何が起きているか?
                </p>
                <p className="text-slate-400 text-sm">
                  私たちの開発チームは、あなたのための最高のユーザーエクスペリエンスを作成するために懸命に取り組んでいます。このページはまもなく生まれ変わります。しばらくお待ちください。
                </p>
              </div>
            </div>
          </motion.div>

          {/* Back button */}
          <motion.div
            variants={itemVariants}
            className="mt-12"
          >
            <motion.a
              href="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold group"
              whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(59, 130, 246, 0.3)' }}
              whileTap={{ scale: 0.95 }}
            >
              ダッシュボードに戻る
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <ArrowRight className="w-5 h-5" />
              </motion.div>
            </motion.a>
          </motion.div>

          {/* Footer message */}
          <motion.p
            variants={itemVariants}
            className="mt-12 text-slate-500 text-sm"
          >
            何かご不明な点がある場合は、
            <a href="/help" className="text-blue-400 hover:text-blue-300 transition-colors ml-1">
              サポートチーム
            </a>
            にお問い合わせください
          </motion.p>
        </motion.div>
      </div>

      {/* Floating elements */}
      <motion.div
        className="absolute top-20 right-20 w-4 h-4 bg-blue-500 rounded-full opacity-60"
        animate={{
          y: [0, -30, 0],
          x: [0, 15, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute bottom-32 left-20 w-3 h-3 bg-purple-500 rounded-full opacity-60"
        animate={{
          y: [0, 30, 0],
          x: [0, -15, 0],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}
