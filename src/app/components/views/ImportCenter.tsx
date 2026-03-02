import { useState, useCallback } from "react";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Download, ArrowRight, Save, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Badge } from "@/app/components/ui/badge";
import { Progress } from "@/app/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { parseFile, generateExcelTemplate, downloadExcelTemplate, ParseResult } from "@/utils/fileParser";
import { ImportFieldType, ColumnMapping, ImportStatus } from "@/types/import";

interface ImportCenterProps {
  dossierId: string;
  packType?: string;
  onImportComplete?: (importedCount: number) => void;
}

export function ImportCenter({ dossierId, packType, onImportComplete }: ImportCenterProps) {
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mappingTemplateName, setMappingTemplateName] = useState("");
  const [dragActive, setDragActive] = useState(false);

  // Champs disponibles pour le mapping
  const availableFields: { value: ImportFieldType; label: string; required: boolean }[] = [
    { value: "entity", label: "Entité / Site", required: true },
    { value: "period", label: "Période (année)", required: true },
    { value: "category", label: "Catégorie E/S/G", required: true },
    { value: "subcategory", label: "Sous-catégorie", required: false },
    { value: "indicator_code", label: "Code indicateur", required: true },
    { value: "indicator_name", label: "Nom indicateur", required: false },
    { value: "value_numeric", label: "Valeur numérique", required: false },
    { value: "value_text", label: "Valeur texte", required: false },
    { value: "unit", label: "Unité", required: true },
    { value: "source", label: "Source", required: false },
    { value: "calculation_method", label: "Méthode de calcul", required: false },
    { value: "evidence_list", label: "Liste preuves", required: false },
    { value: "comments", label: "Commentaires", required: false },
    { value: "skip", label: "Ignorer cette colonne", required: false },
  ];

  // Gestion drag & drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, []);

  // Sélection fichier
  const handleFileSelect = async (selectedFile: File) => {
    setError(null);
    setFile(selectedFile);
    setStatus("parsing");

    try {
      const result = await parseFile(selectedFile);
      setParseResult(result);
      
      // Initialiser les mappings avec détection automatique
      const initialMappings: ColumnMapping[] = result.headers.map((header) => {
        const lowerHeader = header.toLowerCase();
        
        // Détection automatique basique
        let targetField: ImportFieldType = "skip";
        
        if (lowerHeader.includes("entité") || lowerHeader.includes("site") || lowerHeader.includes("entity")) {
          targetField = "entity";
        } else if (lowerHeader.includes("période") || lowerHeader.includes("année") || lowerHeader.includes("period")) {
          targetField = "period";
        } else if (lowerHeader.includes("catégorie") || lowerHeader.includes("category")) {
          targetField = "category";
        } else if (lowerHeader.includes("indicateur") && lowerHeader.includes("code")) {
          targetField = "indicator_code";
        } else if (lowerHeader.includes("indicateur") || lowerHeader.includes("indicator")) {
          targetField = "indicator_name";
        } else if (lowerHeader.includes("valeur") || lowerHeader.includes("value")) {
          targetField = "value_numeric";
        } else if (lowerHeader.includes("unité") || lowerHeader.includes("unit")) {
          targetField = "unit";
        } else if (lowerHeader.includes("source")) {
          targetField = "source";
        } else if (lowerHeader.includes("commentaire") || lowerHeader.includes("comment")) {
          targetField = "comments";
        }

        return {
          sourceColumn: header,
          targetField,
          isRequired: availableFields.find((f) => f.value === targetField)?.required || false,
          example: result.rows[0]?.data[header] || "",
        };
      });

      setMappings(initialMappings);
      setStatus("mapping");
    } catch (err: any) {
      setError(err.message);
      setStatus("error");
    }
  };

  // Changement de mapping
  const handleMappingChange = (sourceColumn: string, targetField: ImportFieldType) => {
    setMappings((prev) =>
      prev.map((m) =>
        m.sourceColumn === sourceColumn
          ? { ...m, targetField, isRequired: availableFields.find((f) => f.value === targetField)?.required || false }
          : m
      )
    );
  };

  // Validation du mapping
  const validateMapping = (): { isValid: boolean; missingFields: string[] } => {
    const requiredFields = availableFields.filter((f) => f.required).map((f) => f.value);
    const mappedFields = mappings.map((m) => m.targetField);
    const missingFields = requiredFields.filter((rf) => !mappedFields.includes(rf));

    return {
      isValid: missingFields.length === 0,
      missingFields,
    };
  };

  // Sauvegarder le mapping comme template
  const handleSaveMapping = () => {
    if (!mappingTemplateName.trim()) {
      alert("Veuillez entrer un nom pour ce mapping");
      return;
    }

    // Ici on sauvegarderait dans Supabase ou localStorage
    const template = {
      id: Date.now().toString(),
      name: mappingTemplateName,
      description: `Mapping pour ${file?.name}`,
      dossierId,
      packType,
      mappings,
      createdAt: new Date(),
    };

    // Simulation sauvegarde
    localStorage.setItem(`mapping_template_${template.id}`, JSON.stringify(template));
    alert(`Mapping "${mappingTemplateName}" sauvegardé avec succès !`);
    setMappingTemplateName("");
  };

  // Importer les données
  const handleImport = () => {
    const validation = validateMapping();
    
    if (!validation.isValid) {
      alert(`Champs obligatoires manquants : ${validation.missingFields.join(", ")}`);
      return;
    }

    setStatus("uploading");

    // Simulation import (ici on enverrait à Supabase)
    setTimeout(() => {
      setStatus("completed");
      if (onImportComplete) {
        onImportComplete(parseResult?.totalRows || 0);
      }
    }, 2000);
  };

  // Télécharger template Excel
  const handleDownloadTemplate = () => {
    const headers = availableFields
      .filter((f) => f.required || f.value === "source")
      .map((f) => f.label);

    const exampleRow: Record<string, string> = {
      "Entité / Site": "Siège social",
      "Période (année)": "2024",
      "Catégorie E/S/G": "E",
      "Code indicateur": "GHG-SCOPE1",
      "Unité": "tCO2e",
      "Source": "Bilan GES 2024",
    };

    const templateData = generateExcelTemplate(headers, exampleRow);
    downloadExcelTemplate(`Template_Import_${dossierId}_${Date.now()}.xlsx`, templateData);
  };

  // Reset
  const handleReset = () => {
    setStatus("idle");
    setFile(null);
    setParseResult(null);
    setMappings([]);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Import Center</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Importez vos données ESG depuis Excel ou CSV
          </p>
        </div>
        <Button variant="outline" onClick={handleDownloadTemplate}>
          <Download className="h-4 w-4 mr-2" />
          Télécharger template
        </Button>
      </div>

      {/* Status indicator */}
      {status !== "idle" && status !== "error" && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              {status === "completed" ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <div className="h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              )}
              <div className="flex-1">
                <p className="font-medium text-blue-900">
                  {status === "parsing" && "Analyse du fichier..."}
                  {status === "mapping" && "Configurez le mapping des colonnes"}
                  {status === "uploading" && "Import des données en cours..."}
                  {status === "completed" && "Import terminé avec succès !"}
                </p>
                {status === "uploading" && <Progress value={60} className="mt-2" />}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Upload Zone */}
      {status === "idle" && (
        <>
          <Card
            className={`border-2 border-dashed transition-colors cursor-pointer ${
              dragActive ? "border-[#059669] bg-[#E8F3F0]" : "border-gray-300 hover:border-[#059669]"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById("file-upload")?.click()}
          >
            <CardContent className="p-12 text-center">
              <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Déposez votre fichier ici</h3>
              <p className="text-muted-foreground mb-4">
                ou cliquez pour sélectionner un fichier Excel (.xlsx, .xls) ou CSV
              </p>
              <input
                id="file-upload"
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <FileSpreadsheet className="h-4 w-4" />
                <span>Formats supportés : CSV, XLSX, XLS</span>
              </div>
            </CardContent>
          </Card>

          {/* Colonnes attendues */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#059669]" />
                Colonnes attendues dans votre fichier Excel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableFields
                  .filter((f) => f.value !== "skip")
                  .map((field) => (
                    <div
                      key={field.value}
                      className={`flex items-start gap-3 p-3 rounded-lg ${
                        field.required ? "bg-red-50 border border-red-200" : "bg-gray-50"
                      }`}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {field.required ? (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{field.label}</p>
                          {field.required && (
                            <Badge className="bg-red-100 text-red-700 text-xs">Requis</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Code technique : <code className="bg-white px-1 rounded">{field.value}</code>
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
              <Alert className="mt-4 bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-900">
                  <strong>💡 Astuce :</strong> Téléchargez le template Excel ci-dessus pour partir d'un fichier 
                  pré-formaté avec toutes les colonnes requises.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </>
      )}

      {/* File Info */}
      {file && status !== "idle" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#059669]" />
              Fichier chargé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Nom du fichier</p>
                <p className="font-medium">{file.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taille</p>
                <p className="font-medium">{(file.size / 1024).toFixed(2)} KB</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lignes</p>
                <p className="font-medium">{parseResult?.totalRows || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Colonnes</p>
                <p className="font-medium">{parseResult?.totalColumns || 0}</p>
              </div>
            </div>
            {status !== "completed" && (
              <Button variant="outline" size="sm" onClick={handleReset} className="mt-4">
                Changer de fichier
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Mapping Configuration */}
      {status === "mapping" && parseResult && (
        <Card>
          <CardHeader>
            <CardTitle>Configuration du mapping</CardTitle>
            <p className="text-sm text-muted-foreground">
              Associez chaque colonne de votre fichier à un champ du système
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Mapping table */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/3">Colonne source</TableHead>
                    <TableHead className="w-1/3">Champ cible</TableHead>
                    <TableHead className="w-1/3">Exemple de valeur</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mappings.map((mapping, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{mapping.sourceColumn}</TableCell>
                      <TableCell>
                        <Select
                          value={mapping.targetField}
                          onValueChange={(value) =>
                            handleMappingChange(mapping.sourceColumn, value as ImportFieldType)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {availableFields.map((field) => (
                              <SelectItem key={field.value} value={field.value}>
                                {field.label} {field.required && <span className="text-red-500">*</span>}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {String(mapping.example).substring(0, 30)}
                          {String(mapping.example).length > 30 && "..."}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Save mapping template */}
            <div className="flex items-end gap-2 pt-4 border-t">
              <div className="flex-1">
                <Label htmlFor="template-name">Sauvegarder ce mapping (optionnel)</Label>
                <Input
                  id="template-name"
                  placeholder="Ex: Import mensuel données carbone"
                  value={mappingTemplateName}
                  onChange={(e) => setMappingTemplateName(e.target.value)}
                />
              </div>
              <Button variant="outline" onClick={handleSaveMapping} disabled={!mappingTemplateName.trim()}>
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder
              </Button>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4">
              <Button variant="outline" onClick={handleReset}>
                Annuler
              </Button>
              <Button className="bg-[#059669] hover:bg-[#047857]" onClick={handleImport}>
                Importer {parseResult.totalRows} lignes
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success state */}
      {status === "completed" && parseResult && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-6 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-green-900 mb-2">Import réussi !</h3>
            <p className="text-green-800 mb-4">
              {parseResult.totalRows} lignes ont été importées avec succès dans le dossier
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" onClick={handleReset}>
                Importer un autre fichier
              </Button>
              <Button className="bg-[#059669] hover:bg-[#047857]">Voir les données importées</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}