// ============================================================================
// SEED DATA - Phase 8 Collaboration
// ============================================================================
// Données de test pour le système de commentaires et collaboration

import { projectId, publicAnonKey } from "/utils/supabase/info";

export async function seedPhase8Comments() {
  console.log("🌱 Seeding Phase 8 collaboration data...");

  const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-aa780fc8`;

  try {
    // Example comments for demonstration
    const sampleComments = [
      {
        entityType: "indicator",
        entityId: "ind-env-001",
        authorId: "user-1",
        authorName: "Marie Dupont",
        authorAvatar: "MD",
        content:
          "Attention, la méthodologie de calcul pour cet indicateur a changé selon la dernière mise à jour de la norme. Il faut utiliser le facteur d'émission ADEME 2024.",
      },
      {
        entityType: "indicator",
        entityId: "ind-env-001",
        authorId: "user-2",
        authorName: "Jean Martin",
        content:
          "Merci @[Marie Dupont](user-1) pour la précision ! J'ai mis à jour le calcul avec le nouveau facteur.",
      },
      {
        entityType: "pack",
        entityId: "pack-demo-123",
        authorId: "user-3",
        authorName: "Sophie Bernard",
        content:
          "Ce pack est presque complet ! Il manque juste 3 preuves documentaires pour les indicateurs sociaux.",
      },
      {
        entityType: "indicator",
        entityId: "ind-social-005",
        authorId: "user-1",
        authorName: "Marie Dupont",
        content:
          "Les données RH ne sont pas cohérentes entre Q1 et Q2. @[Jean Martin](user-2) peux-tu vérifier ?",
      },
      {
        entityType: "indicator",
        entityId: "ind-gov-010",
        authorId: "user-4",
        authorName: "Pierre Dubois",
        content:
          "Excellente progression sur cet indicateur de gouvernance ! Les KPIs sont maintenant alignés avec le référentiel GRI.",
      },
    ];

    let createdCount = 0;

    for (const comment of sampleComments) {
      try {
        const response = await fetch(`${baseUrl}/comments`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(comment),
        });

        if (response.ok) {
          const data = await response.json();
          console.log(
            `✅ Comment created: ${data.comment.id} on ${comment.entityType}:${comment.entityId}`
          );
          createdCount++;
        } else {
          const error = await response.text();
          console.error(`❌ Failed to create comment: ${error}`);
        }
      } catch (error: any) {
        console.error(`❌ Error creating comment: ${error.message}`);
      }
    }

    console.log(`🎉 Phase 8 seed complete! Created ${createdCount}/${sampleComments.length} comments`);

    return {
      success: true,
      message: `${createdCount} commentaires de démonstration créés`,
    };
  } catch (error: any) {
    console.error("❌ Phase 8 seed failed:", error);
    return {
      success: false,
      message: error.message,
    };
  }
}

// Export helper for console debugging
export const debugPhase8 = {
  help: () => {
    console.log(`
🔧 Debug Phase 8 - Collaboration
================================

Fonctions disponibles :
- seedPhase8Comments()    : Créer des commentaires de test
- clearComments()         : Supprimer tous les commentaires (à implémenter)
- listComments(entityId)  : Lister commentaires d'une entité (à implémenter)

Usage :
> await seedPhase8Comments()
`);
  },
  
  seed: seedPhase8Comments,
};
