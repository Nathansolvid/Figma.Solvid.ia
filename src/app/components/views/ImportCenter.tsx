import { useState, useCallback } from "react";
import {
  Upload, FileSpreadsheet, AlertCircle, CheckCircle2,
  Download, ArrowRight, Save, FileText, Zap, Eye,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Badge } from "@/app/components/ui/badge";
import { Progress } from "@/app/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { parseFile, ParseResult } from "@/utils/fileParser";
import { ImportFieldType, ColumnMapping, ImportStatus } from "@/types/import";
import { VSME_COL, downloadExcelTemplate, getAllTemplates } from "@/utils/excelTemplates";
import { idbPutValue, makeValueId, getPeriodsForDossier, DEFAULT_PERIOD } from "@/services/idbService";
import { useVSMEData } from "@/contexts/VSMEDataContext";
import { useDossiers } from "@/contexts/DossierContext";
import { getWorkflowById, getSectionsForWorkflow } from "@/utils/workflowLibrary";
import { smartAutoMatch, type SmartMatchResult, type RowMatch } from "@/services/smartImportMatcher";
import { SmartImportPreview } from "@/app/components/features/SmartImportPreview";

interface ImportCenterProps {
  dossierId: string;
  packType?: string;
  workflowId?: string | null; // 🆕 Phase 11 : contexte workflow
  onImportComplete?: (importedCount: number) => void;
  onNavigateToSaisie?: () => void; // 🆕 Phase 13 : navigation vers saisie après import
}

// Regex de validation des codes VSME (B1.1, C2.3, etc.)
const VSME_CODE_REGEX = /^[BC]\d+\.\d+$/;

