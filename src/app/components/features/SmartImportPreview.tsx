/**
 * SmartImportPreview — Prévisualisation interactive de l'import intelligent
 *
 * Affiche les lignes détectées, leur confiance, et permet la correction manuelle
 * avant de confirmer l'import.
 */
import { useState, useMemo } from "react";
import {
  Search, CheckCircle2, AlertTriangle, XCircle,
  ChevronDown, Sparkles, ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Progress } from "@/app/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/app/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/app/components/ui/select";
import { Checkbox } from "@/app/components/ui/checkbox";

import type { SmartMatchResult, RowMatch } from "@/services/smartImportMatcher";
import type { ParseResult } from "@/types/import";
import type { Datapoint } from "@/data/vsme-data";
import { MODULE_B, MODULE_C } from "@/data/vsme-data";

// ─── Props ──────────────────────────────────────────────────────────────────

interface SmartImportPreviewProps {
  result: SmartMatchResult;
  parseResult: ParseResult;
  onConfirm: (confirmedMatches: RowMatch[]) => void;
  onCancel: () => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getAllDatapoints(): Datapoint[] {
  return [
    ...MODULE_B.flatMap((s) => s.datapoints),
    ...MODULE_C.flatMap((s) => s.datapoints),
  ];
}

function confidenceBadge(confidence: number, source: RowMatch["matchSource"]) {
  if (source === "none") {
    return (
      <Badge variant="secondary" className="bg-gray-100 text-gray-500 text-xs gap-1">
        <XCircle className="h-3 w-3" />
        Non reconnu
      </Badge>
    );
  }
  // Code exact → toujours fiable
  if (source === "code") {
    return (
      <Badge className="bg-green-100 text-green-700 text-xs gap-1">
        <CheckCircle2 className="h-3 w-3" />
        Exact
      </Badge>
    );
  }
  // Texte haute confiance (≥85%)
  if (confidence >= 0.85) {
    return (
      <Badge className="bg-green-100 text-green-700 text-xs gap-1">
        <CheckCircle2 className="h-3 w-3" />
        {Math.round(confidence * 100)}%
      </Badge>
    );
  }
  // Texte confiance moyenne (50-84%) → attention
  if (confidence >= 0.5) {
    return (
      <Badge className="bg-yellow-100 text-yellow-700 text-xs gap-1">
        <AlertTriangle className="h-3 w-3" />
        {Math.round(confidence * 100)}% — à vérifier
      </Badge>
    );
  }
  // Texte faible confiance (<50%) → risque de faux positif
  return (
    <Badge className="bg-orange-100 text-orange-700 text-xs gap-1">
      <AlertTriangle className="h-3 w-3" />
      {Math.round(confidence * 100)}% — incertain
    </Badge>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export function SmartImportPreview({
  result,
  parseResult: _parseResult,
  onConfirm,
  onCancel,
}: SmartImportPreviewProps) {
  const allDatapoints = useMemo(getAllDatapoints, []);

  // État local : sélection des lignes + overrides manuels
  // Auto-sélectionner seulement les lignes à haute confiance (≥85%) ou par code exact
  // Les lignes textuelles < 85% ne sont PAS auto-sélectionnées → l'utilisateur doit vérifier
  const [selected, setSelected] = useState<Set<number>>(() => {
    const initial = new Set<number>();
    result.matches.forEach((m, i) => {
      if (!m.rawValue) return; // pas de valeur → pas sélectionné
      if (m.matchSource === "code") {
        initial.add(i); // code exact → toujours sélectionné
      } else if (m.matchSource === "text" && m.confidence >= 0.85) {
        initial.add(i); // texte haute confiance → sélectionné
      }
      // texte < 85% → NON sélectionné (l'utilisateur doit cocher manuellement)
    });
    return initial;
  });

  const [overrides, setOverrides] = useState<Record<number, string>>({});
  const [showUnmatched, setShowUnmatched] = useState(true);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const matchedCount = result.matches.filter(
    (m) => m.matchSource !== "none"
  ).length;
  const selectedCount = selected.size;

  // ── Détection de doublons : codes sélectionnés apparaissant plusieurs fois ──
  const duplicateCodes = useMemo(() => {
    const codeCount = new Map<string, number[]>();
    for (const idx of selected) {
      const match = result.matches[idx];
      if (!match) continue;
      const code = overrides[idx] || match.matchedCode;
      if (!code) continue;
      const existing = codeCount.get(code) || [];
      existing.push(idx);
      codeCount.set(code, existing);
    }
    // Retourner seulement les codes qui apparaissent plus d'une fois
    const dupes = new Map<string, number[]>();
    for (const [code, indices] of codeCount) {
      if (indices.length > 1) dupes.set(code, indices);
    }
    return dupes;
  }, [selected, overrides, result.matches]);

  // ── Toggle sélection ─────────────────────────────────────────────────────
  const toggleRow = (index: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === result.matches.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(result.matches.map((_, i) => i)));
    }
  };

  // ── Override manuel ──────────────────────────────────────────────────────
  const handleOverride = (index: number, code: string) => {
    setOverrides((prev) => ({ ...prev, [index]: code }));
    // Auto-sélectionner la ligne
    setSelected((prev) => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });
  };

