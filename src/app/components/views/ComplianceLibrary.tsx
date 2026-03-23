import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { 
  BookOpen, 
  Search, 
  ExternalLink, 
  Shield, 
  FileText,
  AlertCircle,
  CheckCircle,
  Filter,
  Download
} from 'lucide-react';
import { regulatoryReferences, regulatoryResources, csrdEsrsDependencies } from '@/data/complianceData';

interface ComplianceLibraryProps {
  posture: 'conseil' | 'pre-audit' | 'audit-externe';
  parcours: 'csrd-obligatoire' | 'esg-structure';
}

export function ComplianceLibrary({ posture, parcours }: ComplianceLibraryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [pillarFilter, setPillarFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  const isCsrd = parcours === 'csrd-obligatoire';
  const isConseil = posture === 'conseil';
  const isPreAudit = posture === 'pre-audit';
  const isAuditExterne = posture === 'audit-externe';
  
  // Filtrer les références réglementaires selon parcours et posture
  const filteredReferences = regulatoryReferences.filter(ref => {
    const matchesSearch = searchTerm === '' || 
      ref.title_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ref.title_fr?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ref.reference_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ref.esrs_standard && ref.esrs_standard.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesPillar = pillarFilter === 'all' || ref.esrs_pillar === pillarFilter;
    const matchesType = typeFilter === 'all' || ref.reference_type === typeFilter;
    
    // Filtrage selon parcours : ESG structure = focus sur principales normes
    const matchesParcours = isCsrd || (!isCsrd && (
      ref.reference_type === 'esrs_standard' || 
      ref.audit_priority === 'critical' ||
      ref.audit_priority === 'high'
    ));
    
    return matchesSearch && matchesPillar && matchesType && matchesParcours;
  });
  
  // Statistiques
  const totalReferences = filteredReferences.length;
  const criticalReferences = filteredReferences.filter(r => r.audit_priority === 'critical').length;
  const mandatoryReferences = filteredReferences.filter(r => r.is_mandatory).length;
  
  return (
    <div className="flex-1 overflow-auto bg-[#E8F3F0] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-8 h-8 text-[#0F4C3A]" />
              <h1 className="text-2xl font-semibold text-foreground">
                {isCsrd ? 'Bibliothèque de Conformité CSRD/ESRS' : 'Standard ESG'}
              </h1>
            </div>
            <p className="text-gray-600">
              {isCsrd 
                ? 'Source de vérité réglementaire — Directive CSRD, normes ESRS et guides officiels'
                : 'Guide des bonnes pratiques et standards ESG'
              }
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exporter catalogue
            </Button>
          </div>
        </div>
        
        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Références totales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#0F4C3A]">{totalReferences}</div>
              <p className="text-xs text-gray-500 mt-1">Normes et exigences</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Exigences critiques
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{criticalReferences}</div>
              <p className="text-xs text-gray-500 mt-1">Priorité audit maximale</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Exigences obligatoires
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#059669]">{mandatoryReferences}</div>
              <p className="text-xs text-gray-500 mt-1">Non conditionnelles</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Documentation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#0F4C3A]">{regulatoryResources.length}</div>
              <p className="text-xs text-gray-500 mt-1">Ressources officielles</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Onglets principaux */}
        <Tabs defaultValue="references" className="space-y-4">
          <TabsList className="bg-white">
            <TabsTrigger value="references">Références ESRS</TabsTrigger>
            <TabsTrigger value="resources">Documentation officielle</TabsTrigger>
            <TabsTrigger value="matrix">Matrice CSRD ↔ ESRS</TabsTrigger>
          </TabsList>
          
          {/* TAB 1: Références ESRS */}
          <TabsContent value="references" className="space-y-4">
            
            {/* Recherche et filtres */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recherche et filtres</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Rechercher par code ESRS, titre, article CSRD..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <Select value={pillarFilter} onValueChange={setPillarFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Pilier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les piliers</SelectItem>
                      <SelectItem value="cross_cutting">Transverse (ESRS 1-2)</SelectItem>
                      <SelectItem value="environmental">Environnemental (E)</SelectItem>
                      <SelectItem value="social">Social (S)</SelectItem>
                      <SelectItem value="governance">Gouvernance (G)</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les types</SelectItem>
                      <SelectItem value="esrs_standard">Norme ESRS</SelectItem>
                      <SelectItem value="disclosure_requirement">Exigence (DR)</SelectItem>
                      <SelectItem value="datapoint">Datapoint</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="text-sm text-gray-600">
                  {filteredReferences.length} résultat{filteredReferences.length > 1 ? 's' : ''} trouvé{filteredReferences.length > 1 ? 's' : ''}
                </div>
              </CardContent>
            </Card>
            
            {/* Tableau des références */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Catalogue des exigences CSRD/ESRS</CardTitle>
                <CardDescription>
                  Référencement complet des directives, normes et exigences de divulgation
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-32">Code</TableHead>
                      <TableHead className="min-w-[300px]">Titre</TableHead>
                      <TableHead className="w-32">Type</TableHead>
                      <TableHead className="w-28">Pilier</TableHead>
                      <TableHead className="w-28">Nature</TableHead>
                      <TableHead className="w-28">Priorité</TableHead>
                      <TableHead className="w-32">Assurance</TableHead>
                      <TableHead className="w-24">Doc</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReferences.map((ref) => (
                      <TableRow key={ref.id}>
                        <TableCell className="font-mono text-xs font-semibold whitespace-nowrap">
                          {ref.reference_code}
                        </TableCell>
                        
                        <TableCell className="min-w-[300px]">
                          <div className="space-y-1">
                            <div className="font-medium text-sm leading-tight">{ref.title_fr || ref.title_en}</div>
                            {ref.title_fr && ref.title_en && (
                              <div className="text-xs text-gray-500 leading-tight line-clamp-2">{ref.title_en}</div>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell className="whitespace-nowrap">
                          <Badge variant="outline" className="text-xs whitespace-nowrap">
                            {ref.reference_type === 'esrs_standard' && '📚 Norme'}
                            {ref.reference_type === 'disclosure_requirement' && '📋 Exigence'}
                            {ref.reference_type === 'datapoint' && '📊 Datapoint'}
                            {ref.reference_type === 'directive' && '⚖️ Directive'}
                          </Badge>
                        </TableCell>
                        
                        <TableCell className="whitespace-nowrap">
                          {ref.esrs_pillar === 'cross_cutting' && (
                            <Badge className="bg-purple-100 text-purple-800 text-xs">Transverse</Badge>
                          )}
                          {ref.esrs_pillar === 'environmental' && (
                            <Badge className="bg-green-100 text-green-800 text-xs">E</Badge>
                          )}
                          {ref.esrs_pillar === 'social' && (
                            <Badge className="bg-blue-100 text-blue-800 text-xs">S</Badge>
                          )}
                          {ref.esrs_pillar === 'governance' && (
                            <Badge className="bg-orange-100 text-orange-800 text-xs">G</Badge>
                          )}
                        </TableCell>
                        
                        <TableCell className="whitespace-nowrap">
                          <Badge 
                            variant="outline" 
                            className={`text-xs whitespace-nowrap ${
                              ref.requirement_nature === 'quantitative' 
                                ? 'border-blue-300 text-blue-700'
                                : ref.requirement_nature === 'qualitative'
                                ? 'border-purple-300 text-purple-700'
                                : 'border-gray-300 text-gray-700'
                            }`}
                          >
                            {ref.requirement_nature === 'quantitative' && '📊 Quanti'}
                            {ref.requirement_nature === 'qualitative' && '✍️ Quali'}
                            {ref.requirement_nature === 'both' && '📊✍️ Mixte'}
                          </Badge>
                        </TableCell>
                        
                        <TableCell className="whitespace-nowrap">
                          {ref.audit_priority === 'critical' && (
                            <Badge className="bg-red-100 text-red-800 text-xs whitespace-nowrap">🔴 Critique</Badge>
                          )}
                          {ref.audit_priority === 'high' && (
                            <Badge className="bg-orange-100 text-orange-800 text-xs whitespace-nowrap">🟠 Élevée</Badge>
                          )}
                          {ref.audit_priority === 'medium' && (
                            <Badge className="bg-yellow-100 text-yellow-800 text-xs whitespace-nowrap">🟡 Moyenne</Badge>
                          )}
                          {ref.audit_priority === 'low' && (
                            <Badge className="bg-gray-100 text-gray-800 text-xs whitespace-nowrap">⚪ Faible</Badge>
                          )}
                        </TableCell>
                        
                        <TableCell className="whitespace-nowrap">
                          <Badge 
                            variant="outline"
                            className={`text-xs whitespace-nowrap ${
                              ref.assurance_level === 'reasonable'
                                ? 'border-green-300 text-green-700'
                                : ref.assurance_level === 'limited'
                                ? 'border-blue-300 text-blue-700'
                                : 'border-gray-300 text-gray-700'
                            }`}
                          >
                            {ref.assurance_level === 'reasonable' && 'Raisonnable'}
                            {ref.assurance_level === 'limited' && 'Limitée'}
                            {ref.assurance_level === 'none' && 'Aucune'}
                          </Badge>
                        </TableCell>
                        
                        <TableCell className="whitespace-nowrap">
                          <div className="flex gap-1">
                            {ref.eur_lex_url && (
                              <Button variant="ghost" size="sm" asChild title="EUR-Lex">
                                <a href={ref.eur_lex_url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </Button>
                            )}
                            {ref.efrag_document_url && (
                              <Button variant="ghost" size="sm" asChild title="Document EFRAG">
                                <a href={ref.efrag_document_url} target="_blank" rel="noopener noreferrer">
                                  <FileText className="w-3 h-3" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            
          </TabsContent>
          
          {/* TAB 2: Documentation officielle */}
          <TabsContent value="resources" className="space-y-4">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {regulatoryResources.map((resource) => (
                <Card key={resource.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-[#0F4C3A] text-white">
                            {resource.resource_type === 'directive' && '⚖️ Directive'}
                            {resource.resource_type === 'delegated_act' && '📜 Acte délégué'}
                            {resource.resource_type === 'guidance' && '📘 Guide'}
                            {resource.resource_type === 'faq' && '❓ FAQ'}
                          </Badge>
                          {resource.is_official && (
                            <Badge variant="outline" className="border-green-500 text-green-700">
                              <Shield className="w-3 h-3 mr-1" />
                              Officiel
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-base leading-tight">
                          {resource.title}
                        </CardTitle>
                      </div>
                    </div>
                    <CardDescription>
                      {resource.publisher} • {resource.publication_date?.toLocaleDateString('fr-FR')}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    {resource.description && (
                      <p className="text-sm text-gray-600">{resource.description}</p>
                    )}
                    
                    {resource.related_esrs && resource.related_esrs.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-gray-500 mb-2">ESRS concernés :</div>
                        <div className="flex flex-wrap gap-1">
                          {resource.related_esrs.map((esrs) => (
                            <Badge key={esrs} variant="outline" className="text-xs">
                              {esrs}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-2 pt-2">
                      {resource.url && (
                        <Button variant="outline" size="sm" asChild className="flex-1">
                          <a href={resource.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 justify-center">
                            <ExternalLink className="w-3 h-3" />
                            <span>Consulter</span>
                          </a>
                        </Button>
                      )}
                      {resource.pdf_url && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={resource.pdf_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 justify-center">
                            <Download className="w-3 h-3" />
                            <span>PDF</span>
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
          </TabsContent>
          
          {/* TAB 3: Matrice CSRD ↔ ESRS */}
          <TabsContent value="matrix" className="space-y-4">
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Matrice de dépendance CSRD ↔ ESRS</CardTitle>
                <CardDescription>
                  Correspondance entre obligations légales CSRD et exigences opérationnelles ESRS
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {csrdEsrsDependencies.map((dep) => (
                  <div key={dep.id} className="border rounded-lg p-4 bg-gray-50">
                    
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-blue-600 text-white font-mono">
                            {dep.csrd_article}
                          </Badge>
                          <Badge className="bg-[#059669] text-white font-mono">
                            {dep.esrs_standard}
                          </Badge>
                          <Badge 
                            variant="outline"
                            className={
                              dep.dependency_type === 'mandatory'
                                ? 'border-red-300 text-red-700'
                                : dep.dependency_type === 'conditional'
                                ? 'border-orange-300 text-orange-700'
                                : 'border-gray-300 text-gray-700'
                            }
                          >
                            {dep.dependency_type === 'mandatory' && '⚠️ Obligatoire'}
                            {dep.dependency_type === 'conditional' && '🔀 Conditionnel'}
                            {dep.dependency_type === 'optional' && 'ℹ️ Optionnel'}
                          </Badge>
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {dep.csrd_obligation_text}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold text-[#0F4C3A]">
                          {dep.coverage_percentage}%
                        </div>
                        <div className="text-xs text-gray-500">Couverture</div>
                      </div>
                    </div>
                    
                    {/* Exigences ESRS */}
                    <div className="mb-3">
                      <div className="text-xs font-medium text-gray-500 mb-2">
                        Exigences de divulgation ESRS :
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {dep.esrs_disclosure_requirements.map((dr) => (
                          <Badge key={dr} variant="outline" className="font-mono text-xs">
                            {dr}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    {/* Conditionnalité */}
                    {dep.conditionality_rule && (
                      <div className="mb-3 p-2 bg-orange-50 border border-orange-200 rounded text-sm">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="font-medium text-orange-900">Condition : </span>
                            <span className="text-orange-800">{dep.conditionality_rule}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Notes d'implémentation */}
                    {dep.implementation_notes && (
                      <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-900">
                        <div className="font-medium mb-1">📝 Notes d'implémentation :</div>
                        <div>{dep.implementation_notes}</div>
                      </div>
                    )}
                    
                    {/* Gaps communs */}
                    {dep.common_gaps && dep.common_gaps.length > 0 && (
                      <div className="p-2 bg-red-50 border border-red-200 rounded">
                        <div className="text-xs font-medium text-red-900 mb-2">
                          ⚠️ Points d'attention fréquents en audit :
                        </div>
                        <ul className="space-y-1">
                          {dep.common_gaps.map((gap, index) => (
                            <li key={index} className="text-xs text-red-800 flex items-start gap-2">
                              <span className="text-red-400 mt-0.5">•</span>
                              <span>{gap}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                  </div>
                ))}
              </CardContent>
            </Card>
            
          </TabsContent>
          
        </Tabs>
        
      </div>
    </div>
  );
}