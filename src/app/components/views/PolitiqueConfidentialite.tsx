/**
 * Politique de Confidentialite — RGPD Phase 2
 *
 * Conforme aux Articles 13-14 du RGPD.
 */

import { Card, CardContent } from "@/app/components/ui/card";
import { Lock } from "lucide-react";

interface PolitiqueConfidentialiteProps {
  onNavigate?: (view: string) => void;
}

export default function PolitiqueConfidentialite({ onNavigate }: PolitiqueConfidentialiteProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#059669' }}>
            <Lock className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#0A3B2E' }}>
              Politique de Confidentialite
            </h1>
            <p className="text-sm text-muted-foreground">Solvid.IA — Protection de vos donnees personnelles</p>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">Derniere mise a jour : mars 2026</p>
      </div>

      <Card>
        <CardContent className="prose prose-sm max-w-none pt-6 space-y-8 text-gray-700">

          {/* 1. Responsable de traitement */}
          <section>
            <h2 className="text-lg font-semibold" style={{ color: '#0A3B2E' }}>
              1. Responsable de traitement
            </h2>
            <p>
              Le responsable de traitement des donnees personnelles collectees via la plateforme Solvid.IA
              est :
            </p>
            <ul className="list-none pl-0 space-y-1">
              <li><strong>Raison sociale :</strong> Solvid SAS</li>
              <li><strong>Contact :</strong> contact@solvid.ia</li>
              <li><strong>Delegue a la Protection des Donnees (DPO) :</strong> dpo@solvid.ia</li>
            </ul>
          </section>

          {/* 2. Donnees collectees */}
          <section>
            <h2 className="text-lg font-semibold" style={{ color: '#0A3B2E' }}>
              2. Donnees collectees
            </h2>
            <p>Dans le cadre de l'utilisation de la Plateforme, nous collectons les categories de donnees suivantes :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Donnees d'identification :</strong> nom, prenom, adresse email.</li>
              <li><strong>Donnees d'authentification :</strong> mot de passe (stocke sous forme hashee via PBKDF2, jamais en clair).</li>
              <li><strong>Donnees ESG :</strong> donnees environnementales, sociales et de gouvernance saisies ou importees dans les dossiers clients.</li>
              <li><strong>Logs d'audit :</strong> adresse IP, user-agent, horodatage des actions, identifiant utilisateur.</li>
              <li><strong>Donnees importees :</strong> fichiers Excel, donnees ERP transmises via les connecteurs.</li>
              <li><strong>Donnees de session :</strong> tokens d'authentification, preferences d'interface.</li>
            </ul>
          </section>

          {/* 3. Finalites et base legale */}
          <section>
            <h2 className="text-lg font-semibold" style={{ color: '#0A3B2E' }}>
              3. Finalites et bases legales du traitement
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-semibold" style={{ color: '#0A3B2E' }}>Finalite</th>
                    <th className="text-left py-2 pr-4 font-semibold" style={{ color: '#0A3B2E' }}>Base legale</th>
                    <th className="text-left py-2 font-semibold" style={{ color: '#0A3B2E' }}>Donnees concernees</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 pr-4">Gestion du compte utilisateur</td>
                    <td className="py-2 pr-4">Execution du contrat (Art. 6.1.b RGPD)</td>
                    <td className="py-2">Nom, email, mot de passe</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 pr-4">Saisie et stockage des donnees ESG</td>
                    <td className="py-2 pr-4">Execution du contrat (Art. 6.1.b RGPD)</td>
                    <td className="py-2">Donnees ESG, fichiers importes</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 pr-4">Securite et tracabilite</td>
                    <td className="py-2 pr-4">Interet legitime (Art. 6.1.f RGPD)</td>
                    <td className="py-2">Logs d'audit (IP, user-agent)</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Generation de rapports par IA</td>
                    <td className="py-2 pr-4">Consentement (Art. 6.1.a RGPD)</td>
                    <td className="py-2">Donnees ESG transmises a Anthropic Claude</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 4. Destinataires */}
          <section>
            <h2 className="text-lg font-semibold" style={{ color: '#0A3B2E' }}>
              4. Destinataires des donnees
            </h2>
            <p>Vos donnees peuvent etre transmises aux sous-traitants suivants :</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Supabase</strong> (hebergement base de donnees) — Serveurs situes dans l'Union
                europeenne. Supabase agit en tant que sous-traitant conformement a l'Article 28 du RGPD.
              </li>
              <li>
                <strong>Anthropic</strong> (intelligence artificielle — Claude) — Les donnees ESG sont
                transmises aux serveurs d'Anthropic situes aux Etats-Unis uniquement lorsque l'Utilisateur
                a donne son consentement explicite pour le traitement IA. Ce transfert est encadre par des
                Clauses Contractuelles Types (CCT) conformement a l'Article 46.2.c du RGPD.
              </li>
            </ul>
            <p>
              Aucune donnee personnelle n'est vendue ou transmise a des tiers a des fins commerciales.
            </p>
          </section>

          {/* 5. Duree de conservation */}
          <section>
            <h2 className="text-lg font-semibold" style={{ color: '#0A3B2E' }}>
              5. Duree de conservation
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Comptes actifs :</strong> conserves pendant la duree d'utilisation du service + 2 ans apres la derniere connexion.</li>
              <li><strong>Logs d'audit :</strong> conserves pendant 2 ans a compter de leur enregistrement.</li>
              <li><strong>Sessions d'authentification :</strong> 24 heures maximum.</li>
              <li><strong>Donnees ESG :</strong> conservees pendant la duree du contrat, puis supprimees sur demande.</li>
              <li><strong>Donnees supprimees sur demande :</strong> effacement dans un delai de 30 jours, sous reserve des obligations legales de conservation.</li>
            </ul>
          </section>

          {/* 6. Vos droits */}
          <section>
            <h2 className="text-lg font-semibold" style={{ color: '#0A3B2E' }}>
              6. Vos droits
            </h2>
            <p>
              Conformement au RGPD, vous disposez des droits suivants sur vos donnees personnelles :
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Droit d'acces</strong> (Art. 15) : obtenir la confirmation que vos donnees sont
                traitees et en recevoir une copie.
              </li>
              <li>
                <strong>Droit de rectification</strong> (Art. 16) : corriger des donnees inexactes ou
                incompletes.
              </li>
              <li>
                <strong>Droit a l'effacement</strong> (Art. 17) : demander la suppression de vos donnees
                dans les conditions prevues par la loi.
              </li>
              <li>
                <strong>Droit a la portabilite</strong> (Art. 20) : recevoir vos donnees dans un format
                structure, couramment utilise et lisible par machine.
              </li>
              <li>
                <strong>Droit a la limitation du traitement</strong> (Art. 18) : demander la suspension
                du traitement de vos donnees dans certaines conditions.
              </li>
              <li>
                <strong>Droit d'opposition</strong> (Art. 21) : vous opposer au traitement de vos donnees
                pour des motifs legitimes.
              </li>
            </ul>
            <p>
              Pour exercer ces droits, vous pouvez nous contacter a l'adresse{" "}
              <strong style={{ color: '#059669' }}>contact@solvid.ia</strong> ou via la page{" "}
              <button
                className="text-[#059669] underline hover:text-[#048558] font-medium"
                onClick={() => onNavigate?.("parametres")}
              >
                Parametres
              </button>{" "}
              de votre compte.
            </p>
            <p>
              Vous disposez egalement du droit d'introduire une reclamation aupres de la CNIL
              (Commission Nationale de l'Informatique et des Libertes) : www.cnil.fr.
            </p>
          </section>

          {/* 7. Cookies et stockage local */}
          <section>
            <h2 className="text-lg font-semibold" style={{ color: '#0A3B2E' }}>
              7. Cookies et stockage local
            </h2>
            <p>La Plateforme utilise les mecanismes de stockage suivants :</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Cookies essentiels :</strong> cookies de session strictement necessaires au
                fonctionnement de l'authentification. Aucun cookie de tracage publicitaire n'est utilise.
              </li>
              <li>
                <strong>localStorage :</strong> stockage des preferences d'interface utilisateur
                (theme, sidebar, consentement cookies).
              </li>
              <li>
                <strong>IndexedDB :</strong> stockage local des donnees ESG pour permettre le
                fonctionnement hors ligne. Les donnees sont isolees par navigateur et ne sont pas
                accessibles par d'autres sites.
              </li>
            </ul>
          </section>

          {/* 8. Securite */}
          <section>
            <h2 className="text-lg font-semibold" style={{ color: '#0A3B2E' }}>
              8. Securite des donnees
            </h2>
            <p>Nous mettons en oeuvre les mesures de securite suivantes :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Chiffrement des mots de passe :</strong> algorithme PBKDF2 avec sel unique par utilisateur.</li>
              <li><strong>Communications chiffrees :</strong> protocole HTTPS (TLS 1.2+) pour toutes les transmissions.</li>
              <li><strong>Isolation des donnees :</strong> IndexedDB isolee par origine (domaine + protocole + port).</li>
              <li><strong>Controle d'acces :</strong> systeme de roles et permissions granulaires (RBAC).</li>
              <li><strong>Audit trail :</strong> journalisation de toutes les actions sensibles.</li>
            </ul>
          </section>

          {/* 9. Modifications */}
          <section>
            <h2 className="text-lg font-semibold" style={{ color: '#0A3B2E' }}>
              9. Modifications de la politique
            </h2>
            <p>
              Nous nous reservons le droit de modifier la presente Politique de Confidentialite a tout
              moment. En cas de modification substantielle, les Utilisateurs seront informes par email
              a l'adresse associee a leur compte. La date de derniere mise a jour est indiquee en haut
              de ce document.
            </p>
            <p>
              La poursuite de l'utilisation de la Plateforme apres notification vaut acceptation des
              modifications.
            </p>
          </section>

          {/* 10. Contact DPO */}
          <section>
            <h2 className="text-lg font-semibold" style={{ color: '#0A3B2E' }}>
              10. Contact — Delegue a la Protection des Donnees
            </h2>
            <p>
              Pour toute question relative a la protection de vos donnees personnelles ou pour exercer
              vos droits, vous pouvez contacter notre DPO :
            </p>
            <ul className="list-none pl-0 space-y-1">
              <li><strong>Email DPO :</strong>{" "}
                <span className="font-medium" style={{ color: '#059669' }}>dpo@solvid.ia</span>
              </li>
              <li><strong>Contact general :</strong>{" "}
                <span className="font-medium" style={{ color: '#059669' }}>contact@solvid.ia</span>
              </li>
            </ul>
          </section>

        </CardContent>
      </Card>
    </div>
  );
}
