'use strict'

// Gắn contract OData với handler inbox; policy caller và read-state nằm trong module inbox.

const cds = require('@sap/cds')
const {
  getMyUnreadNotificationCount,
  markAllMyNotificationsRead,
  markMyNotificationRead,
  searchMyNotifications
} = require('./notification/inbox')
const { processNotificationSchedules } = require('./notification/scheduled')

class NotificationService extends cds.ApplicationService {
  init () {
    this.on('searchMyNotifications', searchMyNotifications)
    this.on('getMyUnreadNotificationCount', getMyUnreadNotificationCount)
    this.on('processNotificationSchedules', processNotificationSchedules)
    this.on('markMyNotificationRead', markMyNotificationRead)
    this.on('markAllMyNotificationsRead', markAllMyNotificationsRead)
    return super.init()
  }
}

module.exports = NotificationService
