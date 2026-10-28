# Portfolio — Tom Bury

Portfolio personnel de Tom Bury, développeur full-stack basé à Angers.
En ligne : [tom-bury.fr](https://tom-bury.fr)

## Contenu

- Présentation, compétences, expérience et formation
- Projets (NegoCRM, Prono Ping, Synergia, Wishlist, PhoBee…)
- Contact

## Stack

HTML, CSS (Sass), JavaScript — site 100 % statique, sans build obligatoire.
Thème sombre, parallaxe, et une version mobile dédiée (barre de navigation flottante).

## Lancer en local

Servir le dossier `app/` avec un petit serveur :

```
cd app
npx serve .
```

## Déploiement

Envoyer le contenu de `app/` sur l'hébergement. Détails dans [DEPLOIEMENT.md](DEPLOIEMENT.md).

## Crédits

Basé sur le template [Personal-Website](https://github.com/barry-far/Personal-Website) de Barry Fardar (licence MIT), adapté et modifié.

## Build du CSS

Le site charge un seul fichier, `app/css/site.min.css` (loader + plugins + main + couleurs + styles du projet).
Après toute modification des fichiers CSS : `node tools/build-css.js`, puis incrémenter `?v=` dans `app/index.html`.
