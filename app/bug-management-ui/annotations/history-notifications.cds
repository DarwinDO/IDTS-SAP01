using BugService as service from '../../../srv/service';

annotate service.Comments with @UI.LineItem : [
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


annotate service.Attachments with @UI.LineItem : [
  { $Type : 'UI.DataField', Label : 'Attachment', Value : content },
  { $Type : 'UI.DataField', Label : 'Media Type', Value : mediaType },
  { $Type : 'UI.DataField', Label : 'Size', Value : fileSize },
  { $Type : 'UI.DataField', Label : 'Uploaded By', Value : uploadedByDisplayName },
  { $Type : 'UI.DataField', Label : 'Uploaded At', Value : createdAt }
];

annotate service.Attachments with @(
  UI.CreateHidden : false,
  UI.DeleteHidden : true,
  Capabilities.InsertRestrictions : { Insertable : true },
  Capabilities.DeleteRestrictions : { Deletable : false },
  Capabilities.UpdateRestrictions : { Updatable : false },
  UI.MediaResource : { Stream : content }
);

annotate service.Attachments with {
  ID         @UI.Hidden;
  bug        @UI.Hidden;
  storageRef @UI.Hidden;
  uploadedBy @Common.Text : uploadedBy.displayName @Common.TextArrangement : #TextOnly @Common.FieldControl : #ReadOnly;
  content    @Common.FieldControl : #ReadOnly;
  fileName   @Common.FieldControl : #ReadOnly;
  mediaType  @Common.FieldControl : #ReadOnly;
  fileSize   @Common.FieldControl : #ReadOnly;
  createdAt  @Common.FieldControl : #ReadOnly;
};


annotate service.HistoryEvents with @(
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
  { $Type : 'UI.DataField', Label : 'Target Bug', Value : targetBug.bugNumber },
  { $Type : 'UI.DataField', Label : 'Target Title', Value : targetBug.title },
  { $Type : 'UI.DataField', Label : 'Relation Type', Value : relationType.name },
  { $Type : 'UI.DataField', Label : 'Created At', Value : createdAt }
];

annotate service.DuplicateLinks with {
  ID        @UI.Hidden;
  sourceBug @UI.Hidden;
};
