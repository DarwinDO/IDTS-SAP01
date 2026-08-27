'use strict'

const cds = require('@sap/cds')
const {
  getMyUnreadNotificationCount,
  searchMyNotifications
} = require('./notification/inbox')

class NotificationService extends cds.ApplicationService {
  init () {
    this.on('searchMyNotifications', searchMyNotifications)
    this.on('getMyUnreadNotificationCount', getMyUnreadNotificationCount)
    return super.init()
  }
}

module.exports = NotificationService