  // ── Confirmer ────────────────────────────────────────────────────────────
  const handleConfirm = () => {
    const confirmed: RowMatch[] = [];

    for (const idx of selected) {
      const match = result.matches[idx];
      if (!match) continue;

      const overrideCode = overrides[idx];
      if (overrideCode) {
        // Override manuel : remplacer le code et l'intitulé
        const dp = allDatapoints.find((d) => d.code === overrideCode);
        confirmed.push({
          ...match,
          matchedCode: overrideCode,
          matchedIntitule: dp?.intitule ?? overrideCode,
          matchSource: match.matchSource === "none" ? "text" : match.matchSource,
          confidence: 1.0, // Manuel = confiance max
        });
      } else if (match.matchedCode) {
        confirmed.push(match);
      }
    }

    onConfirm(confirmed);
  };

  // ── Lignes filtrées ──────────────────────────────────────────────────────
  const visibleMatches = showUnmatched
    ? result.matches
    : result.matches.filter((m) => m.matchSource !== "none");

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Header avec stats */}
      <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-white">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-purple-900">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Détection intelligente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Barre de progression */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-purple-800 font-medium">
                {matchedCount}/{result.totalRows} lignes reconnues ({Math.round(result.matchRate * 100)}%)
              </span>
              <span className="text-purple-600">
                {selectedCount} sélectionnée{selectedCount > 1 ? "s" : ""} pour import
              </span>
            </div>
            <Progress
              value={result.matchRate * 100}
              className="h-2"
            />
          </div>

          {/* Colonnes détectées */}
          <div className="grid grid-cols-3 gap-3">
            <div className={`rounded-lg p-3 text-sm ${result.codeColumn ? "bg-green-50 border border-green-200" : "bg-gray-50 border border-gray-200"}`}>
              <p className="font-medium text-xs text-gray-500 mb-1">Colonne Code</p>
              {result.codeColumn ? (
                <>
                  <p className="font-semibold text-green-800">"{result.codeColumn.columnName}"</p>
                  <p className="text-xs text-green-600">{result.codeColumn.matchCount} codes trouvés</p>
                </>
              ) : (
                <p className="text-gray-400 italic">Non détectée</p>
              )}
            </div>

            <div className={`rounded-lg p-3 text-sm ${result.textColumn ? "bg-blue-50 border border-blue-200" : "bg-gray-50 border border-gray-200"}`}>
              <p className="font-medium text-xs text-gray-500 mb-1">Colonne Texte</p>
              {result.textColumn ? (
                <>
                  <p className="font-semibold text-blue-800">"{result.textColumn.columnName}"</p>
                  <p className="text-xs text-blue-600">{result.textColumn.matchCount} textes matchés</p>
                </>
              ) : (
                <p className="text-gray-400 italic">Non détectée</p>
              )}
            </div>

            <div className={`rounded-lg p-3 text-sm ${result.valueColumn ? "bg-amber-50 border border-amber-200" : "bg-gray-50 border border-gray-200"}`}>
              <p className="font-medium text-xs text-gray-500 mb-1">Colonne Valeur</p>
              {result.valueColumn ? (
                <>
                  <p className="font-semibold text-amber-800">"{result.valueColumn.columnName}"</p>
                  <p className="text-xs text-amber-600">{result.valueColumn.matchCount} valeurs numériques</p>
                </>
              ) : (
                <p className="text-gray-400 italic">Non détectée</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des lignes */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Correspondances détectées</CardTitle>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                <Checkbox
                  checked={showUnmatched}
                  onCheckedChange={(v) => setShowUnmatched(!!v)}
                />
                Afficher les non-reconnus
              </label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Avertissement doublons */}
          {duplicateCodes.size > 0 && (
            <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Doublons détectés</p>
                  <p className="text-xs mt-1">
                    {Array.from(duplicateCodes.keys()).map(code => (
                      <span key={code} className="inline-block mr-2">
                        <code className="bg-amber-100 px-1 rounded">{code}</code> ({duplicateCodes.get(code)!.length} lignes)
                      </span>
                    ))}
                  </p>
                  <p className="text-xs mt-1 text-amber-600">
                    Seule la dernière valeur sera conservée. Décochez les doublons indésirables.
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="border rounded-lg overflow-hidden max-h-[500px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-10">
                    <Checkbox
                      checked={selected.size === result.matches.length}
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead className="w-12 text-xs">Ligne</TableHead>
                  <TableHead className="text-xs">Donnée Excel</TableHead>
                  <TableHead className="text-xs">
                    <div className="flex items-center gap-1">
                      <ArrowRight className="h-3 w-3" />
                      Indicateur VSME
                    </div>
                  </TableHead>
                  <TableHead className="w-24 text-xs">Valeur</TableHead>
                  <TableHead className="w-28 text-xs">Confiance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleMatches.map((match, _visibleIdx) => {
                  // Trouver l'index réel dans result.matches
                  const realIdx = result.matches.indexOf(match);
                  const isSelected = selected.has(realIdx);
                  const hasOverride = overrides[realIdx] !== undefined;
                  const displayCode = hasOverride ? overrides[realIdx] : match.matchedCode;
                  const isDuplicate = displayCode ? duplicateCodes.has(displayCode) && isSelected : false;

                  return (
                    <TableRow
                      key={realIdx}
                      className={`${
                        isDuplicate
                          ? "bg-amber-50 border-l-2 border-l-amber-400"
                          : isSelected
                          ? match.matchSource === "none" && !hasOverride
                            ? "bg-yellow-50"
                            : "bg-green-50/50"
                          : "opacity-60"
                      } transition-colors`}
                    >
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleRow(realIdx)}
                        />
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {match.rowNumber}
                      </TableCell>

                      <TableCell className="max-w-[200px]">
                        <p className="text-sm truncate" title={match.rawLabel}>
                          {match.rawLabel}
                        </p>
                        {match.matchSource === "text" && (
                          <p className="text-[10px] text-blue-500 mt-0.5">
                            <Search className="h-2.5 w-2.5 inline mr-0.5" />
                            Matching textuel
                          </p>
                        )}
                        {match.matchSource === "code" && (
                          <p className="text-[10px] text-green-600 mt-0.5">
                            Code détecté
                          </p>
                        )}
                      </TableCell>

                      <TableCell>
                        {match.matchSource !== "none" && !hasOverride ? (
                          <div className="space-y-0.5">
                            <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-semibold">
                              {match.matchedCode}
                            </code>
                            <p className="text-[11px] text-muted-foreground truncate max-w-[180px]" title={match.matchedIntitule}>
                              {match.matchedIntitule}
                            </p>
                          </div>
                        ) : (
                          <Select
                            value={displayCode ?? ""}
                            onValueChange={(val) => handleOverride(realIdx, val)}
                          >
                            <SelectTrigger className="h-8 text-xs w-full">
                              <SelectValue placeholder="Choisir un indicateur…">
                                {displayCode ? (
                                  <span className="flex items-center gap-1">
                                    <code className="bg-gray-100 px-1 rounded">{displayCode}</code>
                                    {allDatapoints.find(d => d.code === displayCode)?.intitule?.substring(0, 25)}…
                                  </span>
                                ) : (
                                  "Choisir un indicateur…"
                                )}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                              {allDatapoints.map((dp) => (
                                <SelectItem key={dp.code} value={dp.code}>
                                  <span className="flex items-center gap-2 text-xs">
                                    <code className="bg-gray-100 px-1 rounded font-semibold">{dp.code}</code>
                                    <span className="truncate max-w-[200px]">{dp.intitule}</span>
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>

                      <TableCell>
                        {match.rawValue ? (
                          <Badge variant="secondary" className="text-xs font-mono">
                            {match.rawValue.length > 15
                              ? `${match.rawValue.substring(0, 15)}…`
                              : match.rawValue}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">vide</span>
                        )}
                      </TableCell>

                      <TableCell>
                        {hasOverride ? (
                          <Badge className="bg-purple-100 text-purple-700 text-xs gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Manuel
                          </Badge>
                        ) : (
                          confidenceBadge(match.confidence, match.matchSource)
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 mt-4 border-t">
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={onCancel}>
                <ChevronDown className="h-4 w-4 mr-1 -rotate-90" />
                Mapping manuel
              </Button>
              <p className="text-xs text-muted-foreground">
                Préférez le mapping classique si la détection ne correspond pas
              </p>
            </div>
            <Button
              className="bg-[#059669] hover:bg-[#047857]"
              onClick={handleConfirm}
              disabled={selectedCount === 0}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Confirmer l'import de {selectedCount} indicateur{selectedCount > 1 ? "s" : ""}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
