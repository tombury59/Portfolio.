# tom-bury.fr · Itinéraire

Un vol de nuit en avion en papier au-dessus de l'Anjou : huit escales, une par étape du parcours
(Lycée Chevrollier, Le Champenais, Ecolab, My Digital School, Blackfox, Negocom, le MBA), jusqu'à
l'atterrissage à côté du serveur maison. Chaque escale a son billet d'embarquement.

## Commandes

| Commande          | Rôle                                                  |
| :---------------- | :---------------------------------------------------- |
| `npm install`     | Installe les dépendances                              |
| `npm run dev`     | Serveur de dev sur `localhost:5173`                   |
| `npm run build`   | Vérifie les types puis construit le site dans `dist/` |
| `npm run preview` | Sert `dist/` en local pour vérifier                   |

## Où modifier quoi

| Quoi | Où |
| :--- | :- |
| Textes, billets, projets, liens | `index.html` (tout le contenu est dans la page, lisible sans JavaScript) |
| Couleurs, polices, mise en page | `src/style.css` (variables en haut du fichier) |
| Position des escales sur la carte, rythme du défilement | `src/stops.ts` |
| Relief, rivières, forêts, villes | `src/scene/world.ts` |
| Monuments (château, guinguette, relais, écoles, Blackfox, Negocom, maison) | `src/scene/landmarks.ts` |
| Avion en papier et sa traînée | `src/scene/plane.ts` |
| Caméra, trajectoire, colonnes de lumière, ciel | `src/scene/index.ts` |
| Fichiers copiés tels quels (robots.txt, llms.txt, sitemap.xml, favicons, images) | `public/` |

Ajouter une escale : un billet dans `index.html`, une position dans `STOP_XZ` et une durée dans
`HOP_SCREENS` (`src/stops.ts`), une hauteur de passage dans `PASS_HEIGHT` (`src/scene/index.ts`).

## Comment c'est fait

- **La page d'abord** : sans WebGL 2, l'itinéraire s'affiche comme une simple liste de billets.
- **La 3D se charge à part** (`src/scene/`, three.js) : sur ordinateur quand le navigateur est libre,
  sur téléphone au premier geste. La page reste lisible tout de suite et PageSpeed reste à 99–100.
- **Accessibilité** : la scène est ignorée des lecteurs d'écran, l'escale courante est annoncée,
  et avec « réduire les animations » la caméra passe d'une escale à l'autre sans voler.

## Mise en ligne (FTP, OVH)

1. `npm run build`
2. Envoyer **le contenu** de `dist/` dans `/home/tomburx/www` : `index.html`, le dossier `assets/`
   et le dossier `img/`. Ne pas toucher au dossier `hub` ni au `.htaccess` de la racine du serveur.
3. Cloudflare : Caching → Configuration → Purge Everything.
