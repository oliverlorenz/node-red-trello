var Trello = require('node-trello');

module.exports = function (RED) {
  function TrelloGetNewCardNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    var nodeContext = this.context();

    // Retrieve the config node
    var credentialNode = RED.nodes.getNode(config.trello);
    var trello = new Trello(credentialNode.apikey, credentialNode.secret);
    this.on('input', function (msg) {
      var trelloData = msg.trello || {};
      var listId = trelloData.idList || config.idList;
      var boardId = trelloData.idBoard || config.idBoard;

      var lastFetched = '';
      try {
        lastFetched = nodeContext.get('lastFetched');
      } catch (e) {
        node.error(e)
      }

      function outputNewCardsAndSetLastFetched(cardData, lastFetchedString, triggeredString) {
        var lastFetchedDate = new Date(lastFetchedString);
        var triggeredDate = new Date(triggeredString);
        for (let i = 0; i < cardData.length; i++) {
          var id = cardData[i].id;
          var cardDate = new Date(1000 * parseInt(id.substring(0, 8), 16));
          if (cardDate > lastFetchedDate && cardDate <= triggeredDate) {
            node.send({payload: cardData[i]});
          }
        }
        nodeContext.set('lastFetched', triggeredDate.toString()); // Set to triggered time so we can be sure not to miss any
        node.status({fill:"green",shape:"dot",text:triggeredDate.toISOString().substring(0,19)});
      }

      if (!lastFetched) {
        if (msg.payload.initialTimeStamp) {
          lastFetched = msg.payload.initialTimeStamp; // todo output message that it used the initial time stamp
        }
      }


      if (lastFetched) {
        var triggeredString = new Date().toString();
        if (listId) {
          trello.get('/1/lists/' + listId + '/cards', (err, data) => {
                if (err) {
                  node.error(err)
                } else {
                  outputNewCardsAndSetLastFetched(data, lastFetched, triggeredString)
                }
              }
          );
        } else if (boardId) {
          trello.get('/1/boards/' + boardId + '/cards', (err, data) => {
                if (err) {
                  node.error(err)
                } else {
                  outputNewCardsAndSetLastFetched(data, lastFetched, triggeredString)
                }
              }
          );
        } else {
          trello.get('/1/members/me/boards', (err, data) => {
                if (err) {
                  node.error(err)
                } else {
                  for (let i = 0; i < data.length; i++) {
                    trello.get('/1/boards/' + data[i].id + '/cards', (err, data) => {
                          if (err) {
                            // todo should ouptu to user possible missed cards between lastFetched and triggeredString
                            node.error(err)
                          } else {
                            outputNewCardsAndSetLastFetched(data, lastFetched, triggeredString)
                          }
                        }
                    );
                  }
                }
              }
          );
        }
      } else {
        nodeContext.set('lastFetched', new Date().toString());
      }
    })
  }


  RED.nodes.registerType('trello-get-new-card', TrelloGetNewCardNode);
};
