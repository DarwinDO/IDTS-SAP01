using BugService as service from '../../../srv/service';

// Gợi ý học/debug: annotation này làm history/notification dễ đọc; dữ liệu audit gốc vẫn được tạo bởi backend workflow.
annotate service.Comments with @UI.LineItem : [
  // Navigation comments được Fiori render thành table; row nguồn do addComment backend tạo.
  { $Type : 'UI.DataField', Label : 'Comment', Value : content },
  { $Type : 'UI.DataField', Label : 'Author', Value : authorDisplayName },
  { $Type : 'UI.DataField', Label : 'Role', Value : authorRoleName },
  { $Type : 'UI.DataField', Label : 'Created At', Value : createdAt }
];

annotate service.Comments with @(
  UI.CreateHidden : true,
  UI.DeleteHidden : true,
  Capabilities.InsertRestrictions : { Insertable : false },
  Capabilities.DeleteRestrictions : { Deletable : false },
  Capabilities.UpdateRestrictions : { Updatable : false }
);

annotate service.Comments with {
  ID         @UI.Hidden;
  bug        @UI.Hidden;
  author     @Common.Text : author.displayName @Common.TextArrangement : #TextOnly @Common.FieldControl : #ReadOnly;
  authorRole @Common.Text : authorRole.name @Common.TextArrangement : #TextOnly @Common.FieldControl : #ReadOnly;
  content    @UI.MultiLineText @Common.FieldControl : #ReadOnly;
  createdAt  @Common.FieldControl : #ReadOnly;
};


annotate service.HistoryEvents with @(
  // HistoryEvents là nhóm audit cấp cao; logs chứa field-level detail và luôn read-only trên UI.
  UI.CreateHidden : true,
  UI.DeleteHidden : true,
  Capabilities.InsertRestrictions : { Insertable : false },
  Capabilities.DeleteRestrictions : { Deletable : false },
  Capabilities.UpdateRestrictions : { Updatable : false },
  UI.LineItem : [
    { $Type : 'UI.DataField', Label : 'Time', Value : createdAt },
    { $Type : 'UI.DataField', Label : 'Actor', Value : actorDisplayName },
    { $Type : 'UI.DataField', Label : 'Role', Value : actorRoleName },
    { $Type : 'UI.DataField', Label : 'Action', Value : actionTypeName },
    { $Type : 'UI.DataField', Label : 'Summary', Value : summary },
    { $Type : 'UI.DataField', Label : 'Reason', Value : reason }
  ]
);

annotate service.HistoryEvents with {
  ID         @UI.Hidden;
  bug        @UI.Hidden;
  actor      @Common.Text : actor.displayName @Common.TextArrangement : #TextOnly @Common.FieldControl : #ReadOnly;
  actorRole  @Common.Text : actorRole.name @Common.TextArrangement : #TextOnly @Common.FieldControl : #ReadOnly;
  actionType @Common.Text : actionType.name @Common.TextArrangement : #TextOnly @Common.FieldControl : #ReadOnly;
  summary    @Common.FieldControl : #ReadOnly;
  groupedChangeContext @Common.Label : 'Change Context' @UI.MultiLineText @Common.FieldControl : #ReadOnly;
  changeCount @Common.Label : 'Change Count' @Common.FieldControl : #ReadOnly @UI.Hidden;
  reason     @UI.MultiLineText @Common.FieldControl : #ReadOnly;
  createdAt  @Common.FieldControl : #ReadOnly;

};

annotate service.HistoryLogs with @(
  UI.CreateHidden : true,
  UI.DeleteHidden : true,
  Capabilities.InsertRestrictions : { Insertable : false },
  Capabilities.DeleteRestrictions : { Deletable : false },
  Capabilities.UpdateRestrictions : { Updatable : false },
  UI.LineItem : [
    { $Type : 'UI.DataField', Label : 'Time', Value : createdAt },
    { $Type : 'UI.DataField', Label : 'Actor', Value : actorDisplayName },
    { $Type : 'UI.DataField', Label : 'Role', Value : actorRoleName },
    { $Type : 'UI.DataField', Label : 'Action', Value : actionTypeName },
    { $Type : 'UI.DataField', Label : 'Summary', Value : historyEventSummary },
    { $Type : 'UI.DataField', Label : 'Field', Value : fieldLabel },
    { $Type : 'UI.DataField', Label : 'Old Value', Value : oldValueDisplay },
    { $Type : 'UI.DataField', Label : 'New Value', Value : newValueDisplay },
    { $Type : 'UI.DataField', Label : 'Reason', Value : reason }
  ]
);

