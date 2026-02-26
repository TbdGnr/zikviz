Cet outil a été 100% Vibecodé par Cursor et le modèle composer 1.5

# Zikviz - Music Visualizer

Visualiseur musical : une image PNG transparente réagit aux basses de la musique.

## Fonctionnalités

- **Couleur de fond** : choix libre
- **Format** : 9:16 (vertical) ou 16:9 (horizontal)
- **Image PNG** : transparente, centrée, pulse avec les basses
- **Audio** : WAV (ou MP3)
- **Export** : vidéo WebM avec son, téléchargeable

## Utilisation

1. Ouvrir `index.html` dans un navigateur (Chrome/Firefox/Edge recommandés)
2. Choisir la couleur de fond
3. Sélectionner le format 9:16 ou 16:9
4. Charger une image PNG transparente
5. Charger un fichier audio WAV
6. Cliquer sur "Lancer" pour prévisualiser
7. Cliquer sur "Enregistrer" pour capturer la vidéo (avec son)
8. Cliquer sur "Arrêter l'enregistrement" puis télécharger le fichier .webm

## Lancer en local

```bash
npx serve .
```

Puis ouvrir http://localhost:3000

## Format de sortie

La vidéo est exportée en WebM (VP9 + Opus). Pour convertir en MP4 :

```bash
ffmpeg -i zikviz-xxx.webm -c:v libx264 -c:a aac zikviz.mp4
```
