# 🧱 Lego Manager

Application web de **suivi des pièces LEGO** : quelles pièces vous possédez, en combien d'exemplaires et dans quelles couleurs, avec le **poids** et la **valeur estimée en euros** de votre stock.

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
| **Pièces** | Inventaire complet : recherche, filtres par catégorie / couleur / emplacement / niveau de stock, tri par colonne, création, édition, suppression, entrées et sorties de stock avec motif, **poids et valeur par ligne et en pied de tableau**, export CSV. |
| **Pièces & couleurs** | La question « qu'est-ce que je possède ? » : **matrice pièces × couleurs** (une ligne par type de pièce, une colonne par couleur, nombre d'exemplaires dans chaque case, intensité proportionnelle), totaux par couleur, poids et valeur par ligne, vue « fiches », filtre par clic sur une couleur, export CSV. |
| **Sets** | Référencement des sets (numéro, thème, année, nombre de pièces), suivi de la progression de montage, statut (complet, incomplet, démonté, en construction, à vendre), export CSV. |
| **Emplacements** | Boîtes, tiroirs, bacs, étagères, sachets : contenu, quantité, nombre de références, accès direct au contenu, détection des pièces non rangées. |
| **Scanner photo** | Reconnaît les pièces sur une photo : **comptage automatique**, lecture de la **couleur**, proposition d'une **référence LEGO** avec indice de confiance, validation pièce par pièce, puis ajout au stock. Chaque comptage crée une **session** qui conserve la photo, le lot et les références retenues. |
| **Mouvements** | Historique chronologique des entrées / sorties avec motif, recherche, totaux et export CSV. |
| **Rapports** | Synthèse (avec **poids total et valeur estimée**), répartitions par catégorie et par couleur, **valeur par catégorie**, **poids / valeur par emplacement**, top 10 des références avec leur valeur, impression. |
| **Réglages** | Seuil de stock bas, **décote des pièces d'occasion** appliquée à la valorisation, explication du calcul poids / valeur, thème clair / sombre, export / import de sauvegarde JSON, jeu de démonstration, remise à zéro. |

## Poids et valeur du stock

| Notion | Comment c'est calculé |
| --- | --- |
| **Poids d'une ligne** | masse unitaire (g) × quantité |
| **Valeur d'une ligne** | prix unitaire (€) × quantité × décote d'état (100 % neuf, 70 % occasion, 42 % abîmé — réglable) |
| **Poids / prix unitaire** | saisis dans la fiche de la pièce, ou à défaut **estimés** à partir d'un référentiel de ~60 pièces courantes (brique 2x4 = 2,32 g et 0,18 €, plaque 1x4 = 0,55 g, axe Technic 6L = 1,5 g…) puis du poids moyen de la catégorie |
| **Sets** | poids et valeur globaux optionnels, additionnés au total de la collection dans les rapports |

Les prix sont des **ordres de grandeur du neuf**, pensés pour donner un ordre de grandeur du stock : chaque valeur reste personnalisable pièce par pièce (champ « Prix unitaire »), et la décote d'occasion se règle globalement.

## Reconnaissance des pièces sur photo

L'onglet **Scanner photo** fonctionne entièrement dans le navigateur, sans envoi d'image ni service externe.

1. **Capturer** : caméra (mobile ou webcam), import d'un fichier, ou photo de démonstration générée par l'application.
2. **Analyser** : le fond est mesuré sur les bords de l'image, puis chaque pièce est isolée comme une zone de couleur distincte (étiquetage des composantes connexes) — les pièces qui se touchent sont séparées par la ligne de jonction ou par la teinte.
3. **Décrire** : pour chaque pièce, on mesure la surface, les proportions, la couleur (comparaison en espace Lab avec les 20 couleurs LEGO) et on **compte les tenons** visibles par analyse de relief (les bosses éclairées forment des taches compactes).
4. **Rapprocher** : ces indices sont confrontés au référentiel (nombre de tenons, empreinte largeur × longueur, garnissage de la boîte, relief) pour classer les 5 meilleures références avec un score de confiance.
5. **Valider** : chaque proposition reste modifiable (référence, couleur, quantité) ; les pièces validées sont comptabilisées, regroupées par référence et couleur, avec le poids et la valeur du lot. Une **session de comptage** est archivée avec sa photo et son détail.

Limites assumées, signalées dans l'interface : sur une vue du dessus, la hauteur n'est pas mesurable, donc brique / plaque / tuile de même empreinte restent **ambiguës** (badge « à confirmer ») ; les pièces noires sur fond sombre, les reflets et les pièces transparentes demandent un fond contrasté. Les réglages (type de fond, contraste, taille minimale) permettent d'ajuster la détection.

## Détails techniques

- **React 18 + Vite**, aucune dépendance lourde (`lucide-react` pour les icônes).
- Données persistées dans le **localStorage** du navigateur — aucune donnée envoyée sur Internet.
- Référentiel intégré : 20 couleurs LEGO officielles, 13 catégories de pièces, 5 types d'emplacements, ~60 pièces avec poids et prix de référence.
- Interface responsive (sidebar repliable sur mobile) avec thème sombre.
- Sauvegarde / restauration complète au format JSON, plus exports CSV des pièces, sets et mouvements.
- Vision par ordinateur « maison » (aucune dépendance, aucun appel réseau) : segmentation par couleur de fond, détection de jonction, comptage de tenons, classification par empreinte.

## Structure

```
src/
  lib/
    lego.js      # couleurs, catégories, types d'emplacements
    catalog.js   # référentiel poids / prix / géométrie, décotes, calculs de valeur
    vision.js    # segmentation photo, comptage des tenons, classification LEGO
    demoPhoto.js # génération des photos de démonstration
    store.js     # état applicatif, persistance, statistiques, jeu de démo
    format.js    # formatage FR, exports CSV / fichiers
  components/
    ui.jsx       # modales, champs, états vides, notifications
  views/         # Dashboard, Parts, Colors, Sets, Locations, Scanner, Movements, Reports, Settings
  App.jsx        # navigation et mise en page
  styles.css     # design system (thèmes clair / sombre)
```

Au premier lancement, une collection de démonstration (36 références, 5 sets, 3 emplacements) est chargée pour explorer l'application ; elle peut être remplacée ou effacée depuis les réglages.
