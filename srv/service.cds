using idts.cap as db from '../db/schema';

service BugService @(requires: 'authenticated-user') {
  entity Bugs as projection on db.Bugs {
    *,
    assignee.user.displayName as assigneeDisplayName,
    virtual canMarkInReview       : Boolean,
    virtual canStartProgress      : Boolean,
    virtual canResolve            : Boolean,
    virtual canRequestMoreInfo    : Boolean,
    virtual canReject             : Boolean,
    virtual canSendToRetest       : Boolean,
    virtual canClose              : Boolean,
    virtual canReopen             : Boolean,
    virtual canAssign             : Boolean,
    virtual canMoveToPending      : Boolean
  } actions {
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
      assigneeID: UUID,
      note: String
    ) returns Bugs;
    action moveToPendingAssignment(reason: String) returns Bugs;
    action markInReview(note: String) returns Bugs;
    action requestMoreInformation(reason: String) returns Bugs;
    action rejectBug(reason: String) returns Bugs;
    action startProgress(note: String) returns Bugs;
    action resolveBug(note: String) returns Bugs;
    action sendToRetest(note: String) returns Bugs;
    action closeBug(note: String) returns Bugs;
    action reopenBug(reason: String) returns Bugs;
  };
  entity Comments as projection on db.Comments;
  entity Attachments as projection on db.Attachments;
  entity HistoryLogs as projection on db.HistoryLogs;
  entity Notifications as projection on db.Notifications;
  entity DuplicateLinks as projection on db.DuplicateLinks;

  entity Users as projection on db.Users;
  entity DeveloperProfiles as projection on db.DeveloperProfiles;
  entity SAPModules as projection on db.SAPModules;
  entity ApplicationComponents as projection on db.ApplicationComponents;
  entity SAPModuleComponents as projection on db.SAPModuleComponents;
  entity DefectCategories as projection on db.DefectCategories;
  entity ComponentCategories as projection on db.ComponentCategories;
  entity DeveloperResponsibilities as projection on db.DeveloperResponsibilities;
  entity AssignableDevelopers as select from db.DeveloperResponsibilities {
    key ID,
    developerProfile.ID as developerProfileID,
    developerProfile.user.displayName as developerName,
    developerProfile.user.email as developerEmail,
    developerProfile.availabilityStatus.name as availabilityStatusName,
    developerProfile.availabilityStatus.criticality as availabilityCriticality,
    componentCategory.ID as componentCategoryID,
    componentCategory.component.name as applicationComponentName,
    componentCategory.defectCategory.name as defectCategoryName,
    sapModule.ID as sapModuleID,
    sapModule.name as sapModuleName,
    responsibilityLevel.name as responsibilityLevelName,
    active
  };

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
