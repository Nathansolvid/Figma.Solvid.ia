import React, { useState } from "react";
import {
  CheckCircle,
  ArrowRight,
  Shield,
  FileText,
  BarChart3,
  Upload,
  History,
  Users,
  ChevronDown,
  ChevronUp,
  Leaf,
  Zap,
  Lock,
  TrendingUp,
  ClipboardCheck,
  Database,
  BookOpen,
  Star,
} from "lucide-react";

interface SolvidLandingPageProps {
  onGetStarted: () => void;
}

const NAV_LINKS = [
  { label: "Solution", href: "#solution" },
  { label: "Fonctionnalités", href: "#features" },
  { label: "Tarifs", href: "#pricing" },
  { label: "Comment ça marche", href: "#how-it-works" },
];

const STATS = [
  { value: "100%", label: "Audit-ready", desc: "Chaque donnée sourcée, historisée, justifiable" },
  { value: "3×", label: "Plus rapide", desc: "Que la méthode Excel manuelle" },
  { value: "4", label: "Référentiels", desc: "VSME, CSRD, GHG Protocol, ESRS" },
  { value: "0", label: "Données inventées", desc: "IA assistive uniquement — jamais générative sans cadre" },
];

const FEATURES = [
  {
    icon: Upload,
    color: "#2D7A55",
    bg: "#EDF7F1",
    title: "Import depuis Excel",
    desc: "Partez de vos fichiers existants. Solvid.ia importe, structure et valide automatiquement vos données carbone et ESG sans ressaisie.",
  },
  {
    icon: Leaf,
    color: "#2D9D5F",
    bg: "#EDF7F1",
    title: "Évaluation carbone (Scope 1/2/3)",
    desc: "Calculez votre empreinte carbone selon le GHG Protocol. Chaque poste d'émission est documenté avec sa méthodologie et ses hypothèses.",
  },
  {
    icon: Database,
    color: "#2980B9",
    bg: "#EBF5FB",
    title: "Données ESG centralisées",
    desc: "Un référentiel unique pour vos indicateurs Environnement, Social et Gouvernance. Chaque donnée a un statut, une source et un justificatif.",
  },
  {
    icon: ClipboardCheck,
    color: "#8E44AD",
    bg: "#F5EEF8",
    title: "Conformité CSRD / ESRS",
    desc: "Suivez votre avancement CSRD indicateur par indicateur (E1–E5, S1–S4, G1). L'IA vous indique quoi compléter et pourquoi c'est requis.",
  },
  {
    icon: Shield,
    color: "#D97706",
    bg: "#FFFBEB",
    title: "Traçabilité & Audit Trail",
    desc: "Chaque modification est horodatée et attribuée. Vos auditeurs ont accès à un historique complet, immuable et vérifiable.",
  },
  {
    icon: FileText,
    color: "#0D3B27",
    bg: "#F0F4F1",
    title: "Rapports audit-ready",
    desc: "Générez en un clic vos rapports CSRD, VSME ou carbone en PDF et ZIP. Livrables prêts pour vos commissaires aux comptes.",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Importez vos données",
    desc: "Déposez vos fichiers Excel, PDF ou saisissez directement. Solvid.ia structure vos données ESG et carbone selon les référentiels requis.",
    icon: Upload,
  },
  {
    num: "02",
    title: "L'IA analyse et guide",
    desc: "Notre IA identifie les données manquantes, vérifie la cohérence des calculs et vous guide pour compléter votre dossier CSRD étape par étape.",
    icon: Zap,
  },
  {
    num: "03",
    title: "Validez et collaborez",
    desc: "Invitez consultants et auditeurs. Chaque donnée est justifiée, sourcée et validée selon un workflow structuré avant publication.",
    icon: Users,
  },
  {
    num: "04",
    title: "Générez vos livrables",
    desc: "Exportez rapports PDF, packages d'audit ou données brutes. Tout est audit-ready, traçable et conforme aux exigences CSRD/ESRS.",
    icon: FileText,
  },
];

