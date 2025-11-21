'use client';

import { motion } from 'framer-motion';
import { Construction, ArrowLeft, Calendar, User, Mail } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface UnderConstructionProps {
  pageName?: string;
  customMessage?: string;
  estimatedDate?: string;
  contactEmail?: string;
  contactPerson?: string;
  showBackButton?: boolean;
  backUrl?: string;
  className?: string;
}

export function UnderConstruction({
  pageName = 'この機能',
  customMessage,
  estimatedDate,
  contactEmail = 'admin@uns-hrapp.com',
  contactPerson = 'システム管理者',
  showBackButton = true,
  backUrl = '/dashboard',
  className = '',
}: UnderConstructionProps) {
  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 flex items-center justify-center p-4 ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full text-center"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
          className="mb-8"
        >
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900/30">
            <Construction className="w-12 h-12 text-blue-600 dark:text-blue-400" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4"
        >
          建設中
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-xl text-slate-600 dark:text-slate-400 mb-6"
        >
          {customMessage || `${pageName}の準備中です。しばらくお待ちください。`}
        </motion.p>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 mb-8 text-left"
        >
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            お知らせ
          </h3>
          <ul className="space-y-3 text-slate-600 dark:text-slate-400">
            {estimatedDate && (
              <li className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                <span>
                  <strong>予定完了日:</strong> {estimatedDate}
                </span>
              </li>
            )}
            <li className="flex items-center gap-2">
              <User className="w-5 h-5 text-green-500" />
              <span>
                <strong>管理者:</strong> {contactPerson}
              </span>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-purple-500" />
              <span>
                <strong>お問い合わせ:</strong>{' '}
                <a href={`mailto:${contactEmail}`} className="text-blue-600 hover:underline">
                  {contactEmail}
                </a>
              </span>
            </li>
          </ul>
        </motion.div>

        {/* Progress bar animation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mb-8"
        >
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                repeat: Infinity,
                repeatType: 'loop' as const,
                duration: 2,
                ease: 'linear',
              }}
            />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            開発進捗: 65%
          </p>
        </motion.div>

        {/* Back button */}
        {showBackButton && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <Link href={backUrl}>
              <Button size="lg" className="gap-2">
                <ArrowLeft className="w-5 h-5" />
                ダッシュボードに戻る
              </Button>
            </Link>
          </motion.div>
        )}

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 text-sm text-slate-500 dark:text-slate-400"
        >
          <p>© 2025 UNS HRApp - 人材派遣管理システム</p>
          <p className="mt-1">Showing page: {pageName}</p>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default UnderConstruction;
