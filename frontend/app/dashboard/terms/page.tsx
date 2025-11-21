'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <FileText className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Términos de Uso</h1>
          <p className="text-muted-foreground">UNS HRApp - Sistema de RRHH</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Acuerdo de Usuario</CardTitle>
          <CardDescription>Última actualización: 24 de octubre de 2025</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Al acceder y utilizar UNS HRApp, usted acepta cumplir con estos términos de uso.
            Por favor, léalos detenidamente.
          </p>

          <div className="space-y-2">
            <h3 className="font-semibold">1. Uso del Sistema</h3>
            <p className="text-sm text-muted-foreground">
              Este sistema está diseñado exclusivamente para la gestión de recursos humanos de agencias
              de staffing japonesas (人材派遣会社). El acceso está restringido a personal autorizado.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">2. Responsabilidades del Usuario</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Mantener la confidencialidad de sus credenciales de acceso</li>
              <li>Utilizar el sistema de manera responsable y ética</li>
              <li>No compartir información sensible sin autorización</li>
              <li>Reportar cualquier actividad sospechosa o brecha de seguridad</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">3. Propiedad Intelectual</h3>
            <p className="text-sm text-muted-foreground">
              Todos los derechos de propiedad intelectual relacionados con UNS HRApp pertenecen
              a sus respectivos propietarios. El software se proporciona bajo licencia.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">4. Limitación de Responsabilidad</h3>
            <p className="text-sm text-muted-foreground">
              El sistema se proporciona "tal cual" sin garantías de ningún tipo. No nos hacemos
              responsables de pérdidas o daños derivados del uso del sistema.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">5. Modificaciones</h3>
            <p className="text-sm text-muted-foreground">
              Nos reservamos el derecho de modificar estos términos en cualquier momento.
              Los cambios entrarán en vigor inmediatamente después de su publicación.
            </p>
          </div>

          <div className="mt-6 p-4 rounded-lg bg-muted">
            <p className="text-sm text-muted-foreground">
              Para preguntas sobre estos términos, contacte a: legal@uns-hrapp.com
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