const PACKS = [
  {
    name: "VSME",
    tag: "PME / ETI",
    price: "Sur devis",
    color: "#2D7A55",
    bg: "#EDF7F1",
    features: [
      "Référentiel VSME complet",
      "Import Excel & PDF",
      "Indicateurs E/S/G",
      "Rapport VSME PDF",
      "1 utilisateur",
    ],
  },
  {
    name: "Standard",
    tag: "Recommandé",
    price: "Sur devis",
    color: "#2D7A55",
    bg: "#0D3B27",
    featured: true,
    features: [
      "Tout VSME +",
      "Bilan carbone Scope 1/2/3",
      "Conformité CSRD partielle",
      "Audit trail complet",
      "5 utilisateurs",
      "Support prioritaire",
    ],
  },
  {
    name: "CSRD Complet",
    tag: "Grandes entreprises",
    price: "Sur devis",
    color: "#2D7A55",
    bg: "#EDF7F1",
    features: [
      "Tout Standard +",
      "Double matérialité (DMA)",
      "Mapping ESRS complet",
      "Collaboration auditeurs",
      "Utilisateurs illimités",
      "Intégrations sur mesure",
    ],
  },
];

const FAQS = [
  {
    q: "Depuis quoi Solvid.ia part-il pour collecter les données ?",
    a: "Solvid.ia est conçu pour démarrer depuis vos fichiers Excel existants. Vous importez vos données brutes (consommations énergie, effectifs, achats…) et la plateforme les structure automatiquement selon les référentiels requis (VSME, ESRS, GHG Protocol).",
  },
  {
    q: "L'IA invente-t-elle des données ?",
    a: "Non. Notre IA est exclusivement assistive : elle guide, structure, vérifie la cohérence et indique les données manquantes. Elle ne génère jamais de valeur sans source justifiée. Chaque donnée dans Solvid.ia est traçable jusqu'à sa source originale.",
  },
  {
    q: "Qui peut utiliser Solvid.ia ?",
    a: "La plateforme est conçue pour trois profils : les équipes internes (DAF, équipes RSE), les consultants ESG qui accompagnent leurs clients, et les auditeurs qui vérifient la conformité. Chaque rôle dispose de droits et vues adaptés.",
  },
  {
    q: "Est-ce que les rapports générés sont acceptés par les auditeurs ?",
    a: "Oui. Chaque livrable Solvid.ia est conçu pour être audit-ready : données sourcées, historisées, avec méthodologie documentée. Vos commissaires aux comptes ont accès à un audit trail complet et immuable.",
  },
  {
    q: "Quels référentiels sont supportés ?",
    a: "VSME (Volontary SME Standard), CSRD/ESRS (Environnement E1–E5, Social S1–S4, Gouvernance G1), GHG Protocol (Scope 1, 2, 3), et double matérialité (DMA). La liste s'élargit en continu.",
  },
];

