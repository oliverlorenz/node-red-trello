var Trello = require('node-trello')

module.exports = function (RED) {
  function TrelloAddComment (config) {
    RED.nodes.createNode(this, config)
    var node = this

    // Retrieve the config node
    var credentialNode = RED.nodes.getNode(config.trello)
    var trello = new Trello(credentialNode.apikey, credentialNode.secret)
    this.on('input', function (msg) {
      var trelloData = msg.trello || {}
      var comment = trelloData.comment || config.comment
      var idCard = trelloData.idCard || config.idCard
      trello.post(
        '/1/cards/' + idCard + '/actions/comments',
        {
          text: comment
        },
        (err, data) => {
          if (err) { node.error(err) }
          node.send({ payload: data })
        }
      )
    })
  }
  RED.nodes.registerType('trello-add-comment', TrelloAddComment)
}
