using idts.cap as db from '../db/schema';

service BugService @(requires: 'authenticated-user') {
  entity Bugs as projection on db.Bugs {
    *,
    virtual reporterDisplayName : String(120),
    componentCategory : redirected to ComponentCategories,
    virtual assigneeDisplayName : String(120),
    virtual nextProcessorUserDisplayName : String(120),
    virtual nextProcessorRoleName : String(120),
    virtual canMarkInReview       : Boolean,
    virtual canStartProgress      : Boolean,
    virtual canResolve            : Boolean,
    virtual canRequestMoreInfo    : Boolean,
    virtual canReject             : Boolean,
    virtual canSendToRetest       : Boolean,
    virtual canClose              : Boolean,
    virtual canReopen             : Boolean,
    virtual canAssign             : Boolean,
    virtual canMoveToPending      : Boolean,
    virtual canResubmit           : Boolean,
    virtual canAddComment         : Boolean,
    virtual assigneeFieldControl  : Integer
  } actions {
    action addComment(content: LargeString) returns Bugs;
    action assignToDeveloper(
      @Common.ValueList : {
        Label : 'Assignable Developer',
        CollectionPath : 'AssignableDevelopers',
        SearchSupported : true,
        Parameters : [
          {
            $Type : 'Common.ValueListParameterInOut',
            LocalDataProperty : assigneeID,
            ValueListProperty : 'developerProfileID'
          },
          {
            $Type : 'Common.ValueListParameterDisplayOnly',
            ValueListProperty : 'developerName'
          },
          {
            $Type : 'Common.ValueListParameterDisplayOnly',
            ValueListProperty : 'developerEmail'
          },
          {
            $Type : 'Common.ValueListParameterDisplayOnly',
            ValueListProperty : 'availabilityStatusName'
          },
          {
            $Type : 'Common.ValueListParameterDisplayOnly',
            ValueListProperty : 'applicationComponentName'
          },
          {
            $Type : 'Common.ValueListParameterDisplayOnly',
            ValueListProperty : 'defectCategoryName'
          }
        ]
      }
      @Common.Label : 'Assignee'
      assigneeID: UUID,
      note: String
    ) returns Bugs;
    action moveToPendingAssignment(reason: String) returns Bugs;
    action markInReview(note: String) returns Bugs;
    action requestMoreInformation(reason: String) returns Bugs;
    action resubmitToDeveloper(note: String) returns Bugs;
    action rejectBug(reason: String) returns Bugs;
    action startProgress(note: String) returns Bugs;
    action resolveBug(note: String) returns Bugs;
    action sendToRetest(note: String) returns Bugs;
    action closeBug(note: String) returns Bugs;
    action reopenBug(reason: String) returns Bugs;
  };
  entity Comments as projection on db.Comments {
    *,
    author.displayName as authorDisplayName,
    authorRole.name as authorRoleName
  };
  entity Attachments as projection on db.Attachments {
    *,
    uploadedBy.displayName as uploadedByDisplayName
  };
  entity HistoryEvents as projection on db.HistoryEvents {
    *,
    actor.displayName as actorDisplayName,
    actorRole.name as actorRoleName,
    actionType.name as actionTypeName
  };
  entity HistoryLogs as projection on db.HistoryLogs {
    *,
    actor.displayName as actorDisplayName,
    actorRole.name as actorRoleName,
    actionType.name as actionTypeName,
    event.summary as historyEventSummary
  };
  entity Notifications as projection on db.Notifications {
    *,
    recipient.displayName as recipientDisplayName,
    eventType.name as eventTypeName,
    channel.name as channelName,
    deliveryStatus.name as deliveryStatusName,
    deliveryStatus.criticality as deliveryStatusCriticality
  };
  entity DuplicateLinks as projection on db.DuplicateLinks;

  entity Users as projection on db.Users;
  entity DeveloperProfiles as projection on db.DeveloperProfiles;
  entity SAPModules as projection on db.SAPModules;
  entity ApplicationComponents as projection on db.ApplicationComponents;
  entity SAPModuleComponents as projection on db.SAPModuleComponents;
  entity DefectCategories as projection on db.DefectCategories;
  entity ComponentCategories as projection on db.ComponentCategories;
  entity DeveloperResponsibilities as projection on db.DeveloperResponsibilities {
    *,
    componentCategory : redirected to ComponentCategories
  };
  entity AssignableDevelopers {
    key ID                    : UUID;
    developerProfileID        : UUID;
    componentCategoryID       : UUID;
    sapModuleID               : UUID;
    developerName             : String(120);
    developerEmail            : String(255);
    availabilityStatusName    : String(120);
    availabilityCriticality   : Integer;
    applicationComponentName  : String(120);
    defectCategoryName        : String(120);
    sapModuleName             : String(120);
    responsibilityLevelName   : String(120);
    active                    : Boolean;
  };
  entity ValidDefectCategories as select from db.ComponentCategories {
    key ID as componentCategoryID,
    component.ID as applicationComponentID,
    component.code as applicationComponentCode,
    component.name as applicationComponentName,
    defectCategory.ID as defectCategoryID,
    defectCategory.code as defectCategoryCode,
    defectCategory.name as defectCategoryName,
    defectCategory.categoryType as defectCategoryType,
    active
  } where active = true and component.active = true and defectCategory.active = true;

  entity UserRoles as projection on db.UserRoles;
  entity StatusValues as projection on db.StatusValues;
  entity PriorityValues as projection on db.PriorityValues;
  entity SeverityValues as projection on db.SeverityValues;
  entity EnvironmentValues as projection on db.EnvironmentValues;
  entity ProcessorRoleValues as projection on db.ProcessorRoleValues;
  entity AvailabilityStatuses as projection on db.AvailabilityStatuses;
  entity ResponsibilityLevels as projection on db.ResponsibilityLevels;
  entity ActionTypes as projection on db.ActionTypes;
  entity NotificationEventTypes as projection on db.NotificationEventTypes;
  entity NotificationChannels as projection on db.NotificationChannels;
  entity NotificationDeliveryStatuses as projection on db.NotificationDeliveryStatuses;
  entity DuplicateRelationTypes as projection on db.DuplicateRelationTypes;
}

annotate BugService.Bugs with @odata.draft.enabled;