export function SolvidLandingPage({ onGetStarted }: SolvidLandingPageProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen font-sans" style={{ fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif", color: "#1A2E24", backgroundColor: "#F0F4F1" }}>

      {/* ── HEADER ── */}
      <header style={{ backgroundColor: "#ffffff", borderBottom: "1px solid #E2EDE7" }} className="sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "#2D7A55" }}>
              <CheckCircle size={18} color="white" />
            </div>
            <span className="text-lg font-bold" style={{ color: "#1A2E24" }}>Solvid<span style={{ color: "#2D7A55" }}>.ia</span></span>
          </div>

          {/* Nav desktop */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((l) => (
              <a key={l.label} href={l.href} className="text-sm font-medium transition-colors hover:opacity-70" style={{ color: "#1A2E24" }}>
                {l.label}
              </a>
            ))}
          </nav>

          {/* CTAs */}
          <div className="flex items-center gap-3">
            <button
              onClick={onGetStarted}
              className="hidden md:block text-sm font-medium transition-colors hover:opacity-70"
              style={{ color: "#2D7A55" }}
            >
              Connexion
            </button>
            <button
              onClick={onGetStarted}
              className="text-sm font-semibold px-4 py-2 rounded-lg transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#2D7A55", color: "#ffffff" }}
            >
              Prendre un démo
            </button>
            {/* Mobile menu */}
            <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)} style={{ color: "#1A2E24" }}>
              <ChevronDown size={20} />
            </button>
          </div>
        </div>
        {/* Mobile nav */}
        {menuOpen && (
          <div className="md:hidden px-6 pb-4 flex flex-col gap-3" style={{ backgroundColor: "#ffffff" }}>
            {NAV_LINKS.map((l) => (
              <a key={l.label} href={l.href} className="text-sm font-medium py-1" style={{ color: "#1A2E24" }} onClick={() => setMenuOpen(false)}>
                {l.label}
              </a>
            ))}
          </div>
        )}
      </header>

      {/* ── HERO ── */}
      <section className="pt-20 pb-16 px-6" style={{ background: "linear-gradient(135deg, #F0F4F1 0%, #EDF7F1 100%)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6" style={{ backgroundColor: "#EDF7F1", color: "#1A5F3F", border: "1px solid #C6E8D4" }}>
                <CheckCircle size={12} />
                Conforme CSRD · ESRS · GHG Protocol
              </div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6" style={{ color: "#1A2E24" }}>
                Rendez vos données ESG{" "}
                <span style={{ color: "#2D7A55" }}>auditables</span>,{" "}
                <span style={{ color: "#2D7A55" }}>traçables</span>{" "}
                et faciles à consolider
              </h1>
              <p className="text-lg mb-8 leading-relaxed" style={{ color: "#4A7A5F" }}>
                La plateforme SaaS B2B qui part de vos Excel pour transformer vos données ESG et carbone en livrables CSRD fiables — avec traçabilité complète des sources, calculs vérifiables et rapports audit-ready.
              </p>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={onGetStarted}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "#2D7A55", color: "#ffffff" }}
                >
                  Démarrer gratuitement
                  <ArrowRight size={16} />
                </button>
                <button
                  onClick={onGetStarted}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-opacity hover:opacity-80"
                  style={{ backgroundColor: "transparent", color: "#2D7A55", border: "1.5px solid #2D7A55" }}
                >
                  Voir une démo
                </button>
              </div>
              {/* Social proof */}
              <div className="flex items-center gap-6 mt-8">
                <div className="flex -space-x-2">
                  {["#2D7A55", "#2980B9", "#8E44AD", "#D97706"].map((c, i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center" style={{ backgroundColor: c }}>
                      <span className="text-xs text-white font-bold">{["D", "A", "R", "C"][i]}</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm" style={{ color: "#4A7A5F" }}>
                  <strong style={{ color: "#1A2E24" }}>Dirigeants, DAF & équipes RSE</strong> pilotent leur conformité ESG avec Solvid.ia
                </p>
              </div>
            </div>

            {/* Hero visual */}
            <div className="relative">
              <div className="rounded-2xl p-6 shadow-xl" style={{ backgroundColor: "#ffffff", border: "1px solid #E2EDE7" }}>
                {/* Dashboard mini preview */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#DC2626" }} />
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#F59E0B" }} />
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#2D9D5F" }} />
                  <span className="ml-2 text-xs font-medium" style={{ color: "#8aab98" }}>Solvid.ia — Dashboard CSRD</span>
                </div>
                {/* Score CSRD */}
                <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: "#F0F4F1" }}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-semibold" style={{ color: "#1A2E24" }}>Score conformité CSRD</span>
                    <span className="text-xs font-bold" style={{ color: "#2D7A55" }}>78%</span>
                  </div>
                  <div className="h-2 rounded-full" style={{ backgroundColor: "#E2EDE7" }}>
                    <div className="h-2 rounded-full" style={{ width: "78%", backgroundColor: "#2D7A55" }} />
                  </div>
                </div>
                {/* KPI grid */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: "Scope 1", value: "142 tCO₂e", color: "#2D9D5F", bg: "#EDF7F1" },
                    { label: "Scope 2", value: "89 tCO₂e", color: "#2980B9", bg: "#EBF5FB" },
                    { label: "Scope 3", value: "1 247 tCO₂e", color: "#8E44AD", bg: "#F5EEF8" },
                  ].map((kpi) => (
                    <div key={kpi.label} className="rounded-lg p-3 text-center" style={{ backgroundColor: kpi.bg }}>
                      <p className="text-xs font-medium mb-1" style={{ color: kpi.color }}>{kpi.label}</p>
                      <p className="text-xs font-bold" style={{ color: "#1A2E24" }}>{kpi.value}</p>
                    </div>
                  ))}
                </div>
                {/* Status pills */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "✓ 47 indicateurs validés", color: "#2D9D5F", bg: "#EDF7F1" },
                    { label: "⚠ 12 en cours", color: "#D97706", bg: "#FFFBEB" },
                    { label: "✗ 8 manquants", color: "#DC2626", bg: "#FEF2F2" },
                  ].map((s) => (
                    <span key={s.label} className="text-xs px-2 py-1 rounded-full font-medium" style={{ backgroundColor: s.bg, color: s.color }}>
                      {s.label}
                    </span>
                  ))}
                </div>
                {/* Audit badge */}
                <div className="mt-4 flex items-center gap-2 p-3 rounded-lg" style={{ backgroundColor: "#EDF7F1", border: "1px solid #C6E8D4" }}>
                  <Shield size={16} style={{ color: "#2D7A55" }} />
                  <span className="text-xs font-medium" style={{ color: "#1A5F3F" }}>Audit trail actif — 127 événements tracés</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-12 px-6" style={{ backgroundColor: "#0D3B27" }}>
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s) => (
            <div key={s.value} className="text-center">
              <div className="text-4xl font-bold mb-1" style={{ color: "#52B788" }}>{s.value}</div>
              <div className="text-sm font-semibold mb-1" style={{ color: "#ffffff" }}>{s.label}</div>
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PROBLEM / SOLUTION ── */}
      <section id="solution" className="py-20 px-6" style={{ backgroundColor: "#ffffff" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-4" style={{ backgroundColor: "#EDF7F1", color: "#1A5F3F" }}>
              Le problème que nous résolvons
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: "#1A2E24" }}>
              Le reporting ESG est encore un chantier Excel
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: "#4A7A5F" }}>
              Données dispersées, calculs non traçables, risques d'audit non maîtrisés. Solvid.ia transforme ce chaos en un processus structuré, conforme et auditable.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Before */}
            <div className="rounded-2xl p-8" style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA" }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "#DC2626" }}>
                  <span className="text-white font-bold text-sm">✗</span>
                </div>
                <h3 className="font-bold text-lg" style={{ color: "#991B1B" }}>Sans Solvid.ia</h3>
              </div>
              <ul className="space-y-3">
                {[
                  "Données ESG éparpillées dans des Excel non versionnés",
                  "Calculs carbone non documentés, hypothèses implicites",
                  "Impossible de retrouver qui a modifié quelle donnée",
                  "Rapports générés manuellement, erreurs fréquentes",
                  "Auditeurs bloqués faute de traçabilité",
                  "Conformité CSRD floue, risque de non-conformité",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm" style={{ color: "#7F1D1D" }}>
                    <span className="mt-0.5 flex-shrink-0">✗</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* After */}
            <div className="rounded-2xl p-8" style={{ backgroundColor: "#EDF7F1", border: "1px solid #C6E8D4" }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "#2D7A55" }}>
                  <CheckCircle size={20} color="white" />
                </div>
                <h3 className="font-bold text-lg" style={{ color: "#1A5F3F" }}>Avec Solvid.ia</h3>
              </div>
              <ul className="space-y-3">
                {[
                  "Base de données ESG centralisée, structurée et versionnée",
                  "Calculs carbone GHG Protocol avec méthodologie documentée",
                  "Audit trail complet : qui, quoi, quand, pourquoi",
                  "Rapports PDF & ZIP générés en 1 clic, prêts pour l'audit",
                  "Auditeurs invités avec accès lecture contrôlé",
                  "Score de conformité CSRD en temps réel par indicateur ESRS",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm" style={{ color: "#1A5F3F" }}>
                    <CheckCircle size={14} className="mt-0.5 flex-shrink-0" style={{ color: "#2D7A55" }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-20 px-6" style={{ backgroundColor: "#F0F4F1" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-4" style={{ backgroundColor: "#EDF7F1", color: "#1A5F3F" }}>
              Le flux Solvid.ia
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: "#1A2E24" }}>
              INPUTS → Analyse IA → OUTPUTS
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: "#4A7A5F" }}>
              Un processus clair en 4 étapes, de vos données brutes jusqu'aux livrables auditables.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {STEPS.map((step, i) => (
              <div key={step.num} className="relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 z-0" style={{ backgroundColor: "#C6E8D4" }} />
                )}
                <div className="relative z-10 rounded-2xl p-6" style={{ backgroundColor: "#ffffff", border: "1px solid #E2EDE7" }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: "#EDF7F1" }}>
                    <step.icon size={22} style={{ color: "#2D7A55" }} />
                  </div>
                  <div className="text-xs font-bold mb-2" style={{ color: "#2D7A55" }}>{step.num}</div>
                  <h3 className="font-bold text-sm mb-2" style={{ color: "#1A2E24" }}>{step.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: "#4A7A5F" }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-20 px-6" style={{ backgroundColor: "#ffffff" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-4" style={{ backgroundColor: "#EDF7F1", color: "#1A5F3F" }}>
              Fonctionnalités
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: "#1A2E24" }}>
              Tout ce dont vous avez besoin pour la conformité ESG
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: "#4A7A5F" }}>
              Une plateforme complète pensée pour les équipes internes, consultants et auditeurs.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl p-6 hover:shadow-md transition-shadow" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E2EDE7" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: f.bg }}>
                  <f.icon size={20} style={{ color: f.color }} />
                </div>
                <h3 className="font-bold mb-2" style={{ color: "#1A2E24" }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#4A7A5F" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-20 px-6" style={{ backgroundColor: "#F0F4F1" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-4" style={{ backgroundColor: "#EDF7F1", color: "#1A5F3F" }}>
              Nos packs
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: "#1A2E24" }}>
              4 packs adaptés à votre maturité ESG
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: "#4A7A5F" }}>
              De la PME qui démarre avec le VSME aux grands groupes assujettis à la CSRD complète.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {PACKS.map((pack) => (
              <div
                key={pack.name}
                className="rounded-2xl p-8"
                style={{
                  backgroundColor: pack.featured ? pack.bg : "#ffffff",
                  border: pack.featured ? "2px solid #2D7A55" : "1px solid #E2EDE7",
                }}
              >
                {pack.featured && (
                  <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold mb-4" style={{ backgroundColor: "#2D7A55", color: "#ffffff" }}>
                    <Star size={10} />
                    {pack.tag}
                  </div>
                )}
                {!pack.featured && (
                  <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mb-4" style={{ backgroundColor: "#EDF7F1", color: "#1A5F3F" }}>
                    {pack.tag}
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-1" style={{ color: pack.featured ? "#ffffff" : "#1A2E24" }}>
                  {pack.name}
                </h3>
                <p className="text-sm mb-6" style={{ color: pack.featured ? "rgba(255,255,255,0.6)" : "#8aab98" }}>
                  {pack.price}
                </p>
                <ul className="space-y-3 mb-8">
                  {pack.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2 text-sm" style={{ color: pack.featured ? "rgba(255,255,255,0.9)" : "#1A2E24" }}>
                      <CheckCircle size={14} style={{ color: pack.featured ? "#52B788" : "#2D7A55", flexShrink: 0 }} />
                      {feat}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={onGetStarted}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
                  style={{
                    backgroundColor: pack.featured ? "#52B788" : "#2D7A55",
                    color: "#ffffff",
                  }}
                >
                  Nous contacter
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOR WHO ── */}
      <section className="py-20 px-6" style={{ backgroundColor: "#ffffff" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: "#1A2E24" }}>
              Conçu pour 3 profils
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: TrendingUp,
                color: "#2D7A55",
                bg: "#EDF7F1",
                title: "Équipes internes",
                subtitle: "DAF · Responsable RSE · Direction",
                points: [
                  "Pilotez votre conformité CSRD en temps réel",
                  "Centralisez toutes les données ESG de l'entreprise",
                  "Générez les rapports réglementaires en autonomie",
                ],
              },
              {
                icon: BookOpen,
                color: "#2980B9",
                bg: "#EBF5FB",
                title: "Consultants ESG",
                subtitle: "Cabinets · Experts indépendants",
                points: [
                  "Gérez plusieurs dossiers clients depuis une interface",
                  "Guidez vos clients avec des workflows structurés",
                  "Livrez des dossiers audit-ready à chaque mission",
                ],
              },
              {
                icon: Shield,
                color: "#8E44AD",
                bg: "#F5EEF8",
                title: "Auditeurs & CAC",
                subtitle: "Commissaires aux comptes · Auditeurs tiers",
                points: [
                  "Accès lecture avec audit trail complet",
                  "Vérifiez chaque donnée jusqu'à sa source",
                  "Workflow de validation intégré dans la plateforme",
                ],
              },
            ].map((profile) => (
              <div key={profile.title} className="rounded-2xl p-8" style={{ backgroundColor: profile.bg, border: "1px solid #E2EDE7" }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: "#ffffff" }}>
                  <profile.icon size={22} style={{ color: profile.color }} />
                </div>
                <h3 className="font-bold text-lg mb-1" style={{ color: "#1A2E24" }}>{profile.title}</h3>
                <p className="text-xs font-medium mb-4" style={{ color: profile.color }}>{profile.subtitle}</p>
                <ul className="space-y-2">
                  {profile.points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm" style={{ color: "#1A2E24" }}>
                      <CheckCircle size={13} className="mt-0.5 flex-shrink-0" style={{ color: profile.color }} />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 px-6" style={{ backgroundColor: "#F0F4F1" }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4" style={{ color: "#1A2E24" }}>Questions fréquentes</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="rounded-xl overflow-hidden" style={{ border: "1px solid #E2EDE7", backgroundColor: "#ffffff" }}>
                <button
                  className="w-full flex items-center justify-between px-6 py-4 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-semibold text-sm pr-4" style={{ color: "#1A2E24" }}>{faq.q}</span>
                  {openFaq === i ? (
                    <ChevronUp size={16} style={{ color: "#2D7A55", flexShrink: 0 }} />
                  ) : (
                    <ChevronDown size={16} style={{ color: "#2D7A55", flexShrink: 0 }} />
                  )}
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4">
                    <p className="text-sm leading-relaxed" style={{ color: "#4A7A5F" }}>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-20 px-6" style={{ backgroundColor: "#0D3B27" }}>
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6" style={{ backgroundColor: "rgba(82,183,136,0.2)", color: "#52B788" }}>
            <Lock size={12} />
            Vos données restent les vôtres · Hébergement UE
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            Prêt à rendre vos données ESG audit-ready ?
          </h2>
          <p className="text-lg mb-8" style={{ color: "rgba(255,255,255,0.6)" }}>
            Rejoignez les équipes qui pilotent leur conformité CSRD avec Solvid.ia. Démarrez gratuitement, sans engagement.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={onGetStarted}
              className="flex items-center gap-2 px-8 py-3 rounded-lg font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#2D7A55", color: "#ffffff" }}
            >
              Accéder à la plateforme
              <ArrowRight size={16} />
            </button>
            <button
              onClick={onGetStarted}
              className="flex items-center gap-2 px-8 py-3 rounded-lg font-semibold transition-opacity hover:opacity-80"
              style={{ backgroundColor: "transparent", color: "#52B788", border: "1.5px solid #52B788" }}
            >
              Demander une démo
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-12 px-6" style={{ backgroundColor: "#0D3B27", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: "#2D7A55" }}>
                  <CheckCircle size={14} color="white" />
                </div>
                <span className="font-bold text-white">Solvid<span style={{ color: "#52B788" }}>.ia</span></span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
                La plateforme SaaS B2B pour transformer vos données ESG en livrables CSRD fiables et auditables.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4 text-white">Produit</h4>
              <ul className="space-y-2">
                {["Fonctionnalités", "Tarifs", "Référentiels", "Sécurité"].map((l) => (
                  <li key={l}><a href="#" className="text-xs hover:text-white transition-colors" style={{ color: "rgba(255,255,255,0.4)" }}>{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4 text-white">Ressources</h4>
              <ul className="space-y-2">
                {["Documentation", "Guide CSRD", "Guide VSME", "Blog ESG"].map((l) => (
                  <li key={l}><a href="#" className="text-xs hover:text-white transition-colors" style={{ color: "rgba(255,255,255,0.4)" }}>{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4 text-white">Entreprise</h4>
              <ul className="space-y-2">
                {["À propos", "Contact", "Mentions légales", "RGPD"].map((l) => (
                  <li key={l}><a href="#" className="text-xs hover:text-white transition-colors" style={{ color: "rgba(255,255,255,0.4)" }}>{l}</a></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
              © 2026 Solvid.ia · Tous droits réservés
            </p>
            <div className="flex items-center gap-4 mt-2 md:mt-0">
              {["CSRD", "ESRS", "GHG Protocol", "VSME"].map((badge) => (
                <span key={badge} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: "rgba(45,122,85,0.2)", color: "#52B788" }}>
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
