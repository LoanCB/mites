# Compteur de mites de la coloc — conception

Date : 2026-11-11

## Intention

Une page web pour téléphone, drôle et très simple : chaque coloc note les mites
qu'il ou elle vient d'écraser, et toute la coloc voit le classement. C'est un
jeu entre colocs, pas un outil. Le plaisir vient de l'animation et du
classement, pas de la précision des données.

Moment d'usage : à la coloc, téléphone en main, juste après avoir écrasé une
mite (le plus souvent à la main).

## Objectifs

- Ajouter une mite en **un seul tap**, avec une animation satisfaisante : une
  main vient écraser une mite.
- Voir son propre total et le classement de toute la coloc, mis à jour en
  direct sur tous les téléphones.
- Noter, sans effort, l'arme utilisée, ce qui donne un classement des armes.
- Aucun compte, aucun mot de passe. On accède par un lien qui contient un token.
- Architecture minimale : **pas d'API ni de serveur à écrire ou à maintenir.**

## Non-objectifs

- Pas d'authentification par personne. Le token protège des inconnus, pas des
  colocs entre eux : quelqu'un qui a le lien peut techniquement compter une
  mite au nom d'un autre. C'est assumé, on fait confiance aux colocs.
- Pas d'administration, pas d'ajout de colocs depuis l'interface (la liste est
  fixe, dans le code).
- Pas de version ordinateur soignée : elle doit fonctionner, mais on optimise
  pour le téléphone.

## Anti-objectifs (échec même si ça marche)

- Ajouter une mite demande plusieurs taps ou un formulaire.
- Le design est sérieux, plat ou générique : il doit faire rire.
- Il faut un backend à héberger ou un build à lancer pour déployer.

## Contraintes

- Hébergement : **GitHub Pages** (Loan a un compte GitHub). Site statique.
- Données : **Firebase Realtime Database** (offre gratuite), écrite directement
  depuis la page avec le SDK web. C'est le choix de Loan, préféré à PocketBase
  sur son VPS.
- Colocs, liste fixe et dans cet ordre : Lallie, Pascale, Camille, Clara,
  Eurydice, Katja, Alexandre, Edouard, Guy, Loan.
- Interface en français.

## Ce qui a été décidé

### Style : western « Wanted » (choix de Loan)

Papier vieilli (beige, brun foncé), typographie serif épaisse façon affiche de
prime, double bordure. Les mites tuées sont des **« primes »**, le joueur est
un **« chasseur »**, le message après un écrasement est **« Abattue ! »**.
Les maquettes validées sont dans `.superpowers/brainstorm/*/content/`
(`directions.html`, option C, et `flow.html`).

### Parcours (validé par Loan)

1. **Arrivée par le lien** `https://…/?t=<token>`.
   - Sans token, ou avec un token refusé par Firebase : écran « Saloon fermé »
     sans aucune donnée.
2. **« Qui es-tu, étranger ? »** (première visite seulement) : une grille de
   dix affiches WANTED, une par coloc. Le choix est mémorisé sur le téléphone
   (localStorage), avec le token, pour que la page marche même sans le
   paramètre dans l'URL lors des visites suivantes. Un petit lien discret
   (« Pas toi ? ») permet de changer d'identité.
3. **Écran principal** :
   - En-tête « WANTED », « Chasseur : <prénom> », total « N primes ».
   - Une rangée d'armes : ✋ main (sélectionnée par défaut), 🩴 chausson,
     📕 livre, 🗞️ journal, 🧹 balai, ❓ autre. L'arme choisie reste
     sélectionnée jusqu'au prochain changement.
   - Une grande zone avec une mite. Un tap fait descendre la main qui
     l'écrase, affiche « Abattue ! », puis +1. Une nouvelle mite revient
     ensuite pour le coup suivant.
   - « ↶ annuler la dernière » : supprime la dernière mite enregistrée **depuis
     ce téléphone**, une seule fois (l'identifiant de cet événement est gardé
     en localStorage ; le bouton disparaît après usage ou au tap suivant).
     Choix du builder-check, tranché par Claude : on corrige une erreur de
     doigt, on ne peut pas effacer tout son historique.
4. **Tableau des primes** : le classement des dix colocs par total (🤠 pour le
   premier), puis « Armes favorites » en pourcentage sur toute la coloc. Mis à
   jour en direct.

