# Déploiement de tom-bury.fr (FTP)

Le site est 100 % statique (HTML / CSS / JS). Il suffit d'envoyer des fichiers
par FTP sur ton hébergement OVH — aucune installation côté serveur.

## 1. Ce qu'il faut envoyer

Envoie **le contenu du dossier `app/`** (et pas le dossier `app` lui-même) à la
racine web de ton hébergement.

```
app/
├── index.html      ← la page
├── .htaccess       ← config Apache (compression, cache, redirection www) — à garder
├── css/
├── js/
├── img/
└── fonts/
```

👉 Concrètement : à la fin, sur le serveur tu dois avoir `index.html` **directement**
dans la racine web, pas dans un sous-dossier `app/`.

Tu n'as **pas besoin** d'envoyer ces fichiers (ce sont des fichiers de développement) :
`sass/`, `assets/`, `gulpfile.js`, `package.json`, `README.md`, `.github/`, `DEPLOIEMENT.md`.
Le dossier `app/sass/` peut aussi être ignoré.

## 2. Trouver la racine web et les accès FTP (OVH)

Dans ton **Espace client OVH** → **Hébergements** → ton hébergement :

- **FTP-SSH** : tu y trouves le **serveur FTP** (ex. `ftp.cluster0XX.hosting.ovh.net`),
  ton **login** et tu peux (ré)initialiser le **mot de passe**.
- La **racine web** est le dossier **`www/`** (parfois `public_html`). C'est là que
  vont tes fichiers.

OVH envoie aussi ces infos par email à la création de l'hébergement
(« Les informations de connexion… »).

## 3. Envoyer avec FileZilla (gratuit)

1. Installe **FileZilla** (filezilla-project.org).
2. En haut : **Hôte** = `ftp.clusterXXX.hosting.ovh.net`, **Identifiant** = ton login,
   **Mot de passe**, **Port** = `21` → *Connexion rapide*.
3. À gauche (local), ouvre `C:\Users\tombury\Documents\PER\portfolio\app`.
4. À droite (serveur), entre dans le dossier **`www`**.
5. Sélectionne **tout le contenu** de `app` (Ctrl+A) et glisse-le dans `www`.
6. Attends la fin du transfert. Ouvre **https://tom-bury.fr** 🎉

> Astuce : si un vieux `index.html` ou dossier de démo est déjà dans `www`,
> supprime-le avant d'envoyer.

## 4. HTTPS (gratuit)

OVH fournit un certificat **Let's Encrypt** gratuit :
- Espace client → ton hébergement → onglet **Multisite** (ou **SSL**) → active le
  **certificat SSL**. L'activation peut prendre de quelques minutes à ~1 h.
- Une fois actif, pour **forcer** le HTTPS, ouvre `.htaccess` et **décommente** le bloc
  « Forcing `https://` » (retire les `#` des 5 lignes du `RewriteCond`/`RewriteRule`),
  puis renvoie le fichier.

## 5. Le domaine pointe-t-il vers l'hébergement ?

Si le domaine `tom-bury.fr` **et** l'hébergement sont chez OVH, l'association est
généralement automatique. Sinon : Espace client → **Hébergements** → **Multisite**
→ ajoute le domaine `tom-bury.fr`.

## 6. Mettre à jour le site plus tard

Modifie les fichiers en local, puis **réenvoie uniquement les fichiers changés** par
FTP (FileZilla écrase l'ancienne version). Pense à vider le cache du navigateur
(Ctrl+F5) si tu ne vois pas le changement tout de suite.

---

## À savoir / pistes d'amélioration

- **Formulaire de contact** : il a été remplacé par un bouton « M'écrire un email »
  (`mailto:`), qui fonctionne sans serveur. Si tu veux un vrai formulaire sur un site
  statique, le plus simple est un service gratuit comme **Formspree** (on pourra
  l'ajouter plus tard).
- **Image de partage (réseaux sociaux)** : `img/favicon/og-image.png` et les favicons
  sont encore ceux du template. À remplacer quand tu auras une image/un logo à toi
  (pour l'aperçu quand tu partages le lien).
- **Couvertures de projets** : ce sont des visuels générés (dans `img/works/*.svg`).
  Tu peux les remplacer par de vraies captures d'écran si tu préfères.
