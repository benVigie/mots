Mots.js
====

Un jeu de mots fléchés multijoueur basé sur Node.js !
Les grilles sont récupérés chez Metro. Vous pouvez choisir de lancer la grille du jour ou jouer sur la grille de votre choix.

![Mots.js](http://img15.hostingpics.net/pics/551904Capture.png "Mots.js")

Finit les parties à 4 autour d'un bureau à dicter vos mots à votre collègue. Vous trouvez tout les mots ? Vous êtes le meilleur ? Prouvez le !

![Mots.js](http://img15.hostingpics.net/pics/232986Capture2.png "Mots.js")

## Comment jouer ?

1. Installez [Node.js](http://nodejs.org/)

2. Téléchargez ou clonez le projet chez vous

3. Ouvrez une console et déplacez vous à la racine du projet 

4. Installez les dependances de Node.js en tapant `npm install` dans votre console

5. Modifier l'adresse de votre PC ou le port selon vos préférences en modifiant le fichier *conf.json*
  
6. Lancez le serveur en tapant `node server.js`

7. Ouvrez votre navigateur à la page `http://votreserveur:port` (par défaut `http://localhost:2121`)

8. Quand vous êtes prêt, écrivez `!start` dans le chat. Puis amusez vous ! :smile:

#### Options

Par défaut si vous ne rajoutez pas de paramètre lors du lancement du serveur, le jeu ira charger la grille Metro du jour.

Pour forcer le chargement d'une grille, rajouter simplement son numéro à la fin de votre commande.
Par exemple la commande `node server.js 2228` chargera la grille Metro numéro 2228

## Dépendences Node.js

**Mots.js** utilise les modules Express, Jade et Socket.io.


## Crédits

Les images des "petits monstres" utilisées dans le projet ont été réalisées par le talentuex [Buatoom](https://dribbble.com/buatoom)


## Notes

Toute contribution au projet est la bienvenue !
N'hésitez pas à remonter tout bug ou suggestions via Github
