// Moteur de calcul pour indicateurs avec recalcul automatique

import { evaluate as mathEvaluate } from 'mathjs';
import {
  Indicator,
  CalculationMethod,
  CalculationStep,
  SourceDataLine,
  RecalculationResult
} from "@/types/indicators";

/**
 * Calcule la valeur d'un indicateur basé sur sa méthode de calcul
 */
export function calculateIndicatorValue(indicator: Indicator): number | string | null {
  const { calculationMethod, sourceDataLines, formula } = indicator;

  if (sourceDataLines.length === 0) {
    return null;
  }

  switch (calculationMethod) {
    case "sum":
      return calculateSum(sourceDataLines);
    
    case "average":
      return calculateAverage(sourceDataLines);
    
    case "weighted_avg":
      return calculateWeightedAverage(sourceDataLines);
    
    case "formula":
      if (!formula) return null;
      return calculateFormula(formula, sourceDataLines);
    
    case "manual":
      return indicator.currentValue; // Pas de recalcul pour saisie manuelle
    
    default:
      return null;
  }
}

/**
 * Calcule une somme simple
 */
function calculateSum(lines: SourceDataLine[]): number {
  return lines.reduce((sum, line) => {
    const value = typeof line.value === "number" ? line.value : parseFloat(String(line.value));
    return sum + (isNaN(value) ? 0 : value);
  }, 0);
}

/**
 * Calcule une moyenne
 */
function calculateAverage(lines: SourceDataLine[]): number {
  if (lines.length === 0) return 0;
  const sum = calculateSum(lines);
  return sum / lines.length;
}

/**
 * Calcule une moyenne pondérée (suppose que les poids sont dans les données)
 */
