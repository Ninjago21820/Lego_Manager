# 🧱 Lego Manager

Application web de **suivi des pièces LEGO** : inventaire, sets, emplacements de rangement, mouvements de stock et statistiques.

## Lancer l'application

```bash
npm install
npm run dev
```

Puis ouvrir http://localhost:5173 (ou l'aperçu live).

Build de production :

```bash
npm run build && npm run preview
```

## Fonctionnalités

| Écran | Ce que ça fait |
| --- | --- |
| **Tableau de bord** | Pièces en stock, sets suivis, alertes de stock bas, répartition par catégorie, palette dominante, derniers mouvements, progression des montages en cours. |
| **Pièces** | Inventaire complet : recherche, filtres par catégorie / couleur / emplacement / niveau de stock, tri par colonne, création, édition, suppression, entrées et sorties de stock avec motif, export CSV. |
| **Sets** | Référencement des sets (numéro, thème, année, nombre de pièces), suivi de la progression de montage, statut (complet, incomplet, démonté, en construction, à vendre), export CSV. |
| **Emplacements** | Boîtes, tiroirs, bacs, étagères, sachets : contenu, quantité, nombre de références, accès direct au contenu, détection des pièces non rangées. |
| **Mouvements** | Historique chronologique des entrées / sorties avec motif, recherche, totaux et export CSV. |
| **Rapports** | Synthèse, répartitions par catégorie et par couleur, top 10 des références, occupation par emplacement, impression. |
| **Réglages** | Seuil de stock bas, thème clair / sombre, export / import de sauvegarde JSON, jeu de démonstration, remise à zéro. |

## Détails techniques

- **React 18 + Vite**, aucune dépendance lourde (`lucide-react` pour les icônes).
- Données persistées dans le **localStorage** du navigateur — aucune donnée envoyée sur Internet.
- Référentiel intégré : 20 couleurs LEGO officielles, 13 catégories de pièces, 5 types d'emplacements.
- Interface responsive (sidebar repliable sur mobile) avec thème sombre.
- Sauvegarde / restauration complète au format JSON, plus exports CSV des pièces, sets et mouvements.

## Structure

```
src/
  lib/
    lego.js      # couleurs, catégories, types d'emplacements
    store.js     # état applicatif, persistance, statistiques, jeu de démo
    format.js    # formatage FR, exports CSV / fichiers
  components/
    ui.jsx       # modales, champs, états vides, notifications
  views/         # Dashboard, Parts, Sets, Locations, Movements, Reports, Settings
  App.jsx        # navigation et mise en page
  styles.css     # design system (thèmes clair / sombre)
```

Au premier lancement, une collection de démonstration (36 références, 5 sets, 3 emplacements) est chargée pour explorer l'application ; elle peut être remplacée ou effacée depuis les réglages.
