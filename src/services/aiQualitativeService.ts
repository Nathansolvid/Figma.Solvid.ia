/**
 * Service IA pour la génération de données qualitatives ESG
 * Utilise l'API Anthropic Claude (direct browser access via anthropic-dangerous-direct-browser-access)
 * La clé API est stockée en sessionStorage avec obfuscation (non persistée entre sessions)
 */

// ─── Storage keys ────────────────────────────────────────────────────────────
export const AI_KEY_STORAGE = "solvid_ai_api_key";
export const AI_MODEL_REPORT_STORAGE = "solvid_ai_model_report";
export const AI_MODEL_INDICATOR_STORAGE = "solvid_ai_model_indicator";

// ─── Available models ────────────────────────────────────────────────────────
export const AVAILABLE_REPORT_MODELS = [
  { id: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4 (recommandé)' },
  { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
];

export const AVAILABLE_INDICATOR_MODELS = [
  { id: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku (recommandé)' },
  { id: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
];

// ─── Simple obfuscation (prevents casual exposure in DevTools) ──────────────
const _OBF_PREFIX = "sk_obf:";
function _obfuscate(plain: string): string {
  return _OBF_PREFIX + btoa(plain.split('').reverse().join(''));
}
function _deobfuscate(stored: string): string {
  if (!stored.startsWith(_OBF_PREFIX)) return stored; // legacy plain-text fallback
  return atob(stored.slice(_OBF_PREFIX.length)).split('').reverse().join('');
}

// ─── API key getter/setter ───────────────────────────────────────────────────
export function getStoredApiKey(): string | null {
  try {
    // Environment variable takes priority (dev mode)
    const envKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (envKey && typeof envKey === 'string' && envKey.trim()) return envKey.trim();
    // sessionStorage first, then migrate from old localStorage
    const sessVal = sessionStorage.getItem(AI_KEY_STORAGE);
    if (sessVal) return _deobfuscate(sessVal);
    // Migrate old localStorage key if present
    const oldVal = localStorage.getItem(AI_KEY_STORAGE);
    if (oldVal) {
      sessionStorage.setItem(AI_KEY_STORAGE, _obfuscate(oldVal));
      localStorage.removeItem(AI_KEY_STORAGE);
      return oldVal;
    }
    return null;
  } catch {
    return null;
  }
}

export function setStoredApiKey(key: string): void {
  try {
    if (key.trim()) {
      sessionStorage.setItem(AI_KEY_STORAGE, _obfuscate(key.trim()));
    } else {
      sessionStorage.removeItem(AI_KEY_STORAGE);
    }
    // Always clean up old localStorage entry
    localStorage.removeItem(AI_KEY_STORAGE);
  } catch {
    // ignore storage errors
  }
}

// ─── Model getters/setters ───────────────────────────────────────────────────
export function getStoredReportModel(): string {
  try {
    return localStorage.getItem(AI_MODEL_REPORT_STORAGE) || "claude-sonnet-4-20250514";
  } catch {
    return "claude-sonnet-4-20250514";
  }
}

export function setStoredReportModel(model: string): void {
  try {
    localStorage.setItem(AI_MODEL_REPORT_STORAGE, model);
  } catch {
    // ignore storage errors
  }
}

export function getStoredIndicatorModel(): string {
  try {
    return localStorage.getItem(AI_MODEL_INDICATOR_STORAGE) || "claude-3-5-haiku-20241022";
  } catch {
    return "claude-3-5-haiku-20241022";
  }
}

export function setStoredIndicatorModel(model: string): void {
  try {
    localStorage.setItem(AI_MODEL_INDICATOR_STORAGE, model);
  } catch {
    // ignore storage errors
  }
}

// ─── API key validation ──────────────────────────────────────────────────────
export async function validateApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 1,
        messages: [{ role: "user", content: "test" }],
      }),
    });
    if (response.ok) return { valid: true };
    if (response.status === 401) return { valid: false, error: "Clé API invalide" };
    if (response.status === 429) return { valid: false, error: "Limite de requêtes atteinte" };
    return { valid: false, error: `Erreur HTTP ${response.status}` };
  } catch (err) {
    return { valid: false, error: "Erreur de connexion" };
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────
export interface AIGenerateOptions {
  indicatorCode: string;
  indicatorLabel: string;
  indicatorType: string;
  dossierName?: string;
  dossierOrg?: string;
  fiscalYear?: string;
  userContext?: string;
}

const SYSTEM_PROMPT = `Tu es un expert ESG senior spécialisé dans les reportings CSRD/VSME/ESRS (normes EFRAG pour les entreprises françaises).
Tu aides les équipes de conseil ESG à rédiger des données qualitatives précises et professionnelles pour leurs rapports ESG.

Règles absolues :
- Réponds UNIQUEMENT en français
- Sois concis et direct (3 à 5 phrases maximum)
- Rédige un texte immédiatement utilisable dans un rapport officiel ESG
- Évite les généralités : propose du contenu concret, factuel et professionnel
- N'ajoute pas d'introduction ou de conclusion : donne directement le texte rédigé
- Utilise un ton professionnel et neutre adapté à un rapport de conformité ESG`;

// ─── Types pour le rapport complet ───────────────────────────────────────────
export interface FilledDataPoint {
  code: string;
  intitule: string;
  value: string;
  unite?: string;
  pilier: string;
  type: string;
  sectionId: string;
  sectionTitre: string;
}

const REPORT_SYSTEM_PROMPT = `Tu es un expert ESG senior spécialisé dans les reportings CSRD/VSME/ESRS (normes EFRAG pour les entreprises françaises).
Tu génères des rapports ESG professionnels, structurés et directement publiables.

Règles absolues :
- Réponds UNIQUEMENT en français
- Utilise la syntaxe Markdown pour structurer le rapport (##, ###, **gras**, - listes)
- Interprète les données chiffrées avec du contexte sectoriel
- Sois analytique, factuel et professionnel
- Pour chaque donnée clé, apporte une évaluation (bon, à améliorer, insuffisant)
- Si des données manquent dans une section, mentionne-le et explique leur importance`;

/**
 * Génère un rapport ESG complet pour un dossier.
 * Utilise le modèle de rapport stocké (par défaut claude-sonnet-4).
 */
export async function generateFullReport(
  filledDps: FilledDataPoint[],
  dossierName: string,
  dossierOrg: string,
  fiscalYear: string,
  missionType: string,
  userContext: string,
  apiKey: string
): Promise<string> {
  // Group by pilier
  const byPilier: Record<string, FilledDataPoint[]> = {
    'Général': [],
    'E': [],
    'S': [],
    'G': [],
  };
  for (const dp of filledDps) {
    const p = dp.pilier in byPilier ? dp.pilier : 'Général';
    byPilier[p].push(dp);
  }

  const formatPilierData = (pilier: string): string => {
    const dps = byPilier[pilier];
    if (!dps || dps.length === 0) return '_(Aucune donnée collectée pour ce pilier)_\n';
    // Group by section
    const bySec: Record<string, FilledDataPoint[]> = {};
    for (const dp of dps) {
      if (!bySec[dp.sectionId]) bySec[dp.sectionId] = [];
      bySec[dp.sectionId].push(dp);
    }
    return Object.entries(bySec).map(([secId, secDps]) => {
      const secTitre = secDps[0].sectionTitre;
      return `**${secId} — ${secTitre}**\n${secDps
        .map(dp => `- ${dp.code} : ${dp.intitule} → **${dp.value}${dp.unite ? ' ' + dp.unite : ''}**${dp.type === 'Narratif' || dp.type === 'Qualitatif' ? ' _(qualitatif)_' : ''}`)
        .join('\n')}`;
    }).join('\n\n');
  };

  const prompt = `Génère un rapport ESG professionnel et complet en Markdown pour ce dossier :

**Dossier** : ${dossierName}
**Entreprise** : ${dossierOrg || 'PME française'}
**Exercice fiscal** : ${fiscalYear}
**Type de mission** : ${missionType}${userContext?.trim() ? `\n**Contexte fourni** : ${userContext}` : ''}

---

## DONNÉES COLLECTÉES

### Informations générales
${formatPilierData('Général')}

### Pilier Environnement (E)
${formatPilierData('E')}

### Pilier Social (S)
${formatPilierData('S')}

### Pilier Gouvernance (G)
${formatPilierData('G')}

---

Génère maintenant un rapport ESG structuré. Structure exacte à respecter :

# Rapport ESG — ${dossierOrg || 'Entreprise'} — ${fiscalYear}

## 1. Synthèse exécutive
(3-4 paragraphes : évaluation globale de la performance ESG, points forts, risques identifiés, recommandation principale)

## 2. Performance Environnementale (E)
(Analyse des consommations énergétiques, émissions GES, eau, déchets. Interprétation et positionnement par rapport aux moyennes PME. Évaluation par indicateur clé.)

## 3. Performance Sociale (S)
(Analyse des données RH : effectifs, formation, santé-sécurité. Évaluation de la qualité sociale et du bien-être au travail.)

## 4. Gouvernance (G)
(Analyse de la structure de gouvernance, pratiques éthiques, gestion des risques ESG. Points de conformité.)

## 5. Recommandations prioritaires
(Liste numérotée de 3-5 recommandations concrètes, actionnables et priorisées. Pour chacune : pourquoi c'est prioritaire et comment la mettre en œuvre.)

---
Pour chaque section : analyse les données fournies, interpète-les dans le contexte d'une PME, et complète avec des éléments qualitatifs pertinents.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: getStoredReportModel(),
      max_tokens: 4000,
      system: REPORT_SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    let errMsg = `Erreur HTTP ${response.status}`;
    try {
      const err = await response.json();
      errMsg = (err as { error?: { message?: string } })?.error?.message ?? errMsg;
    } catch { /* ignore */ }
    throw new Error(errMsg);
  }

  const data = await response.json() as { content?: Array<{ text?: string }> };
  return ((data.content?.[0]?.text) ?? "").trim();
}

/**
 * Génère un texte qualitatif pour un indicateur ESG via l'API Anthropic Claude.
 * @throws Error si la clé API est invalide ou si l'appel échoue
 */
export async function generateQualitativeText(
  options: AIGenerateOptions,
  apiKey: string
): Promise<string> {
  const userPrompt = `Rédige le contenu pour l'indicateur ESG suivant :

Code : ${options.indicatorCode}
Libellé : ${options.indicatorLabel}
Type de données : ${options.indicatorType}
Entreprise : ${options.dossierOrg ?? "PME française"}
Exercice fiscal : ${options.fiscalYear ?? "2024"}${
    options.userContext?.trim()
      ? `\nContexte fourni par l'utilisateur : ${options.userContext}`
      : ""
  }

Rédige directement le texte à insérer dans le rapport (sans guillemets, sans titre, sans introduction).`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: getStoredIndicatorModel(),
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!response.ok) {
    let errMsg = `Erreur HTTP ${response.status}`;
    try {
      const err = await response.json();
      errMsg =
        (err as { error?: { message?: string } })?.error?.message ?? errMsg;
    } catch {
      // ignore parse error
    }
    throw new Error(errMsg);
  }

  const data = await response.json() as { content?: Array<{ text?: string }> };
  return ((data.content?.[0]?.text) ?? "").trim();
}