function calculateWeightedAverage(lines: SourceDataLine[]): number {
  // Implémentation simplifiée - à adapter selon structure données
  let totalWeight = 0;
  let weightedSum = 0;

  lines.forEach((line) => {
    const value = typeof line.value === "number" ? line.value : parseFloat(String(line.value));
    const weight = 1; // Par défaut poids = 1 (à récupérer depuis les données si disponible)
    
    if (!isNaN(value)) {
      weightedSum += value * weight;
      totalWeight += weight;
    }
  });

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

/**
 * Évalue une formule personnalisée
 */
function calculateFormula(
  formula: { expression: string; variables: Record<string, string> },
  lines: SourceDataLine[]
): number | null {
  try {
    // Regrouper les lignes par variable
    const variableValues: Record<string, number> = {};

    Object.entries(formula.variables).forEach(([varName, indicatorCode]) => {
      const matchingLines = lines.filter((line) => {
        // Matcher selon le code indicateur (à adapter selon structure)
        return true; // Simplification
      });
      variableValues[varName] = calculateSum(matchingLines);
    });

    // Remplacer les variables dans l'expression
    let expression = formula.expression;
    Object.entries(variableValues).forEach(([varName, value]) => {
      expression = expression.replace(new RegExp(varName, "g"), String(value));
    });

    // Évaluer l'expression de manière sécurisée
    // ATTENTION : eval() est dangereux en production, utiliser une lib comme mathjs
    const result = evaluateSafely(expression);
    return result;
  } catch (error) {
    console.error("Erreur calcul formule:", error);
    return null;
  }
}

/**
 * Évalue une expression mathématique de manière sécurisée via mathjs
 * Pas de new Function() / eval() — uniquement des opérations numériques sandboxées
 */
function evaluateSafely(expression: string): number {
  // Validation préliminaire : autoriser uniquement nombres, opérateurs, parenthèses
  const safeRegex = /^[\d+\-*/(). ]+$/;
  if (!safeRegex.test(expression)) {
    throw new Error("Expression non sécurisée");
  }

  try {
    const result = mathEvaluate(expression);
    return typeof result === "number" && isFinite(result) ? result : 0;
  } catch (error) {
    console.error("Erreur évaluation expression:", error);
    return 0;
  }
}

/**
 * Génère les étapes de calcul détaillées
 */
export function generateCalculationSteps(indicator: Indicator): CalculationStep[] {
  const { calculationMethod, sourceDataLines, formula } = indicator;
  const steps: CalculationStep[] = [];

  if (sourceDataLines.length === 0) {
    return steps;
  }

  switch (calculationMethod) {
    case "sum":
      steps.push({
        step: 1,
        description: "Somme de toutes les valeurs sources",
        operation: "SUM",
        inputs: sourceDataLines,
        result: calculateSum(sourceDataLines),
        unit: indicator.unit,
      });
      break;

    case "average":
      const sum = calculateSum(sourceDataLines);
      steps.push(
        {
          step: 1,
          description: "Somme de toutes les valeurs",
          operation: "SUM",
          inputs: sourceDataLines,
          result: sum,
          unit: indicator.unit,
        },
        {
          step: 2,
          description: `Division par le nombre de valeurs (${sourceDataLines.length})`,
          operation: "DIVIDE",
          inputs: [],
          result: sum / sourceDataLines.length,
          unit: indicator.unit,
        }
      );
      break;

    case "formula":
      if (formula) {
        // Générer une étape par variable
        let stepNum = 1;
        Object.entries(formula.variables).forEach(([varName, indicatorCode]) => {
          const matchingLines = sourceDataLines; // Simplification
          steps.push({
            step: stepNum++,
            description: `Calculer ${varName} (${indicatorCode})`,
            operation: "SUM",
            inputs: matchingLines,
            result: calculateSum(matchingLines),
            unit: indicator.unit,
          });
        });

        // Étape finale : application formule
        steps.push({
          step: stepNum,
          description: `Application de la formule: ${formula.expression}`,
          operation: "FORMULA",
          inputs: [],
          result: calculateFormula(formula, sourceDataLines) || 0,
          unit: indicator.unit,
        });
      }
      break;

    case "manual":
      steps.push({
        step: 1,
        description: "Valeur saisie manuellement",
        operation: "MANUAL",
        inputs: [],
        result: indicator.currentValue || 0,
        unit: indicator.unit,
      });
      break;
  }

  return steps;
}

/**
 * Recalcule un indicateur et retourne le résultat avec détails
 */
export function recalculateIndicator(indicator: Indicator): RecalculationResult {
  const oldValue = indicator.currentValue;
  const newValue = calculateIndicatorValue(indicator);
  const changed = oldValue !== newValue;

  const calculationLog: string[] = [];
  calculationLog.push(`[${new Date().toISOString()}] Début recalcul indicateur ${indicator.code}`);
  calculationLog.push(`Méthode: ${indicator.calculationMethod}`);
  calculationLog.push(`Lignes sources: ${indicator.sourceDataLines.length}`);
  calculationLog.push(`Ancienne valeur: ${oldValue}`);
  calculationLog.push(`Nouvelle valeur: ${newValue}`);
  calculationLog.push(`Changement: ${changed ? "OUI" : "NON"}`);

  return {
    indicatorId: indicator.id,
    oldValue,
    newValue,
    changed,
    timestamp: new Date(),
    affectedIndicators: [], // À implémenter : détection dépendances
    calculationLog,
  };
}

/**
 * Recalcule tous les indicateurs d'un dossier
 */
export function recalculateAllIndicators(indicators: Indicator[]): RecalculationResult[] {
  const results: RecalculationResult[] = [];

  // Trier par ordre de dépendances (indicateurs simples d'abord)
  const sorted = sortIndicatorsByDependency(indicators);

  sorted.forEach((indicator) => {
    const result = recalculateIndicator(indicator);
    results.push(result);

    // Mettre à jour l'indicateur si changé
    if (result.changed) {
      indicator.currentValue = result.newValue;
      indicator.lastUpdated = new Date();
    }
  });

  return results;
}

/**
 * Trie les indicateurs par ordre de dépendances
 * Les indicateurs sans formule sont calculés en premier
 */
function sortIndicatorsByDependency(indicators: Indicator[]): Indicator[] {
  const withoutFormula = indicators.filter((i) => i.calculationMethod !== "formula");
  const withFormula = indicators.filter((i) => i.calculationMethod === "formula");

  return [...withoutFormula, ...withFormula];
}

/**
 * Détecte si un indicateur nécessite un recalcul
 */
export function needsRecalculation(indicator: Indicator): boolean {
  // Si aucune ligne source, pas de recalcul nécessaire
  if (indicator.sourceDataLines.length === 0) {
    return false;
  }

  // Si calcul manuel, pas de recalcul auto
  if (indicator.calculationMethod === "manual") {
    return false;
  }

  // Vérifier si des lignes sources ont été modifiées après lastUpdated
  const hasNewData = indicator.sourceDataLines.some((line) => {
    return line.importedAt > indicator.lastUpdated;
  });

  return hasNewData;
}

/**
 * Formate un nombre pour affichage
 */
export function formatIndicatorValue(
  value: number | string | null,
  unit: string,
  decimals: number = 2
): string {
  if (value === null || value === undefined) {
    return "Non calculé";
  }

  if (typeof value === "string") {
    return value;
  }

  const formatted = value.toLocaleString("fr-FR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return `${formatted} ${unit}`;
}
