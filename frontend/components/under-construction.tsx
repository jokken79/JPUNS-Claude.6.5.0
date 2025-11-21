'use client';

import { motion } from 'framer-motion';
import { Construction, Wrench, HardHat, Hammer, AlertTriangle } from 'lucide-react';

export function UnderConstruction() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <motion.div
        className="text-center space-y-8 px-4 max-w-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Animated Icons */}
        <div className="relative h-48 flex items-center justify-center">
          <motion.div
            className="absolute"
            animate={{
              rotate: [0, 360],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <Construction className="h-32 w-32 text-yellow-500/20" />
          </motion.div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <div className="relative">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <HardHat className="h-24 w-24 text-yellow-600" />
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            className="absolute left-1/4 top-1/4"
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Wrench className="h-12 w-12 text-gray-600" />
          </motion.div>

          <motion.div
            className="absolute right-1/4 bottom-1/4"
            animate={{ rotate: [0, -15, 15, 0] }}
            transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
          >
            <Hammer className="h-12 w-12 text-gray-600" />
          </motion.div>
        </div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent mb-4">
            Página en Construcción
          </h1>
          <div className="flex items-center justify-center gap-2 text-yellow-600">
            <AlertTriangle className="h-5 w-5" />
            <p className="text-lg font-semibold">
              Under Construction
            </p>
            <AlertTriangle className="h-5 w-5" />
          </div>
        </motion.div>

        {/* Message */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-xl text-gray-700 dark:text-gray-300">
            Esta sección está temporalmente deshabilitada mientras trabajamos en mejoras.
          </p>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Por favor, contacte al administrador para más información.
          </p>
        </motion.div>

        {/* Decorative Progress Bar */}
        <motion.div
          className="max-w-md mx-auto"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
        >
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500"
              initial={{ width: "0%" }}
              animate={{ width: "75%" }}
              transition={{ duration: 1.5, delay: 0.8, ease: "easeOut" }}
            />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Trabajando en mejoras...
          </p>
        </motion.div>

        {/* Additional Info */}
        <motion.div
          className="pt-8 border-t border-gray-300 dark:border-gray-700"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <p className="text-sm text-gray-500 dark:text-gray-400">
            UNS HRApp v4.2 - Sistema de Gestión de Recursos Humanos
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
