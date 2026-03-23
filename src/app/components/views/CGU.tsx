/**
 * CGU — Conditions Generales d'Utilisation
 *
 * Page legale RGPD Phase 2.
 */

import { Card, CardContent } from "@/app/components/ui/card";
import { Shield } from "lucide-react";

interface CGUProps {
  onNavigate?: (view: string) => void;
}

export default function CGU({ onNavigate }: CGUProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#059669' }}>
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#0A3B2E' }}>
              Conditions Generales d'Utilisation
            </h1>
            <p className="text-sm text-muted-foreground">Solvid.IA — Plateforme ESG Audit-Ready</p>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">Derniere mise a jour : mars 2026</p>
      </div>

      <Card>
        <CardContent className="prose prose-sm max-w-none pt-6 space-y-8 text-gray-700">

          {/* 1. Objet */}
          <section>
            <h2 className="text-lg font-semibold" style={{ color: '#0A3B2E' }}>1. Objet</h2>
            <p>
              Les presentes Conditions Generales d'Utilisation (ci-apres "CGU") ont pour objet de definir
              les modalites et conditions d'utilisation de la plateforme Solvid.IA (ci-apres "la Plateforme"),
              editee par Solvid SAS. Toute utilisation de la Plateforme implique l'acceptation sans reserve
              des presentes CGU.
            </p>
          </section>

          {/* 2. Definitions */}
          <section>
            <h2 className="text-lg font-semibold" style={{ color: '#0A3B2E' }}>2. Definitions</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Plateforme</strong> : l'application web Solvid.IA accessible a l'adresse dediee.</li>
              <li><strong>Utilisateur</strong> : toute personne physique ou morale inscrite sur la Plateforme.</li>
              <li><strong>Compte</strong> : espace personnel de l'Utilisateur, accessible par identifiant et mot de passe.</li>
              <li><strong>Donnees ESG</strong> : donnees environnementales, sociales et de gouvernance saisies ou importees par l'Utilisateur.</li>
              <li><strong>Service</strong> : l'ensemble des fonctionnalites proposees par la Plateforme.</li>
              <li><strong>Editeur</strong> : Solvid SAS, societe editrice de la Plateforme.</li>
            </ul>
          </section>

          {/* 3. Acces au service */}
          <section>
            <h2 className="text-lg font-semibold" style={{ color: '#0A3B2E' }}>3. Acces au service</h2>
            <p>
              L'acces a la Plateforme necessite une inscription prealable. L'Utilisateur fournit une adresse
              email valide, un nom complet et un mot de passe securise (minimum 8 caracteres). Les comptes
              sont soumis a validation par un administrateur avant activation.
            </p>
            <p>
              L'Utilisateur s'engage a fournir des informations exactes et a maintenir la confidentialite
              de ses identifiants. Toute utilisation de son Compte est presumee faite par l'Utilisateur lui-meme.
              En cas de compromission suspectee, l'Utilisateur doit en informer immediatement l'Editeur a
              l'adresse contact@solvid.ia.
            </p>
          </section>

          {/* 4. Description du service */}
          <section>
            <h2 className="text-lg font-semibold" style={{ color: '#0A3B2E' }}>4. Description du service</h2>
            <p>
              La Plateforme Solvid.IA est une solution de gestion ESG/CSRD destinee aux entreprises et
              consultants. Elle propose les fonctionnalites suivantes :
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Saisie et suivi des donnees ESG selon les referentiels VSME, CSRD et ESRS.</li>
              <li>Import de donnees depuis des fichiers Excel ou des connecteurs ERP.</li>
              <li>Generation de rapports ESG automatises par intelligence artificielle (Anthropic Claude).</li>
              <li>Gestion des preuves et justificatifs (Evidence Vault).</li>
              <li>Checklists de conformite et workflows d'audit.</li>
              <li>Exports de livrables (PDF, Excel) prets pour l'audit.</li>
              <li>Suivi multi-referentiels avec tableaux de bord analytiques.</li>
            </ul>
          </section>

          {/* 5. Obligations de l'utilisateur */}
          <section>
            <h2 className="text-lg font-semibold" style={{ color: '#0A3B2E' }}>5. Obligations de l'utilisateur</h2>
            <p>L'Utilisateur s'engage a :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Utiliser la Plateforme conformement a sa destination et aux presentes CGU.</li>
              <li>Ne pas saisir de donnees personnelles sensibles (donnees de sante, origine ethnique, etc.) dans les champs ESG, sauf si cela est strictement necessaire a la declaration.</li>
              <li>Respecter les droits de propriete intellectuelle de l'Editeur et des tiers.</li>
              <li>Ne pas tenter de contourner les mesures de securite de la Plateforme.</li>
              <li>Ne pas utiliser la Plateforme a des fins illicites ou frauduleuses.</li>
              <li>Verifier l'exactitude des donnees saisies et des rapports generes par l'IA avant toute utilisation officielle.</li>
            </ul>
          </section>

          {/* 6. Propriete intellectuelle */}
          <section>
            <h2 className="text-lg font-semibold" style={{ color: '#0A3B2E' }}>6. Propriete intellectuelle</h2>
            <p>
              La Plateforme, son code source, son design, ses algorithmes et sa documentation sont la
              propriete exclusive de Solvid SAS. Toute reproduction, modification ou distribution non
              autorisee est interdite.
            </p>
            <p>
              Les donnees saisies par l'Utilisateur restent sa propriete. L'Editeur dispose d'une licence
              d'utilisation limitee aux seules fins de fourniture du Service. Les rapports generes par
              l'intelligence artificielle sont mis a disposition de l'Utilisateur, qui en assume la
              responsabilite quant a leur utilisation.
            </p>
          </section>

          {/* 7. Donnees personnelles */}
          <section>
            <h2 className="text-lg font-semibold" style={{ color: '#0A3B2E' }}>7. Donnees personnelles</h2>
            <p>
              Le traitement des donnees personnelles est regi par notre Politique de Confidentialite,
              accessible{" "}
              <button
                className="text-[#059669] underline hover:text-[#048558] font-medium"
                onClick={() => onNavigate?.("politique-confidentialite")}
              >
                ici
              </button>
              . L'Utilisateur est invite a en prendre connaissance avant toute utilisation de la Plateforme.
            </p>
            <p>
              Conformement au Reglement General sur la Protection des Donnees (RGPD), l'Utilisateur dispose
              de droits d'acces, de rectification, d'effacement, de portabilite et d'opposition sur ses
              donnees personnelles.
            </p>
          </section>

          {/* 8. Responsabilite et garanties */}
          <section>
            <h2 className="text-lg font-semibold" style={{ color: '#0A3B2E' }}>8. Responsabilite et garanties</h2>
            <p>
              L'Editeur met en oeuvre les moyens raisonnables pour assurer la disponibilite et la securite
              de la Plateforme. Toutefois, le Service est fourni "en l'etat" sans garantie d'aucune sorte.
            </p>
            <p>
              Les rapports generes par l'intelligence artificielle sont fournis a titre indicatif et ne
              constituent pas des avis juridiques, comptables ou d'audit. L'Utilisateur est seul responsable
              de la verification et de la validation des contenus generes avant toute utilisation officielle
              ou reglementaire.
            </p>
            <p>
              L'Editeur ne saurait etre tenu responsable des dommages directs ou indirects resultant de
              l'utilisation de la Plateforme, y compris la perte de donnees, les interruptions de service
              ou les inexactitudes dans les rapports generes.
            </p>
          </section>

          {/* 9. Duree et resiliation */}
          <section>
            <h2 className="text-lg font-semibold" style={{ color: '#0A3B2E' }}>9. Duree et resiliation</h2>
            <p>
              Les presentes CGU sont applicables des l'inscription de l'Utilisateur et pour toute la duree
              d'utilisation de la Plateforme.
            </p>
            <p>
              L'Utilisateur peut a tout moment demander la suppression de son Compte en contactant
              contact@solvid.ia. La suppression entraine l'effacement des donnees personnelles dans un delai
              de 30 jours, sous reserve des obligations legales de conservation.
            </p>
            <p>
              L'Editeur se reserve le droit de suspendre ou de resilier l'acces d'un Utilisateur en cas de
              violation des presentes CGU, sans preavis ni indemnite.
            </p>
          </section>

          {/* 10. Droit applicable et juridiction */}
          <section>
            <h2 className="text-lg font-semibold" style={{ color: '#0A3B2E' }}>10. Droit applicable et juridiction</h2>
            <p>
              Les presentes CGU sont regies par le droit francais. En cas de litige relatif a l'interpretation
              ou a l'execution des presentes, les parties s'efforceront de trouver une solution amiable.
              A defaut, les Tribunaux de Paris seront seuls competents.
            </p>
          </section>

          {/* 11. Contact */}
          <section>
            <h2 className="text-lg font-semibold" style={{ color: '#0A3B2E' }}>11. Contact</h2>
            <p>
              Pour toute question relative aux presentes CGU, vous pouvez nous contacter a l'adresse
              suivante :
            </p>
            <p className="font-medium" style={{ color: '#059669' }}>
              contact@solvid.ia
            </p>
          </section>

        </CardContent>
      </Card>
    </div>
  );
}
