'use strict'

const cds = require('@sap/cds')
const {
  getMyUnreadNotificationCount,
  markAllMyNotificationsRead,
  markMyNotificationRead,
  searchMyNotifications
} = require('./notification/inbox')

class NotificationService extends cds.ApplicationService {
  init () {
    this.on('searchMyNotifications', searchMyNotifications)
    this.on('getMyUnreadNotificationCount', getMyUnreadNotificationCount)
    this.on('markMyNotificationRead', markMyNotificationRead)
    this.on('markAllMyNotificationsRead', markAllMyNotificationsRead)
    return super.init()
  }
}

module.exports = NotificationService
