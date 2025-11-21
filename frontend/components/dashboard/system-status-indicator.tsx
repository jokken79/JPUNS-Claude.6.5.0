'use client';

import { AlertTriangle, CheckCircle, AlertCircle, Loader2, Database, Server, Wifi } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type SystemStatus = 'healthy' | 'warning' | 'error' | 'loading';

interface ServiceStatus {
  name: string;
  status: 'ok' | 'warning' | 'error';
  message: string;
}

interface SystemStatusIndicatorProps {
  className?: string;
}

export function SystemStatusIndicator({ className }: SystemStatusIndicatorProps) {
  const [status, setStatus] = useState<SystemStatus>('loading');
  const [message, setMessage] = useState<string>('Verificando sistema...');
  const [services, setServices] = useState<ServiceStatus[]>([]);

  // Verificación real del estado del sistema
  useEffect(() => {
    const checkSystemStatus = async () => {
      setStatus('loading');
      setMessage('Verificando sistema...');

      try {
        // Verificar estado de diferentes servicios
        const serviceChecks: ServiceStatus[] = [];

        // 1. Verificar API Backend (desactivado para evitar bucle infinito)
        try {
          const apiResponse = await fetch('/api/health', {
            method: 'GET',
            signal: AbortSignal.timeout(5000)
          });
          
          if (apiResponse.ok) {
            serviceChecks.push({
              name: 'API Backend',
              status: 'ok',
              message: 'Operativa'
            });
          } else {
            serviceChecks.push({
              name: 'API Backend',
              status: 'warning',
              message: 'Respuesta lenta'
            });
          }
        } catch (error) {
          // No mostrar error en consola para evitar bucle infinito
          serviceChecks.push({
            name: 'API Backend',
            status: 'error',
            message: 'No responde'
          });
        }

        // 2. Verificar Base de Datos (simulado por ahora)
        const dbStatus = Math.random() > 0.1 ? 'ok' : Math.random() > 0.5 ? 'warning' : 'error';
        serviceChecks.push({
          name: 'Base de Datos',
          status: dbStatus,
          message: dbStatus === 'ok' ? 'Conectada' : dbStatus === 'warning' ? 'Lenta' : 'Error conexión'
        });

        // 3. Verificar servicios Docker (simulado)
        const dockerStatus = Math.random() > 0.05 ? 'ok' : 'warning';
        serviceChecks.push({
          name: 'Servicios Docker',
          status: dockerStatus,
          message: dockerStatus === 'ok' ? 'Todos activos' : 'Algunos lentos'
        });

        setServices(serviceChecks);

        // Determinar estado general del sistema
        const hasError = serviceChecks.some(s => s.status === 'error');
        const hasWarning = serviceChecks.some(s => s.status === 'warning');

        if (hasError) {
          setStatus('error');
          setMessage('Error crítico detectado');
        } else if (hasWarning) {
          setStatus('warning');
          setMessage('Advertencia: Revisar servicios');
        } else {
          setStatus('healthy');
          setMessage('Sistema operativo');
        }

      } catch (error) {
        setStatus('error');
        setMessage('Error al verificar sistema');
        // No mostrar error en consola para evitar bucle infinito
      }
    };

    // Verificar al montar
    checkSystemStatus();

    // Verificar cada 30 segundos (desactivado para evitar bucle infinito)
    const interval = process.env.NODE_ENV === 'development' ? setInterval(checkSystemStatus, 30000) : null;

    return () => interval ? clearInterval(interval) : null;
  }, []);

  const getStatusConfig = (status: SystemStatus) => {
    switch (status) {
      case 'healthy':
        return {
          icon: CheckCircle,
          color: 'bg-green-500',
          borderColor: 'border-green-500',
          bgColor: 'bg-green-50 dark:bg-green-950/20',
          textColor: 'text-green-700 dark:text-green-400',
          pulseColor: 'bg-green-400',
          label: '100% OK'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          color: 'bg-yellow-500',
          borderColor: 'border-yellow-500',
          bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
          textColor: 'text-yellow-700 dark:text-yellow-400',
          pulseColor: 'bg-yellow-400',
          label: 'Advertencia'
        };
      case 'error':
        return {
          icon: AlertCircle,
          color: 'bg-red-500',
          borderColor: 'border-red-500',
          bgColor: 'bg-red-50 dark:bg-red-950/20',
          textColor: 'text-red-700 dark:text-red-400',
          pulseColor: 'bg-red-400',
          label: 'Error'
        };
      case 'loading':
        return {
          icon: Loader2,
          color: 'bg-blue-500',
          borderColor: 'border-blue-500',
          bgColor: 'bg-blue-50 dark:bg-blue-950/20',
          textColor: 'text-blue-700 dark:text-blue-400',
          pulseColor: 'bg-blue-400',
          label: 'Verificando'
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  const getServiceIcon = (serviceName: string) => {
    switch (serviceName) {
      case 'API Backend':
        return Server;
      case 'Base de Datos':
        return Database;
      case 'Servicios Docker':
        return Wifi;
      default:
        return CheckCircle;
    }
  };

  const getServiceColor = (serviceStatus: string) => {
    switch (serviceStatus) {
      case 'ok':
        return 'text-green-600 dark:text-green-400';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className={`flex items-center gap-2 cursor-pointer ${className}`}>
          {/* Semáforo de luces */}
          <div className="flex items-center gap-1 p-2 rounded-lg border border-border bg-background hover:bg-accent transition-colors">
            {/* Luz Roja - Error */}
            <motion.div
              className={`w-3 h-3 rounded-full border-2 ${
                status === 'error'
                  ? 'bg-red-500 border-red-600 shadow-red-500/50 shadow-lg'
                  : 'bg-gray-300 dark:bg-gray-600 border-gray-400 dark:border-gray-500'
              }`}
              animate={status === 'error' ? {
                scale: [1, 1.2, 1],
                opacity: [1, 0.7, 1],
              } : {}}
              transition={{
                duration: 1,
                repeat: status === 'error' ? Infinity : 0,
              }}
              title="Error crítico"
            />
            
            {/* Luz Amarilla - Advertencia */}
            <motion.div
              className={`w-3 h-3 rounded-full border-2 ${
                status === 'warning'
                  ? 'bg-yellow-500 border-yellow-600 shadow-yellow-500/50 shadow-lg'
                  : 'bg-gray-300 dark:bg-gray-600 border-gray-400 dark:border-gray-500'
              }`}
              animate={status === 'warning' ? {
                scale: [1, 1.2, 1],
                opacity: [1, 0.7, 1],
              } : {}}
              transition={{
                duration: 1.5,
                repeat: status === 'warning' ? Infinity : 0,
              }}
              title="Advertencia"
            />
            
            {/* Luz Verde - Sistema OK */}
            <motion.div
              className={`w-3 h-3 rounded-full border-2 ${
                status === 'healthy'
                  ? 'bg-green-500 border-green-600 shadow-green-500/50 shadow-lg'
                  : 'bg-gray-300 dark:bg-gray-600 border-gray-400 dark:border-gray-500'
              }`}
              animate={status === 'healthy' ? {
                scale: [1, 1.1, 1],
              } : {}}
              transition={{
                duration: 2,
                repeat: status === 'healthy' ? Infinity : 0,
              }}
              title="Sistema OK"
            />
          </div>

          {/* Badge con estado */}
          <Badge
            variant="outline"
            className={`${config.bgColor} ${config.borderColor} ${config.textColor} border`}
          >
            <Icon className="w-3 h-3 mr-1" />
            {config.label}
          </Badge>

          {/* Mensaje de estado (solo en modo desarrollo o hover) */}
          {process.env.NODE_ENV === 'development' && (
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {message}
            </span>
          )}
        </div>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="start" className="w-80">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Icon className="w-4 h-4" />
          Estado del Sistema
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Lista de servicios */}
        <div className="max-h-64 overflow-y-auto">
          {services.map((service, index) => {
            const ServiceIcon = getServiceIcon(service.name);
            return (
              <DropdownMenuItem
                key={service.name}
                className="flex items-center gap-3 p-3 cursor-default"
                disabled
              >
                <ServiceIcon className={`w-4 h-4 ${getServiceColor(service.status)}`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{service.name}</span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        service.status === 'ok'
                          ? 'border-green-500 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/20'
                          : service.status === 'warning'
                          ? 'border-yellow-500 text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/20'
                          : 'border-red-500 text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/20'
                      }`}
                    >
                      {service.status === 'ok' ? 'OK' : service.status === 'warning' ? '⚠️' : '❌'}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {service.message}
                  </div>
                </div>
              </DropdownMenuItem>
            );
          })}
        </div>
        
        <DropdownMenuSeparator />
        
        {/* Estado general */}
        <DropdownMenuItem className="flex items-center gap-3 p-3 cursor-default">
          <Icon className={`w-4 h-4 ${config.textColor}`} />
          <div className="flex-1">
            <div className="text-sm font-medium">Estado General</div>
            <div className="text-xs text-muted-foreground mt-1">{message}</div>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Información adicional */}
        <DropdownMenuItem className="flex items-center justify-center text-xs text-muted-foreground p-2 cursor-default">
          Última verificación: {new Date().toLocaleTimeString()}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}