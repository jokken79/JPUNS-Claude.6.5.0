'use client';

import { useAuthStore } from '@/stores/auth-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Mail, Shield, Calendar } from 'lucide-react';

export default function DashboardProfilePage() {
  const { user } = useAuthStore();

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p>Cargando perfil...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Mi Perfil</h1>

      <Card>
        <CardHeader>
          <CardTitle>Información Personal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-muted-foreground" />
            <div>
              <label className="text-sm font-semibold">Usuario:</label>
              <p className="text-lg">{user.username}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <div>
              <label className="text-sm font-semibold">Rol:</label>
              <p className="text-lg capitalize">{user.role?.replace('_', ' ')}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div>
              <label className="text-sm font-semibold">Email:</label>
              <p className="text-lg">{user.email || 'No configurado'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <label className="text-sm font-semibold">ID:</label>
              <p className="text-lg">{user.id}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <Button variant="outline" onClick={() => window.history.back()}>
          Volver
        </Button>
      </div>
    </div>
  );
}
