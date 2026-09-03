using idts.cap as db from '../db/schema';

// Chỉ công khai DTO và operation cho caller; không expose entity index/audit/delivery.

@path: 'notification'
service NotificationService @(requires: 'authenticated-user') {
  type NotificationSummary {
    notificationID : UUID;
    category       : String(10);
    eventType      : String(40);
    title          : String(160);
    summary        : String(500);
    bugNumber      : String(30);
    bugTitle       : String(255);
    priority       : String(20);
    actionRequired : Boolean;
    occurredAt     : Timestamp;
    readAt         : Timestamp;
    targetPath     : String(500);
    modifiedAt     : Timestamp;
  }

  type UnreadNotificationCount {
    count : Integer;
  }

  type NotificationMaintenanceResult {
    candidates        : Integer;
    pendingAssignment : Integer;
    sla               : Integer;
    overdue           : Integer;
    created           : Integer;
    skipped           : Integer;
  }

  function searchMyNotifications(
    category  : String(10),
    readState : String(10),
    skip      : Integer,
    top       : Integer
  ) returns many NotificationSummary;

  function getMyUnreadNotificationCount() returns UnreadNotificationCount;

  @(requires: 'OutboxProcessor')
  action processNotificationSchedules(now:Timestamp, discoveryFrom:Timestamp) returns NotificationMaintenanceResult;

  action markMyNotificationRead(
    notificationID    : UUID,
    expectedModifiedAt: Timestamp
  ) returns NotificationSummary;

  action markAllMyNotificationsRead(
    throughOccurredAt : Timestamp
  ) returns UnreadNotificationCount;
}
