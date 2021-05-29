# Réseau Ethereum semi privé

Le but est ici de lancer son noeud ethereum et de la connecter au réseau existant.

## Genesis
Le fichier genesis.json contient les informations pour initier le réseau Ethereum.

## Installation de geth
Les instructions suivantes permettent de l'installer sous Ubuntu : https://github.com/ethereum/go-ethereum/wiki/Installation-Instructions-for-Ubuntu  

## Lancer une instance d'Ethereum
1. Se placer dans le dossier eth du repository git, créer un dossier _data_ vide puis initialiser le premier block :   
`ETHDIR=. && geth --datadir ${ETHDIR}/data init ${ETHDIR}/genesis.json`

2. Puis on lance l'instance avec la console :  
̀`ETHDIR=. &&  geth --datadir ${ETHDIR}/data --nodiscover --networkid 2120212 --port 32313 --rpcport 8545 -verbosity 6 console 2>> ${ETHDIR}/01.log`  
Normalement, il n'y a pas de peers :  
`admin.peers` renvoie []  
Pour trouver l'enode de l'instance :  
`admin.nodeInfo` renvoie un fichier json contenant les infos de notre noeud.

3. Pour lancer un miner :  
̀`ETHDIR=. &&  geth --datadir ${ETHDIR}/data --networkid 2120212 --mine --etherbase=0x2120212212021221202122120212212021202120 --nodiscover --minerthreads 1 --gasprice "0" --port 32313 --rpcport 8543`  
Comme vous pouvez le constatez, l'ether est envoyé sur une adresse non accessible (composée de 212). Il est impératif de respecter cette règle sous pein d'exclusion.

## Se connecter à un noeud d'Ethereum
Refaire les deux premières étapes précédentes pour obtenir la console, c'est-à-dire une instance vivant d'ethereum, puis :    
`admin.addPeer("enode://pubkey@127.0.0.1:32313")`

Pour rendre l'ajout de ce peer persistant, utiliser le fichier _data/geth/static-nodes.json_  
`["enode://pubkey1@ip:port", "enode://pubkey2@ip:port"]`  
L'ajout doit idéalement être fait sur la machine qui ajoute et dans celle qui est ajoutée.

## Autoriser l'ajout d'un Ethereum
Ouvrir le port de l'ip cible afin d'autoriser celle-ci à se connecter.

De la documentation se trouve ici : https://github.com/ethereum/go-ethereum/wiki/Setting-up-private-network-or-local-cluster et ici : https://github.com/ethereum/go-ethereum/wiki/Private-network

# Récapitulatif de création de noeud
1. On récupère un fichier _genesis.json_
2. On initialise la blockchain avec la commande décrite plus haut
3. On peuple le fichier _static-nodes.json_ avec les noeuds connus.
4. On informe ces noeuds de notre arrivée sur le réseau afin qu'ils puissent aussi rajouter la nouvelle entrée dans leur _static-nodes.json_
5. On ouvre les ports rpc de l'instance et on lance le mineur pour se synchroniser avec les autres noeuds (après avoir vérifié que l'ether miné est bien envoyé dans l'adresse puits)