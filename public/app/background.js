const ACTION = require('./extensionActions')
const TxController = require('./scripts/controllers/TxController')
const IostController = require('./scripts/controllers/IostController')
const NetworkController = require('./scripts/controllers/NetworkController')

const txController = new TxController()
const networkController = new NetworkController()
const iostController = IostController

const state = {
  unlock: false,
  password: '',

  setPassword(password){
    this.password = password;
    this.unlock = true
  },

  getPassword(){
    return this.password
  },
  
  getLockState(){
    return this.unlock
  },

  lock(){
    this.password = ''
    this.unlock = false
  }



}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case ACTION.TX_ASK:
      if (iostController.account.getID() === 'empty')
        throw Error('Index should be logged in to send a tx')
      const totalTxLength = txController.addTx({
        tx: message.payload,
        actionId: message.actionId,
      })
      const slotIdx = totalTxLength - 1
      // const [contractAddress, abi, args] = message.payload
      chrome.windows.create({
        url: 'askTx.html'
          + `?slotIdx=${slotIdx}`
          + `&accountId=${iostController.account.getID()}`
          + `&tx=${encodeURIComponent(JSON.stringify(message.payload))}`,
        type: 'popup',
        width: 500,
        height: 620,
      })
      break
    case ACTION.TX_CONFIRM:
      txController.processTx(message.payload.slotIdx)
      break
    case ACTION.TX_CANCEL:
      txController.cancelTx(message.payload.slotIdx)
      break
    case ACTION.CHANGE_NETWORK:
      iostController.changeNetwork(message.payload.url)
      break
    case ACTION.LOGIN_SUCCESS:
      iostController.loginAccount(
        message.payload.id,
        message.payload.encodedPrivateKey,
      )
      break
    case ACTION.LOGOUT_SUCCESS:
      iostController.logoutAccount()
      break
    case ACTION.SAVE_NEW_NETWORK:
      networkController.saveNewNetwork(message.payload.newNetworkURL)
      break
    case 'GET_UNLOCK_STATE': 
      sendResponse(state.getLockState())
      break
    case 'SET_LOCK': 
      state.lock()
      break
    case 'SET_PASSWORD': 
      state.setPassword(message.payload.password)
      break
    case 'GET_PASSWORD': 
      sendResponse(state.getPassword())
      break
    case 'GET_ACCOUNT': 
      sendResponse(iostController.account.getID())
      break
    default:
  }
})
