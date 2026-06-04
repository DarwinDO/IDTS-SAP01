namespace idts.cap;

using { cuid, managed } from '@sap/cds/common';

aspect CodeList {
  key code     : String(40);
      name     : String(120) not null;
      descr    : String(255);
      sortOrder: Integer;
      active   : Boolean default true;
      criticality : Integer;
}

entity UserRoles : CodeList {}
entity StatusValues : CodeList {}
entity PriorityValues : CodeList {}
entity SeverityValues : CodeList {}
entity EnvironmentValues : CodeList {}
entity ProcessorRoleValues : CodeList {}
entity AvailabilityStatuses : CodeList {}
entity ResponsibilityLevels : CodeList {}
entity ActionTypes : CodeList {}
entity NotificationEventTypes : CodeList {}
entity NotificationChannels : CodeList {}
entity NotificationDeliveryStatuses : CodeList {}
entity DuplicateRelationTypes : CodeList {}

entity Users : cuid, managed {
  displayName : String(120) not null;
  email       : String(255) not null;
  role        : Association to UserRoles not null;
  active      : Boolean default true;
}

entity DeveloperProfiles : cuid, managed {
  user               : Association to Users not null;
  availabilityStatus : Association to AvailabilityStatuses;
  workloadLimit      : Integer;
  active             : Boolean default true;
}

entity SAPModules : cuid, managed {
  code   : String(20) not null;
  name   : String(120) not null;
  active : Boolean default true;
}

entity ApplicationComponents : cuid, managed {
  code          : String(40) not null;
  name          : String(120) not null;
  componentType : String(60);
  active        : Boolean default true;
}

entity SAPModuleComponents : cuid, managed {
  sapModule : Association to SAPModules not null;
  component : Association to ApplicationComponents not null;
  active    : Boolean default true;
}

entity DefectCategories : cuid, managed {
  code         : String(40) not null;
  name         : String(120) not null;
  categoryType : String(60);
  active       : Boolean default true;
}

entity ComponentCategories : cuid, managed {
  component      : Association to ApplicationComponents not null;
  defectCategory : Association to DefectCategories not null;
  active         : Boolean default true;
}

entity DeveloperResponsibilities : cuid, managed {
  developerProfile   : Association to DeveloperProfiles not null;
  componentCategory  : Association to ComponentCategories not null;
  sapModule          : Association to SAPModules;
  responsibilityLevel: Association to ResponsibilityLevels;
  active             : Boolean default true;
}

entity Bugs : cuid, managed {
  bugNumber              : String(30)         @Common.Label : 'Bug Number';
  title                  : String(255) not null @Common.Label : 'Title';
  description            : LargeString not null @Common.Label : 'Description';
  status                 : Association to StatusValues not null;
  priority               : Association to PriorityValues not null;
  severity               : Association to SeverityValues not null;
  environment            : Association to EnvironmentValues;
  environmentDetail      : String(255)        @Common.Label : 'Environment Detail';
  stepsToReproduce       : LargeString not null @Common.Label : 'Steps to Reproduce';
  actualResult           : LargeString not null @Common.Label : 'Actual Result';
  expectedResult         : LargeString not null @Common.Label : 'Expected Result';
  sapModule              : Association to SAPModules;
  applicationComponent   : Association to ApplicationComponents not null;
  defectCategory         : Association to DefectCategories not null;
  componentCategory      : Association to ComponentCategories not null;
  reporter               : Association to Users not null;
  assignee               : Association to DeveloperProfiles;
  nextProcessorUser      : Association to Users;
  nextProcessorRole      : Association to ProcessorRoleValues;
  rejectionReason        : LargeString        @Common.Label : 'Rejection Reason';
  testCaseRef            : String(80)         @Common.Label : 'Test Case Reference';
  testRunRef             : String(80)         @Common.Label : 'Test Run Reference';
  plannedCompletionDate  : Date               @Common.Label : 'Planned Completion Date';
  dueDate                : Date               @Common.Label : 'Due Date';
  estimatedEffortHours   : Decimal(9,2)       @Common.Label : 'Estimated Effort Hours';

  comments               : Composition of many Comments on comments.bug = $self;
  attachments            : Composition of many Attachments on attachments.bug = $self;
  historyLogs            : Composition of many HistoryLogs on historyLogs.bug = $self;
  notifications          : Composition of many Notifications on notifications.bug = $self;
  duplicateLinks         : Composition of many DuplicateLinks on duplicateLinks.sourceBug = $self;
}

entity Comments : cuid, managed {
  bug        : Association to Bugs not null;
  author     : Association to Users not null;
  authorRole : Association to UserRoles;
  content    : LargeString not null;
}

entity Attachments : cuid, managed {
  bug        : Association to Bugs not null;
  uploadedBy : Association to Users not null;
  fileName   : String(255) not null;
  mediaType  : String(100);
  fileSize   : Integer64;
  storageRef : String(500) not null;
}

entity HistoryLogs : cuid, managed {
  bug        : Association to Bugs not null;
  actor      : Association to Users not null;
  actorRole  : Association to UserRoles;
  actionType : Association to ActionTypes not null;
  fieldName  : String(80);
  oldValue   : String(1000);
  newValue   : String(1000);
  reason     : LargeString;
}

entity Notifications : cuid, managed {
  bug            : Association to Bugs not null;
  recipient      : Association to Users not null;
  eventType      : Association to NotificationEventTypes not null;
  channel        : Association to NotificationChannels;
  deliveryStatus : Association to NotificationDeliveryStatuses not null;
  message        : String(500);
  sentAt         : Timestamp;
}

entity DuplicateLinks : cuid, managed {
  sourceBug    : Association to Bugs not null;
  targetBug    : Association to Bugs not null;
  relationType : Association to DuplicateRelationTypes not null;
}