annotate service.HistoryLogs with {
  ID     @UI.Hidden;
  bug    @UI.Hidden;
  event  @UI.Hidden;
  actor  @Common.Text : actor.displayName @Common.TextArrangement : #TextOnly @Common.FieldControl : #ReadOnly;
  actorRole @Common.Text : actorRole.name @Common.TextArrangement : #TextOnly @Common.FieldControl : #ReadOnly;
  actionType @Common.Text : actionType.name @Common.TextArrangement : #TextOnly @Common.FieldControl : #ReadOnly;
  fieldName @Common.FieldControl : #ReadOnly;
  fieldLabel @Common.FieldControl : #ReadOnly;
  oldValue @Common.FieldControl : #ReadOnly;
  oldValueDisplay @Common.FieldControl : #ReadOnly;
  newValue @Common.FieldControl : #ReadOnly;
  newValueDisplay @Common.FieldControl : #ReadOnly;
  reason @UI.MultiLineText @Common.FieldControl : #ReadOnly;
  createdAt @Common.FieldControl : #ReadOnly;
};


annotate service.Notifications with @(
  // Notification table chỉ đọc in-app record; email trạng thái chi tiết nằm ở NotificationDeliveries.
  UI.CreateHidden : true,
  UI.DeleteHidden : true,
  Capabilities.InsertRestrictions : { Insertable : false },
  Capabilities.DeleteRestrictions : { Deletable : false },
  Capabilities.UpdateRestrictions : { Updatable : false }
);

annotate service.Notifications with @UI.LineItem : [
  { $Type : 'UI.DataField', Label : 'Created At', Value : createdAt },
  { $Type : 'UI.DataField', Label : 'Recipient', Value : recipientDisplayName },
  { $Type : 'UI.DataField', Label : 'Event', Value : eventTypeName },
  { $Type : 'UI.DataField', Label : 'Channel', Value : channelName },
  { $Type : 'UI.DataField', Label : 'Delivery Status', Value : deliveryStatusName, Criticality : deliveryStatusCriticality },
  { $Type : 'UI.DataField', Label : 'Message', Value : message },
  { $Type : 'UI.DataField', Label : 'Sent At', Value : sentAt }
];

annotate service.Notifications with {
  ID      @UI.Hidden;
  bug     @UI.Hidden;
  recipient @Common.Text : recipient.displayName @Common.TextArrangement : #TextOnly @Common.FieldControl : #ReadOnly;
  eventType @Common.Text : eventType.name @Common.TextArrangement : #TextOnly @Common.FieldControl : #ReadOnly;
  channel @Common.Text : channel.name @Common.TextArrangement : #TextOnly @Common.FieldControl : #ReadOnly;
  deliveryStatus @Common.Text : deliveryStatus.name @Common.TextArrangement : #TextOnly @Common.FieldControl : #ReadOnly;
  message @UI.MultiLineText @Common.FieldControl : #ReadOnly;
  sentAt @Common.FieldControl : #ReadOnly;
  createdAt @Common.FieldControl : #ReadOnly;
};


annotate service.DuplicateLinks with @UI.LineItem : [
  // Hiển thị quan hệ duplicate đã lưu; AI similar-bug dialog không tự tạo các row này.
  { $Type : 'UI.DataField', Label : 'Target Bug', Value : targetBug.bugNumber },
  { $Type : 'UI.DataField', Label : 'Target Title', Value : targetBug.title },
  { $Type : 'UI.DataField', Label : 'Relation Type', Value : relationType.name },
  { $Type : 'UI.DataField', Label : 'Created At', Value : createdAt }
];

annotate service.DuplicateLinks with {
  ID        @UI.Hidden;
  sourceBug @UI.Hidden;
};
