'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Users,
  Building2,
  FileText,
  Clock,
  TrendingUp,
  Filter,
  X,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(query);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    setSearchQuery(query);
    if (query) {
      performSearch(query);
    }
  }, [query]);

  const performSearch = async (searchTerm: string) => {
    setIsSearching(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsSearching(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q={{encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    router.push('/search');
  };

  // Mock search results
  const mockEmployeeResults = [
    {
      id: 1,
      name: '山田太郎',
      factory: 'Toyota Plant A',
      position: 'Line Worker',
      status: 'Active',
    },
    {
      id: 2,
      name: '田中花子',
      factory: 'Honda Factory B',
      position: 'Quality Control',
      status: 'Active',
    },
  ];

  const mockFactoryResults = [
    {
      id: 1,
      name: 'Toyota Plant A',
      location: 'Aichi Prefecture',
      employees: 245,
    },
    {
      id: 2,
      name: 'Honda Factory B',
      location: 'Saitama Prefecture',
      employees: 189,
    },
  ];

  const mockDocumentResults = [
    {
      id: 1,
      title: 'Visa Renewal - 山田太郎',
      type: 'Visa',
      date: '2024-11-15',
    },
    {
      id: 2,
      title: 'Contract Extension - 田中花子',
      type: 'Contract',
      date: '2024-11-10',
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Search Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Buscar</h1>
        <p className="text-muted-foreground">
          Encuentra empleados, fábricas, documentos y más
        </p>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar empleados, fábricas, documentos..."
                className="pl-10 pr-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button type="submit">
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Search Results */}
      {query ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Resultados para: "{query}"</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {isSearching ? 'Buscando...' : 'Se encontraron varios resultados'}
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </div>

          {isSearching ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <Tabs defaultValue="all" className="space-y-4">
              <TabsList>
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="employees">
                  <Users className="h-4 w-4 mr-2" />
                  Empleados
                </TabsTrigger>
                <TabsTrigger value="factories">
                  <Building2 className="h-4 w-4 mr-2" />
                  Fábricas
                </TabsTrigger>
                <TabsTrigger value="documents">
                  <FileText className="h-4 w-4 mr-2" />
                  Documentos
                </TabsTrigger>
              </TabsList>

              {/* All Results */}
              <TabsContent value="all" className="space-y-4">
                {/* Employees Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Empleados ({mockEmployeeResults.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {mockEmployeeResults.map((employee) => (
                      <div
                        key={employee.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => router.push(`/dashboard/employees/{{employee.id}`)}
                      >
                        <div>
                          <p className="font-medium">{employee.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {employee.factory} • {employee.position}
                          </p>
                        </div>
                        <Badge variant="default">{employee.status}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Factories Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Fábricas ({mockFactoryResults.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {mockFactoryResults.map((factory) => (
                      <div
                        key={factory.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => router.push(`/dashboard/factories/{{factory.id}`)}
                      >
                        <div>
                          <p className="font-medium">{factory.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {factory.location}
                          </p>
                        </div>
                        <Badge variant="secondary">{factory.employees} empleados</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Documents Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Documentos ({mockDocumentResults.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {mockDocumentResults.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                      >
                        <div>
                          <p className="font-medium">{doc.title}</p>
                          <p className="text-sm text-muted-foreground">
                            Fecha: {doc.date}
                          </p>
                        </div>
                        <Badge variant="outline">{doc.type}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Employees Tab */}
              <TabsContent value="employees" className="space-y-3">
                {mockEmployeeResults.map((employee) => (
                  <Card key={employee.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-lg">{employee.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {employee.factory} • {employee.position}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="default">{employee.status}</Badge>
                          <Button
                            size="sm"
                            onClick={() => router.push(`/dashboard/employees/{{employee.id}`)}
                          >
                            Ver Detalles
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {/* Factories Tab */}
              <TabsContent value="factories" className="space-y-3">
                {mockFactoryResults.map((factory) => (
                  <Card key={factory.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-lg">{factory.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {factory.location}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary">{factory.employees} empleados</Badge>
                          <Button
                            size="sm"
                            onClick={() => router.push(`/dashboard/factories/{{factory.id}`)}
                          >
                            Ver Detalles
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents" className="space-y-3">
                {mockDocumentResults.map((doc) => (
                  <Card key={doc.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-lg">{doc.title}</p>
                          <p className="text-sm text-muted-foreground">
                            Fecha: {doc.date}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{doc.type}</Badge>
                          <Button size="sm">Ver Documento</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          )}
        </div>
      ) : (
        /* Empty State */
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Search className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Comienza tu búsqueda</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Busca empleados por nombre, fábricas por ubicación, o documentos por tipo.
              Los resultados aparecerán aquí.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                <Clock className="h-3 w-3 mr-1" />
                Búsquedas recientes
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                <TrendingUp className="h-3 w-3 mr-1" />
                Populares
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto p-6">
        <Skeleton className="h-12 w-64 mb-4" />
        <Skeleton className="h-24 w-full mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
