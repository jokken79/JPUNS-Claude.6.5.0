'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import {
  HelpCircle,
  Search,
  BookOpen,
  Video,
  MessageCircle,
  Mail,
  Phone,
  Users,
  FileText,
  Clock,
  DollarSign,
  Building2,
  UserPlus,
  Download,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { useState } from 'react';

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const faqs = [
    {
      category: '候補者 (Candidatos)',
      icon: UserPlus,
      questions: [
        {
          q: '¿Cómo registro un nuevo candidato (履歴書)?',
          a: 'Ve a la sección "Candidatos" y haz clic en "Nuevo Candidato". Puedes ingresar los datos manualmente o utilizar la función de OCR para escanear documentos automáticamente. El sistema acepta履歴書, 在留カード y otros documentos japoneses.'
        },
        {
          q: '¿Cómo funciona el OCR para escanear 履歴書?',
          a: 'El sistema usa Azure Computer Vision AI para extraer datos automáticamente de documentos escaneados. Sube una imagen clara del documento, y el sistema extraerá nombre, fecha de nacimiento, dirección, experiencia laboral y otros campos. Siempre revisa los datos extraídos antes de guardar.'
        },
        {
          q: '¿Qué significan los estados de aprobación?',
          a: 'Los candidatos pasan por diferentes estados: "Pendiente" (recién creado), "En Revisión" (siendo evaluado), "Aprobado" (listo para contratación), "Rechazado" (no califica). Solo los candidatos aprobados pueden convertirse en empleados.'
        },
      ]
    },
    {
      category: '派遣社員 (Empleados)',
      icon: Users,
      questions: [
        {
          q: '¿Cómo convierto un candidato en empleado?',
          a: 'Primero, el candidato debe estar en estado "Aprobado". Luego ve a la página del candidato y haz clic en "Convertir a Empleado". Completa la información adicional como fábrica asignada, fecha de inicio, salario base, etc.'
        },
        {
          q: '¿Cómo asigno un empleado a una fábrica (派遣先)?',
          a: 'En la página de edición del empleado, selecciona la fábrica desde el menú desplegable. Solo puedes asignar fábricas que estén activas en el sistema. Si la fábrica no aparece, primero debes crearla en la sección "Fábricas".'
        },
        {
          q: '¿Puedo gestionar múltiples contratos para un mismo empleado?',
          a: 'Sí, el sistema mantiene un historial completo de contratos. Cuando un contrato vence, puedes crear uno nuevo sin perder el historial del empleado. Esto es útil para renovaciones y cambios de asignación.'
        },
      ]
    },
    {
      category: 'タイムカード (Asistencia)',
      icon: Clock,
      questions: [
        {
          q: '¿Cómo registro la asistencia diaria (タイムカード)?',
          a: 'Ve a "Asistencia" y haz clic en "Nuevo Registro". Selecciona el empleado, fecha, turno (朝番/昼番/夜番), hora de entrada y salida. El sistema calcula automáticamente horas trabajadas, horas extra, horas nocturnas y horas de día festivo.'
        },
        {
          q: '¿Qué diferencia hay entre los turnos 朝番, 昼番 y 夜番?',
          a: '朝番 (turno mañana): 6:00-15:00, 昼番 (turno tarde): 14:00-23:00, 夜番 (turno noche): 22:00-7:00. Cada turno tiene diferentes tarifas de pago, especialmente el turno nocturno que incluye recargo.'
        },
        {
          q: '¿Cómo se calculan las horas extra y nocturnas?',
          a: 'Horas extra: cualquier hora que exceda las 8 horas regulares del turno (125% del salario base). Horas nocturnas: trabajo entre 22:00-5:00 (135% del salario base). El sistema calcula esto automáticamente al guardar el タイムカード.'
        },
      ]
    },
    {
      category: '給与 (Nómina)',
      icon: DollarSign,
      questions: [
        {
          q: '¿Cómo calculo la nómina mensual?',
          a: 'Ve a "Nómina" y selecciona el mes a calcular. El sistema tomará todos los registros de asistencia (タイムカード) del mes, aplicará las tarifas correspondientes, sumará bonificaciones y restará deducciones. El cálculo es automático.'
        },
        {
          q: '¿Qué incluye el cálculo de salario?',
          a: 'El salario total incluye: salario base por horas regulares, recargos por horas extra (125%), recargos por horas nocturnas (135%), bonificaciones por días festivos, subsidios de transporte y vivienda. Se restan: impuestos, seguro social, y otras deducciones.'
        },
        {
          q: '¿Puedo ajustar manualmente un cálculo de nómina?',
          a: 'Sí, después de que el sistema genera el cálculo automático, puedes añadir bonificaciones adicionales, deducciones especiales o hacer ajustes manuales. Todos los cambios quedan registrados en el historial de auditoría.'
        },
      ]
    },
    {
      category: '派遣先 (Fábricas/Clientes)',
      icon: Building2,
      questions: [
        {
          q: '¿Cómo registro una nueva fábrica cliente?',
          a: 'Ve a "Fábricas" y haz clic en "Nueva Fábrica". Ingresa el nombre de la empresa, dirección, persona de contacto, tipo de industria, tarifas de pago, y otra información relevante. Puedes activar/desactivar fábricas según necesidad.'
        },
        {
          q: '¿Cómo asigno tarifas diferentes a cada fábrica?',
          a: 'Cada fábrica puede tener sus propias tarifas configuradas. En la configuración de la fábrica, establece el salario base por hora, recargos para horas extra, nocturnas, y festivas. Estas tarifas se aplicarán automáticamente a los empleados asignados.'
        },
      ]
    },
    {
      category: '申請 (Solicitudes)',
      icon: FileText,
      questions: [
        {
          q: '¿Qué tipos de solicitudes pueden hacer los empleados?',
          a: 'Los empleados pueden solicitar: 有給 (días de vacaciones pagadas), 半休 (medio día libre), 一時帰国 (retorno temporal a su país), 退社 (renuncia). Cada solicitud requiere aprobación del administrador.'
        },
        {
          q: '¿Cómo apruebo o rechazo una solicitud?',
          a: 'Ve a "Solicitudes", selecciona la solicitud pendiente, revisa los detalles y haz clic en "Aprobar" o "Rechazar". Si rechazas, debes proporcionar una razón. El empleado será notificado automáticamente.'
        },
      ]
    },
  ];

  const guides = [
    {
      title: 'Guía de Inicio Rápido',
      description: 'Aprende los conceptos básicos del sistema en 10 minutos',
      duration: '10 min',
      type: 'Tutorial',
      icon: BookOpen,
    },
    {
      title: 'Gestión Completa de Candidatos',
      description: 'Desde el registro hasta la contratación de 派遣社員',
      duration: '15 min',
      type: 'Video',
      icon: Video,
    },
    {
      title: 'Cálculo de Nómina Paso a Paso',
      description: 'Cómo calcular 給与 mensual con タイムカード',
      duration: '12 min',
      type: 'Tutorial',
      icon: BookOpen,
    },
    {
      title: 'OCR para Documentos Japoneses',
      description: 'Uso de IA para escanear 履歴書 y 在留カード',
      duration: '8 min',
      type: 'Video',
      icon: Video,
    },
  ];

  const filteredFaqs = searchQuery
    ? faqs.map(category => ({
        ...category,
        questions: category.questions.filter(
          q => q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
               q.a.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(category => category.questions.length > 0)
    : faqs;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <HelpCircle className="h-8 w-8 text-primary" />
            Centro de Ayuda
          </h1>
          <p className="text-muted-foreground mt-1">
            Guías, tutoriales y preguntas frecuentes (ヘルプセンター)
          </p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar en la ayuda... (例: 履歴書の登録方法、給与計算、etc.)"
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="faqs" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="faqs">Preguntas Frecuentes</TabsTrigger>
          <TabsTrigger value="guides">Guías y Tutoriales</TabsTrigger>
          <TabsTrigger value="contact">Contacto y Soporte</TabsTrigger>
        </TabsList>

        {/* FAQs Tab */}
        <TabsContent value="faqs" className="space-y-4">
          {filteredFaqs.map((category, categoryIndex) => {
            const Icon = category.icon;
            return (
              <Card key={categoryIndex}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <CardTitle>{category.category}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {category.questions.map((item, qIndex) => (
                      <AccordionItem key={qIndex} value={`item-${categoryIndex}-${qIndex}`}>
                        <AccordionTrigger className="text-left">
                          {item.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                          {item.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            );
          })}

          {filteredFaqs.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  No se encontraron resultados para "{searchQuery}"
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Guides Tab */}
        <TabsContent value="guides" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tutoriales y Guías de Uso</CardTitle>
              <CardDescription>
                Recursos educativos para dominar el sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {guides.map((guide, index) => {
                  const Icon = guide.icon;
                  return (
                    <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="pt-6">
                        <div className="flex gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Icon className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-semibold">{guide.title}</h3>
                              <Badge variant="outline">{guide.type}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                              {guide.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {guide.duration}
                              </span>
                              <Button variant="ghost" size="sm" className="gap-2">
                                Ver {guide.type === 'Video' ? 'Video' : 'Guía'}
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Documentación Técnica</CardTitle>
              <CardDescription>
                Manuales detallados y documentación del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start gap-3">
                  <Download className="h-4 w-4" />
                  Manual de Usuario Completo (PDF)
                </Button>
                <Button variant="outline" className="w-full justify-start gap-3">
                  <Download className="h-4 w-4" />
                  Guía de Administrador (PDF)
                </Button>
                <Button variant="outline" className="w-full justify-start gap-3">
                  <Download className="h-4 w-4" />
                  Términos del Sistema HR Japonés (日本語/Español)
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Tab */}
        <TabsContent value="contact" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-blue-600" />
                  Correo Electrónico
                </CardTitle>
                <CardDescription>
                  Contacta con nuestro equipo de soporte
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">
                  Envía tus consultas o reportes de problemas a:
                </p>
                <Button variant="outline" className="w-full gap-2">
                  <Mail className="h-4 w-4" />
                  support@uns-hrapp.jp
                </Button>
                <p className="text-xs text-muted-foreground mt-3">
                  Tiempo de respuesta: 24-48 horas laborables
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-green-600" />
                  Teléfono de Soporte
                </CardTitle>
                <CardDescription>
                  Asistencia telefónica directa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">
                  Llama a nuestro centro de soporte:
                </p>
                <Button variant="outline" className="w-full gap-2">
                  <Phone className="h-4 w-4" />
                  +81 (03) 1234-5678
                </Button>
                <p className="text-xs text-muted-foreground mt-3">
                  Horario: Lun-Vie 9:00-18:00 JST
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-purple-600" />
                  Chat en Vivo
                </CardTitle>
                <CardDescription>
                  Asistencia inmediata por chat
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">
                  Chatea con un agente de soporte en tiempo real
                </p>
                <Button className="w-full gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Iniciar Chat
                </Button>
                <p className="text-xs text-muted-foreground mt-3">
                  Disponible 24/7
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-orange-600" />
                  Base de Conocimientos
                </CardTitle>
                <CardDescription>
                  Artículos y recursos útiles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">
                  Encuentra respuestas en nuestra base de conocimientos
                </p>
                <Button variant="outline" className="w-full gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Visitar Centro de Ayuda
                </Button>
                <p className="text-xs text-muted-foreground mt-3">
                  Más de 100 artículos disponibles
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Emergency Contact */}
          <Card className="border-red-200 bg-red-50/50">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-red-900 mb-1">
                    Soporte de Emergencia
                  </p>
                  <p className="text-red-700 mb-2">
                    Para problemas críticos que afecten operaciones (errores de nómina, caídas del sistema, etc.),
                    contacta al soporte de emergencia 24/7:
                  </p>
                  <p className="font-semibold text-red-900">
                    📞 Emergencias: +81 (080) 9999-9999
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
