var Trello = require('node-trello')

module.exports = function (RED) {
  function TrelloMoveCardToListNode (config) {
    RED.nodes.createNode(this, config)
    var node = this

    // Retrieve the config node
    var credentialNode = RED.nodes.getNode(config.trello)
    var trello = new Trello(credentialNode.apikey, credentialNode.secret)
    this.on('input', function (msg) {
      var trelloData = msg.trello || {}
      var idList = trelloData.idList || config.idList
      var idCard = trelloData.idCard || config.idCard
      trello.put(
        '/1/cards/' + idCard + '/idList',
        {
          value: idList
        },
        (err, data) => {
          if (err) { node.error(err) }
          node.send({ payload: data })
        }
      )
    })
  }
  RED.nodes.registerType('trello-move-card-to-list', TrelloMoveCardToListNode)
}
