# WANTED : les mites

Le tableau de chasse de la coloc. Chaque coloc compte en un tap les mites qu'il ou elle vient d'écraser, et toute la coloc voit le classement en direct.

- Site statique (GitHub Pages), sans build ni serveur.
- Les données sont dans Firebase Realtime Database (offre gratuite).
- L'accès se fait par un lien secret : `https://<toi>.github.io/mites/?t=<token>`.

## Mise en place

### 1. Créer la base Firebase

1. Sur [console.firebase.google.com](https://console.firebase.google.com), crée un projet (Google Analytics n'est pas nécessaire).
2. Dans **Créer › Realtime Database**, crée une base dans la région `europe-west1`, en **mode verrouillé**.

### 2. Brancher la page sur le projet

1. Dans **Paramètres du projet › Général › Tes applications**, ajoute une application **Web** (`</>`). Firebase Hosting n'est pas nécessaire.
2. Copie les valeurs de `firebaseConfig` dans [`js/config.js`](js/config.js) : `apiKey`, `authDomain`, `databaseURL`, `projectId` et `appId`.
   Ces valeurs sont publiques par nature : elles peuvent être commitées.

### 3. Générer le token

```bash
node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"
```

Garde-le de côté. **Ne le commite jamais** : le dépôt est public.

### 4. Poser les règles de sécurité

1. Dans **Realtime Database › Règles**, colle le contenu de [`database.rules.json`](database.rules.json).
2. Dans la console uniquement, remplace `__TOKEN__` par ton token, puis clique sur **Publier**.

Ces règles :
- n'ouvrent la lecture et l'écriture qu'avec ce token ;
- n'acceptent que les dix prénoms et les sept armes connues ;
- permettent d'ajouter une mite ou un nid détruit, ou d'en supprimer un de moins de 10 minutes (le bouton « annuler »), mais jamais de les modifier.

Après une mise à jour de `database.rules.json` (par exemple l'ajout des nids), recolle les règles de la même façon, sinon Firebase refusera les nouvelles écritures.

### 5. Mettre en ligne avec GitHub Pages

```bash
git push -u origin main
```

Dans le dépôt GitHub, va dans **Settings › Pages › Build and deployment**, choisis la source **Deploy from a branch**, puis la branche `main` et le dossier `/ (root)`.

### 6. Partager le lien

```
https://<toi>.github.io/mites/?t=<token>
```

À la première visite, chaque coloc choisit son affiche. Le téléphone retient ensuite le token et le prénom, donc on peut ajouter la page à l'écran d'accueil.

## Développer en local

```bash
python3 -m http.server 8000
```

- `http://localhost:8000/?demo=1&t=abcdefghijklmnopqrstuvwx` lance la démo avec des données en mémoire, sans Firebase.
- `http://localhost:8000/?demo=1&t=refusexxxxxxxxxxxxxxxxxx` simule un token refusé (« Saloon fermé »).

Pour lancer les tests (Node ≥ 20, sans dépendance) :

```bash
npm test
```

## Changer de token

Si le lien a fuité, génère un nouveau token, remplace l'ancien dans les règles Firebase et partage le nouveau lien. Les mites déjà comptées restent rangées sous l'ancien token : pour les garder, déplace le nœud `colocs/<ancien>` vers `colocs/<nouveau>` dans la console (export JSON, puis import).

## Fichiers

| Fichier | Rôle |
|---|---|
| `index.html`, `style.css` | La page et son thème western |
| `js/app.js` | Écrans et interactions |
| `js/logic.js` | Calculs : token, classement, armes, annulation |
| `js/firebase-store.js` / `js/memory-store.js` | Accès aux données, réel ou de démo |
| `js/config.js` | Colocs, armes, config Firebase |
| `database.rules.json` | Règles Firebase (modèle avec `__TOKEN__`) |
