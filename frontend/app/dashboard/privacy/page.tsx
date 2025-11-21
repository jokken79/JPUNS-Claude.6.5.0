'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Política de Privacidad</h1>
          <p className="text-muted-foreground">UNS HRApp - Sistema de RRHH</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información que Recopilamos</CardTitle>
          <CardDescription>Última actualización: 24 de octubre de 2025</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            En UNS HRApp, tomamos muy en serio la privacidad de nuestros usuarios. Este sistema de gestión
            de recursos humanos maneja información sensible de candidatos, empleados y clientes.
          </p>

          <div className="space-y-2">
            <h3 className="font-semibold">Datos Personales</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Información de identificación personal (nombre, dirección, contacto)</li>
              <li>Documentos de identidad y visas (在留カード)</li>
              <li>Información laboral (contratos, salarios, asistencia)</li>
              <li>Fotografías y documentos escaneados</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Uso de la Información</h3>
            <p className="text-sm text-muted-foreground">
              La información recopilada se utiliza exclusivamente para la gestión de recursos humanos,
              procesamiento de nóminas, seguimiento de asistencia y cumplimiento de requisitos legales.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Seguridad</h3>
            <p className="text-sm text-muted-foreground">
              Implementamos medidas de seguridad técnicas y organizativas para proteger sus datos personales
              contra acceso no autorizado, alteración, divulgación o destrucción.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Derechos del Usuario</h3>
            <p className="text-sm text-muted-foreground">
              Los usuarios tienen derecho a acceder, rectificar, eliminar o limitar el procesamiento
              de sus datos personales en cualquier momento.
            </p>
          </div>

          <div className="mt-6 p-4 rounded-lg bg-muted">
            <p className="text-sm text-muted-foreground">
              Para preguntas sobre esta política de privacidad, contacte a: privacy@uns-hrapp.com
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