### Données (mon choix, validé implicitement avec l'architecture)

Firebase Realtime Database, tout sous le token :

```
/colocs/<token>/kills/<pushId>
  who:    "Loan"            // un des dix prénoms
  weapon: "main"            // main | chausson | livre | journal | balai | autre
  at:     1794390901000     // timestamp serveur (ms)
```

Chaque mite est un événement, et les totaux et statistiques sont calculés
côté client. Le volume restera petit (quelques centaines d'événements), donc
le client écoute toute la liste. Ce modèle permet d'annuler une mite et de
calculer les statistiques d'armes sans compteur à synchroniser.

### Sécurité (mon choix)

- Le token est une chaîne aléatoire longue (≥ 24 caractères), générée une fois.
- Les règles Firebase :
  - interdisent toute lecture ou écriture hors de `/colocs/<token>`, donc
    impossible de lister les tokens ;
  - **inscrivent le token valide en dur** dans les règles, donc un autre
    token ne peut pas créer son propre espace ;
  - valident `who` (dans la liste des dix), `weapon` (dans la liste des armes)
    et `at` (= `now`, timestamp serveur) ;
  - n'autorisent que la création et la suppression d'un événement, pas sa
    modification.
- La config web Firebase (apiKey, etc.) est publique par nature : elle est
  dans le code, ce qui est normal.

### Technique (mon choix)

- Un seul `index.html`, plus éventuellement `style.css` et `app.js`, en
  JavaScript natif. Aucun framework ni build.
- SDK Firebase modulaire chargé depuis le CDN officiel `gstatic.com` (modules
  ES).
- Mites et mains : SVG inline ou emoji ; animations en CSS (transform,
  keyframes). Vibration courte (`navigator.vibrate`) au moment de l'écrasement
  si le téléphone le permet.
- Un `database.rules.json` dans le dépôt, à coller dans la console Firebase.
  **Le dépôt sera public** (GitHub Pages gratuit) : ce fichier contient un
  marqueur `__TOKEN__` à la place du vrai token, et le README dit de le
  remplacer seulement au moment du collage dans la console. Le vrai token ne
  figure jamais dans le dépôt, uniquement dans les règles Firebase et l'URL
  partagée. (Choix de Claude.)
- Une règle de suppression limite l'effacement aux événements récents
  (`at > now - 10 min`), en cohérence avec l'annulation unique.
- Un `README` en français qui explique pas à pas : créer le projet Firebase,
  coller la config et les règles, générer le token, activer GitHub Pages et
  construire l'URL à partager.

## Laissé au builder

- Détail des animations (rebond de la main, éclaboussure, confettis de poussière,
  petite secousse de l'écran), tant que l'écrasement reste instantané et que
  l'écriture en base n'est pas bloquante.
- Navigation entre l'écran principal et le tableau des primes (onglets,
  défilement, bouton).
- Polices (une Google Font western type « Rye » ou « Smokum » est bienvenue).
- Surnoms de chasseurs éventuels dans le classement.
- Comportement hors ligne : le cache local de Firebase suffit.

## Ajout du 2026-11-12 : destruction d'un nid

Demande de Loan : un bouton sous la mite pour noter la destruction d'un nid,
avec une animation où l'écran se remplit de mites qui s'envolent. Loan a
préféré qu'on se lance sans questions ; les choix ci-dessous sont ceux de
Claude.

- Bouton « 🔥 Détruire un nid » sous le portrait. Un tap enregistre le nid,
  sans confirmation (l'annulation sert de filet).
- Données : liste séparée `/colocs/<token>/nests/<pushId> = { who, at }`,
  mêmes règles que les mites (création, suppression sous 10 min, `at` =
  horodatage serveur). Pas d'arme pour un nid.
- Un nid ne compte pas comme une prime : compteur à part (« 🔥 N nids
  détruits ») sous le total, et mention « · 🔥 N nids » dans le classement,
  qui reste trié sur les mites.
- « Annuler » porte sur la dernière action de ce téléphone, mite ou nid.
- Animation : 40 à 160 mites (selon la taille de l'écran) jaillissent du
  bouton, couvrent l'écran, puis s'envolent par le haut ; tampon « Nid
  détruit ! » et vibration. Sans animation si le téléphone demande moins de
  mouvement (tampon seul).