export function ImportCenter({ dossierId, packType, workflowId, onImportComplete, onNavigateToSaisie }: ImportCenterProps) {
  const { loadDossier, getActivePeriod, setActivePeriod } = useVSMEData();
  const { getDossier } = useDossiers();

  // 🆕 Phase 12b : résoudre les périodes depuis le dossier
  const dossier = getDossier(dossierId);
  const periodMode = dossier?.periodMode ?? 'annuel';
  const periods = getPeriodsForDossier(dossier?.fiscalYear ?? '2025', periodMode, dossier?.customPeriods);

  // 🆕 Phase 11 : résoudre le workflow actif
  const activeWorkflow = workflowId ? getWorkflowById(workflowId) : null;
  const _workflowSections = workflowId ? getSectionsForWorkflow(workflowId) : null;

  const [status, setStatus] = useState<ImportStatus>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mappingTemplateName, setMappingTemplateName] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [isVSMEFormat, setIsVSMEFormat] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importedCount, setImportedCount] = useState(0);
  const [smartResult, setSmartResult] = useState<SmartMatchResult | null>(null);

  // ── Champs disponibles pour le mapping (fallback non-VSME) ──────────────────
  const availableFields: { value: ImportFieldType; label: string; required: boolean }[] = [
    { value: "entity",             label: "Entité / Site",          required: true  },
    { value: "period",             label: "Période (année)",         required: true  },
    { value: "category",           label: "Catégorie E/S/G",         required: true  },
    { value: "subcategory",        label: "Sous-catégorie",          required: false },
    { value: "indicator_code",     label: "Code indicateur",         required: true  },
    { value: "indicator_name",     label: "Nom indicateur",          required: false },
    { value: "value_numeric",      label: "Valeur numérique",        required: false },
    { value: "value_text",         label: "Valeur texte",            required: false },
    { value: "unit",               label: "Unité",                   required: true  },
    { value: "source",             label: "Source",                  required: false },
    { value: "calculation_method", label: "Méthode de calcul",       required: false },
    { value: "evidence_list",      label: "Liste preuves",           required: false },
    { value: "comments",           label: "Commentaires",            required: false },
    { value: "skip",               label: "Ignorer cette colonne",   required: false },
  ];

  // ── Drag & drop ────────────────────────────────────────────────────────────
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
  }, []);

  // ── Sélection et parsing du fichier ───────────────────────────────────────
  const MAX_FILE_SIZE_MB = 50;
  const handleFileSelect = async (selectedFile: File) => {
    setError(null);

    // Validation taille du fichier
    const sizeMB = selectedFile.size / (1024 * 1024);
    if (sizeMB > MAX_FILE_SIZE_MB) {
      toast.error(`Le fichier est trop volumineux (${sizeMB.toFixed(1)} MB). Taille maximale : ${MAX_FILE_SIZE_MB} MB.`);
      return;
    }

    setFile(selectedFile);
    setStatus("parsing");
    setIsVSMEFormat(false);
    setImportProgress(0);

    try {
      const result = await parseFile(selectedFile);
      setParseResult(result);

      // Détection automatique format VSME Solvid.IA
      const hasVSMECode  = result.headers.includes(VSME_COL.CODE);
      const hasVSMEValue = result.headers.includes(VSME_COL.VALEUR);
      const vsmeDetected = hasVSMECode && hasVSMEValue;
      setIsVSMEFormat(vsmeDetected);

      if (!vsmeDetected) {
        // 🆕 Phase 13 : tenter le smart matching (détection par code + texte)
        const smart = smartAutoMatch(result);
        if (smart.matches.some(m => m.matchSource !== 'none')) {
          // Au moins 1 ligne reconnue → mode intelligent
          setSmartResult(smart);
          setStatus("smart_preview");
          return;
        }

        // Fallback : mapping manuel classique
        const initialMappings: ColumnMapping[] = result.headers.map((header) => {
          const lowerHeader = header.toLowerCase();
          let targetField: ImportFieldType = "skip";
          if (lowerHeader.includes("entité") || lowerHeader.includes("site") || lowerHeader.includes("entity")) targetField = "entity";
          else if (lowerHeader.includes("période") || lowerHeader.includes("année") || lowerHeader.includes("period")) targetField = "period";
          else if (lowerHeader.includes("catégorie") || lowerHeader.includes("category")) targetField = "category";
          else if (lowerHeader.includes("indicateur") && lowerHeader.includes("code")) targetField = "indicator_code";
          else if (lowerHeader.includes("indicateur") || lowerHeader.includes("indicator")) targetField = "indicator_name";
          else if (lowerHeader.includes("valeur") || lowerHeader.includes("value")) targetField = "value_numeric";
          else if (lowerHeader.includes("unité") || lowerHeader.includes("unit")) targetField = "unit";
          else if (lowerHeader.includes("source")) targetField = "source";
          else if (lowerHeader.includes("commentaire") || lowerHeader.includes("comment")) targetField = "comments";
          return {
            sourceColumn: header,
            targetField,
            isRequired: availableFields.find((f) => f.value === targetField)?.required || false,
            example: result.rows[0]?.data[header] || "",
          };
        });
        setMappings(initialMappings);
      }

      setStatus("mapping");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setStatus("error");
    }
  };

  // ── Changement mapping manuel ──────────────────────────────────────────────
  const handleMappingChange = (sourceColumn: string, targetField: ImportFieldType) => {
    setMappings((prev) =>
      prev.map((m) =>
        m.sourceColumn === sourceColumn
          ? { ...m, targetField, isRequired: availableFields.find((f) => f.value === targetField)?.required || false }
          : m
      )
    );
  };

  // ── Validation du mapping manuel ───────────────────────────────────────────
  const validateMapping = (): { isValid: boolean; missingFields: string[] } => {
    const requiredFields = availableFields.filter((f) => f.required).map((f) => f.value);
    const mappedFields = mappings.map((m) => m.targetField);
    const missingFields = requiredFields.filter((rf) => !mappedFields.includes(rf));
    return { isValid: missingFields.length === 0, missingFields };
  };

  // ── Import principal ───────────────────────────────────────────────────────
  const handleImport = async () => {
    if (!parseResult) return;
    setStatus("uploading");
    setImportProgress(0);

    try {
      if (isVSMEFormat) {
        // ── Import VSME natif → écriture directe dans IDB ──────────────────
        const now = new Date().toISOString();
        // 🔧 Fix : résoudre la période RÉELLE du dossier (pas DEFAULT_PERIOD)
        const dossier = getDossier(dossierId);
        const fiscalYear = dossier?.fiscalYear ?? DEFAULT_PERIOD;
        const dossierPeriods = getPeriodsForDossier(
          fiscalYear,
          dossier?.periodMode ?? 'annuel',
          dossier?.customPeriods,
        );
        const activePeriod = getActivePeriod(dossierId);
        // Si activePeriod est le défaut ET ne correspond pas à une vraie période → prendre la 1ère
        const targetPeriod = dossierPeriods.some(p => p.id === activePeriod)
          ? activePeriod
          : dossierPeriods[0]?.id ?? fiscalYear;
        let written = 0;
        let skipped = 0;
        const total = parseResult.rows.length;

        for (let i = 0; i < total; i++) {
          const row = parseResult.rows[i];
          const code     = String(row.data[VSME_COL.CODE]  ?? '').trim();
          const rawValue = String(row.data[VSME_COL.VALEUR] ?? '').trim();

          // Ignorer les lignes sans code VSME valide ou sans valeur
          if (!code || !VSME_CODE_REGEX.test(code)) { skipped++; continue; }

          await idbPutValue({
            id:        makeValueId(dossierId, code, targetPeriod),
            dossierId,
            code,
            rawValue,
            statut:    rawValue ? 'filled' : 'empty',
            updatedAt: now,
            period:    targetPeriod,
          });

          if (rawValue) written++;
          setImportProgress(Math.round(((i + 1) / total) * 100));
        }

        // Aligner la période active sur celle utilisée pour l'import
        setActivePeriod(dossierId, targetPeriod);
        // Recharger les données dans le contexte → dashboard mis à jour
        await loadDossier(dossierId, targetPeriod);
        window.dispatchEvent(new CustomEvent('vsme-value-changed', { detail: { dossierId } }));

        setImportedCount(written);
        setStatus("completed");
        onImportComplete?.(written);

      } else {
        // ── Format non-VSME : vérifier mapping puis écrire ─────────────────
        const validation = validateMapping();
        if (!validation.isValid) {
          toast.error(`Champs obligatoires manquants : ${validation.missingFields.join(", ")}`);
          setStatus("mapping");
          return;
        }

        // Trouver les colonnes mappées vers indicator_code et value_numeric
        const codeCol   = mappings.find(m => m.targetField === "indicator_code")?.sourceColumn;
        const valueCol  = mappings.find(m => m.targetField === "value_numeric" || m.targetField === "value_text")?.sourceColumn;

        if (!codeCol || !valueCol) {
          toast.error("Impossible de détecter les colonnes Code et Valeur dans votre mapping.");
          setStatus("mapping");
          return;
        }

        const now = new Date().toISOString();
        // 🔧 Fix : résoudre la période RÉELLE du dossier
        const dossierNonVsme = getDossier(dossierId);
        const fyNonVsme = dossierNonVsme?.fiscalYear ?? DEFAULT_PERIOD;
        const periodsNonVsme = getPeriodsForDossier(
          fyNonVsme,
          dossierNonVsme?.periodMode ?? 'annuel',
          dossierNonVsme?.customPeriods,
        );
        const apNonVsme = getActivePeriod(dossierId);
        const targetPeriodNV = periodsNonVsme.some(p => p.id === apNonVsme)
          ? apNonVsme
          : periodsNonVsme[0]?.id ?? fyNonVsme;
        let written = 0;

        for (let i = 0; i < parseResult.rows.length; i++) {
          const row = parseResult.rows[i];
          const code     = String(row.data[codeCol]  ?? '').trim();
          const rawValue = String(row.data[valueCol] ?? '').trim();

          if (!code || !VSME_CODE_REGEX.test(code)) continue;

          await idbPutValue({
            id:        makeValueId(dossierId, code, targetPeriodNV),
            dossierId,
            code,
            rawValue,
            statut:    rawValue ? 'filled' : 'empty',
            updatedAt: now,
            period:    targetPeriodNV,
          });
          if (rawValue) written++;
          setImportProgress(Math.round(((i + 1) / parseResult.rows.length) * 100));
        }

        setActivePeriod(dossierId, targetPeriodNV);
        await loadDossier(dossierId, targetPeriodNV);
        window.dispatchEvent(new CustomEvent('vsme-value-changed', { detail: { dossierId } }));
        setImportedCount(written);
        setStatus("completed");
        onImportComplete?.(written);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Erreur lors de l'import : ${msg}`);
      setError(`Erreur lors de l'import : ${msg}`);
      setStatus("error");
    }
  };

  // ── Sauvegarder mapping comme template local ───────────────────────────────
  const handleSaveMapping = () => {
    if (!mappingTemplateName.trim()) { toast.error("Veuillez entrer un nom pour ce mapping"); return; }
    const template = { id: Date.now().toString(), name: mappingTemplateName, dossierId, packType, mappings, createdAt: new Date() };
    localStorage.setItem(`mapping_template_${template.id}`, JSON.stringify(template));
    toast.success(`Mapping "${mappingTemplateName}" sauvegardé !`);
    setMappingTemplateName("");
  };

  // ── Télécharger template VSME standard ────────────────────────────────────
  const handleDownloadTemplate = async () => {
    const tmpl = getAllTemplates().find(t => t.templateName === 'Module B Complet VSME');
    if (tmpl) await downloadExcelTemplate(tmpl).catch(() => toast.error("Erreur lors du téléchargement du template"));
  };

  // ── Import intelligent (smart matching) ───────────────────────────────────
  const handleSmartImport = async (confirmedMatches: RowMatch[]) => {
    setStatus("uploading");
    setImportProgress(0);

    try {
      const now = new Date().toISOString();
      // Résoudre la bonne période (même logique que l'import VSME)
      const dossierSmart = getDossier(dossierId);
      const fySmart = dossierSmart?.fiscalYear ?? DEFAULT_PERIOD;
      const periodsSmart = getPeriodsForDossier(
        fySmart,
        dossierSmart?.periodMode ?? 'annuel',
        dossierSmart?.customPeriods,
      );
      const apSmart = getActivePeriod(dossierId);
      const targetPeriodSmart = periodsSmart.some(p => p.id === apSmart)
        ? apSmart
        : periodsSmart[0]?.id ?? fySmart;

      let written = 0;
      const total = confirmedMatches.length;

      for (let i = 0; i < total; i++) {
        const match = confirmedMatches[i];
        if (!match.matchedCode || !match.rawValue) continue;

        // Normaliser la valeur (remplacer virgules par points pour les nombres)
        const cleanValue = match.rawValue.trim();

        await idbPutValue({
          id:        makeValueId(dossierId, match.matchedCode, targetPeriodSmart),
          dossierId,
          code:      match.matchedCode,
          rawValue:  cleanValue,
          statut:    cleanValue ? 'filled' : 'empty',
          updatedAt: now,
          period:    targetPeriodSmart,
        });

        written++;
        setImportProgress(Math.round(((i + 1) / total) * 100));
      }

      setActivePeriod(dossierId, targetPeriodSmart);
      await loadDossier(dossierId, targetPeriodSmart);
      window.dispatchEvent(new CustomEvent('vsme-value-changed', { detail: { dossierId } }));
      setImportedCount(written);
      setStatus("completed");
      onImportComplete?.(written);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Erreur lors de l'import intelligent : ${msg}`);
      setError(`Erreur lors de l'import intelligent : ${msg}`);
      setStatus("error");
    }
  };

  // ── Reset ──────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setStatus("idle");
    setFile(null);
    setParseResult(null);
    setMappings([]);
    setError(null);
    setIsVSMEFormat(false);
    setImportProgress(0);
    setImportedCount(0);
    setSmartResult(null);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  // Garde : un dossier réel doit être sélectionné pour importer
  if (!dossierId || dossierId === "default-dossier") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Import de données</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Importez vos données ESG depuis un modèle Excel ou un fichier CSV
          </p>
        </div>
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-6 text-center space-y-3">
            <AlertCircle className="h-10 w-10 text-amber-500 mx-auto" />
            <p className="font-medium text-amber-900">
              Veuillez d'abord sélectionner un dossier client
            </p>
            <p className="text-sm text-amber-700">
              L'import de données nécessite un dossier de destination. Sélectionnez ou créez un dossier dans le panneau de gauche.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 🆕 Phase 11 : Bannière workflow actif */}
      {activeWorkflow && (
        <Card className="border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white text-sm flex-shrink-0">
                {activeWorkflow.icon}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-900">
                  Import pour : {activeWorkflow.name}
                </p>
                <p className="text-xs text-blue-600">
                  Indicateurs attendus : sections {_workflowSections?.join(', ') ?? 'toutes'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Import de données</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Importez vos données ESG depuis un modèle Excel ou un fichier CSV
          </p>
        </div>
        <Button variant="outline" onClick={handleDownloadTemplate}>
          <Download className="h-4 w-4 mr-2" />
          Modèle ESG vierge
        </Button>
      </div>

      {/* Status indicator */}
      {status !== "idle" && status !== "error" && (
        <Card className={status === "completed" ? "bg-green-50 border-green-200" : "bg-blue-50 border-blue-200"}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              {status === "completed" ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
              ) : (
                <div className="h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              )}
              <div className="flex-1">
                <p className={`font-medium ${status === "completed" ? "text-green-900" : "text-blue-900"}`}>
                  {status === "parsing"       && "Analyse du fichier…"}
                  {status === "mapping"       && (isVSMEFormat ? "✓ Format VSME Solvid.IA détecté — prêt à importer" : "Configurez le mapping des colonnes")}
                  {status === "smart_preview" && "✨ Indicateurs détectés automatiquement — vérifiez les correspondances"}
                  {status === "uploading"     && `Import en cours… ${importProgress}%`}
                  {status === "completed"     && `Import réussi — ${importedCount} indicateur${importedCount > 1 ? "s" : ""} enregistré${importedCount > 1 ? "s" : ""}`}
                </p>
                {status === "uploading" && <Progress value={importProgress} className="mt-2" />}
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
              <p className="text-muted-foreground mb-2">
                ou cliquez pour sélectionner un fichier Excel (.xlsx, .xls) ou CSV
              </p>
              <p className="text-sm text-[#059669] font-medium mb-4">
                ✓ Les modèles téléchargés depuis la Bibliothèque sont reconnus automatiquement
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

          {/* Workflow rapide */}
          <Card className="bg-[#E8F3F0] border-[#059669]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#0A3B2E]">
                <Zap className="h-5 w-5 text-[#059669]" />
                Import rapide avec les modèles Solvid.IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-[#059669]">
                  <span className="font-bold text-[#059669]">1</span>
                  <span>Téléchargez un modèle depuis la Bibliothèque</span>
                </div>
                <ArrowRight className="h-4 w-4 text-[#059669] flex-shrink-0" />
                <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-[#059669]">
                  <span className="font-bold text-[#059669]">2</span>
                  <span>Remplissez la colonne <strong>"Valeur à saisir"</strong></span>
                </div>
                <ArrowRight className="h-4 w-4 text-[#059669] flex-shrink-0" />
                <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-[#059669]">
                  <span className="font-bold text-[#059669]">3</span>
                  <span>Déposez le fichier ici → import direct</span>
                </div>
              </div>
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
                <p className="font-medium truncate">{file.name}</p>
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
                <p className="text-sm text-muted-foreground">Format</p>
                <Badge className={isVSMEFormat ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                  {isVSMEFormat ? "✓ Solvid.IA" : "Format libre"}
                </Badge>
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

      {/* Mapping — Format VSME détecté */}
      {status === "mapping" && isVSMEFormat && parseResult && (
        <Card className="border-2 border-[#059669]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#0A3B2E]">
              <CheckCircle2 className="h-5 w-5 text-[#059669]" />
              Format Solvid.IA détecté — Import direct
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Aucune configuration requise. Les données seront importées directement dans votre dossier.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Aperçu des données */}
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code indicateur</TableHead>
                    <TableHead>Intitulé</TableHead>
                    <TableHead>Valeur à saisir</TableHead>
                    <TableHead>Unité</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parseResult.rows
                    .filter(r => {
                      const code = String(r.data[VSME_COL.CODE] ?? '').trim();
                      return code && VSME_CODE_REGEX.test(code);
                    })
                    .slice(0, 8)
                    .map((row, idx) => {
                      const code  = String(row.data[VSME_COL.CODE]      ?? '');
                      const label = String(row.data[VSME_COL.INTITULE]  ?? '');
                      const val   = String(row.data[VSME_COL.VALEUR]    ?? '');
                      const unit  = String(row.data[VSME_COL.UNITE]     ?? '');
                      return (
                        <TableRow key={idx}>
                          <TableCell><code className="text-xs bg-gray-100 px-1 rounded">{code}</code></TableCell>
                          <TableCell className="text-sm max-w-xs truncate">{label}</TableCell>
                          <TableCell>
                            {val ? (
                              <Badge className="bg-green-100 text-green-700">{val}</Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs italic">vide</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{unit}</TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
              {parseResult.rows.filter(r => VSME_CODE_REGEX.test(String(r.data[VSME_COL.CODE] ?? '').trim())).length > 8 && (
                <p className="text-xs text-muted-foreground p-3 border-t">
                  … et {parseResult.rows.filter(r => VSME_CODE_REGEX.test(String(r.data[VSME_COL.CODE] ?? '').trim())).length - 8} autres indicateurs
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-4">
              <Button variant="outline" onClick={handleReset}>Annuler</Button>
              <Button className="bg-[#059669] hover:bg-[#047857]" onClick={handleImport}>
                <Zap className="h-4 w-4 mr-2" />
                Importer {parseResult.rows.filter(r => VSME_CODE_REGEX.test(String(r.data[VSME_COL.CODE] ?? '').trim())).length} indicateurs
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 🆕 Phase 13 : Smart Import Preview */}
      {status === "smart_preview" && smartResult && parseResult && (
        <SmartImportPreview
          result={smartResult}
          parseResult={parseResult}
          onConfirm={handleSmartImport}
          onCancel={() => {
            // Fallback vers le mapping manuel
            setSmartResult(null);
            const initialMappings: ColumnMapping[] = parseResult.headers.map((header) => {
              const lowerHeader = header.toLowerCase();
              let targetField: ImportFieldType = "skip";
              if (lowerHeader.includes("entité") || lowerHeader.includes("site") || lowerHeader.includes("entity")) targetField = "entity";
              else if (lowerHeader.includes("période") || lowerHeader.includes("année") || lowerHeader.includes("period")) targetField = "period";
              else if (lowerHeader.includes("catégorie") || lowerHeader.includes("category")) targetField = "category";
              else if (lowerHeader.includes("indicateur") && lowerHeader.includes("code")) targetField = "indicator_code";
              else if (lowerHeader.includes("indicateur") || lowerHeader.includes("indicator")) targetField = "indicator_name";
              else if (lowerHeader.includes("valeur") || lowerHeader.includes("value")) targetField = "value_numeric";
              else if (lowerHeader.includes("unité") || lowerHeader.includes("unit")) targetField = "unit";
              else if (lowerHeader.includes("source")) targetField = "source";
              else if (lowerHeader.includes("commentaire") || lowerHeader.includes("comment")) targetField = "comments";
              return {
                sourceColumn: header,
                targetField,
                isRequired: availableFields.find((f) => f.value === targetField)?.required || false,
                example: parseResult.rows[0]?.data[header] || "",
              };
            });
            setMappings(initialMappings);
            setStatus("mapping");
          }}
        />
      )}

      {/* Mapping — Format libre (non-VSME) */}
      {status === "mapping" && !isVSMEFormat && parseResult && (
        <Card>
          <CardHeader>
            <CardTitle>Configuration du mapping</CardTitle>
            <p className="text-sm text-muted-foreground">
              Format non-VSME détecté. Associez chaque colonne à un champ du système.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-900">
                <strong>💡 Astuce :</strong> Utilisez les modèles de la Bibliothèque pour un import direct sans configuration.
              </AlertDescription>
            </Alert>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/3">Colonne source</TableHead>
                    <TableHead className="w-1/3">Champ cible</TableHead>
                    <TableHead className="w-1/3">Exemple</TableHead>
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

            <div className="flex items-center justify-between pt-4">
              <Button variant="outline" onClick={handleReset}>Annuler</Button>
              <Button className="bg-[#059669] hover:bg-[#047857]" onClick={handleImport}>
                Importer {parseResult.totalRows} lignes
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Uploading */}
      {status === "uploading" && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6 text-center">
            <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="font-medium text-blue-900 mb-3">Import en cours…</p>
            <Progress value={importProgress} className="max-w-sm mx-auto" />
            <p className="text-sm text-blue-700 mt-2">{importProgress}%</p>
          </CardContent>
        </Card>
      )}

      {/* Success */}
      {status === "completed" && parseResult && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-6 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-green-900 mb-2">Import réussi !</h3>
            <p className="text-green-800 mb-1">
              <strong>{importedCount}</strong> indicateur{importedCount > 1 ? "s" : ""} enregistré{importedCount > 1 ? "s" : ""} dans le dossier
            </p>
            <p className="text-sm text-green-700 mb-1">
              Le tableau de bord et les statistiques ont été mis à jour automatiquement.
            </p>
            {periods.length > 1 && (
              <p className="text-xs text-green-600 mb-5">
                Période d'import : {periods.find(p => p.id === getActivePeriod(dossierId))?.label ?? getActivePeriod(dossierId)}
              </p>
            )}
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" onClick={handleReset}>
                Importer un autre fichier
              </Button>
              {onNavigateToSaisie && (
                <Button className="bg-[#059669] hover:bg-[#047857] text-white" onClick={onNavigateToSaisie}>
                  <Eye className="h-4 w-4 mr-2" />
                  Voir les données importées
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
