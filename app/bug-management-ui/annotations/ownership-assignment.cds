using BugService as service from '../../../srv/service';

annotate service.Bugs with @(
  UI.FieldGroup #Assignment : {
    Data : [
      {
        $Type : 'UI.DataField',
        Label : 'Assignee',
        Value : assignee_ID,
        ![@UI.Hidden] : {
          $edmJson : {
            $Eq : [ { $Path : 'IsActiveEntity' }, true ]
          }
        }
      },
      {
        $Type : 'UI.DataField',
        Label : 'Assignee',
        Value : assigneeDisplayName,
        ![@Common.FieldControl] : #ReadOnly,
        ![@UI.Hidden] : {
          $edmJson : {
            $Eq : [ { $Path : 'IsActiveEntity' }, false ]
          }
        }
      },
      {
        $Type : 'UI.DataField',
        Label : 'Next Processor User',
        Value : nextProcessorUserDisplayName,
        ![@Common.FieldControl] : #ReadOnly,
        ![@UI.Hidden] : {$edmJson: {$And: [{$Eq: [{$Path: 'IsActiveEntity'}, false]}, {$Eq: [{$Path: 'HasActiveEntity'}, false]}]}}
      },
      {
        $Type : 'UI.DataField',
        Label : 'Next Processor Role',
        Value : nextProcessorRoleName,
        ![@Common.FieldControl] : #ReadOnly,
        ![@UI.Hidden] : {$edmJson: {$And: [{$Eq: [{$Path: 'IsActiveEntity'}, false]}, {$Eq: [{$Path: 'HasActiveEntity'}, false]}]}}
      }
    ]
  },
  UI.FieldGroup #RejectedFollowUp : {
    Data : [
      { $Type : 'UI.DataField', Label : 'Latest Rejection Reason', Value : rejectionReason, ![@Common.FieldControl] : #ReadOnly },
      { $Type : 'UI.DataField', Label : 'Next Processor User', Value : nextProcessorUserDisplayName, ![@Common.FieldControl] : #ReadOnly },
      { $Type : 'UI.DataField', Label : 'Next Processor Role', Value : nextProcessorRoleName, ![@Common.FieldControl] : #ReadOnly }
    ]
  }
);

annotate service.DeveloperResponsibilities with @(
  UI.SelectionFields : [ componentCategory_ID, sapModule_ID, responsibilityLevel_code, active ],
  UI.LineItem : [
    { $Type : 'UI.DataField', Label : 'Developer', Value : developerProfile.user.displayName },
    { $Type : 'UI.DataField', Label : 'Availability', Value : developerProfile.availabilityStatus.name, Criticality : developerProfile.availabilityStatus.criticality },
    { $Type : 'UI.DataField', Label : 'Application Component', Value : componentCategory.component.name },
    { $Type : 'UI.DataField', Label : 'Defect Category', Value : componentCategory.defectCategory.name },
    { $Type : 'UI.DataField', Label : 'SAP Module Scope', Value : sapModule.name },
    { $Type : 'UI.DataField', Label : 'Responsibility Level', Value : responsibilityLevel.name },
    { $Type : 'UI.DataField', Label : 'Active', Value : active }
  ]
);

annotate service.Users with @(
  UI.SelectionFields : [ displayName, email, role_code, active ],
  UI.LineItem : [
    { $Type : 'UI.DataField', Label : 'Name', Value : displayName },
    { $Type : 'UI.DataField', Label : 'Email', Value : email },
    { $Type : 'UI.DataField', Label : 'Role', Value : role.name },
    { $Type : 'UI.DataField', Label : 'Active', Value : active }
  ]
);

annotate service.DeveloperProfiles with @(
  UI.SelectionFields : [ user_ID, availabilityStatus_code, active ],
  UI.LineItem : [
    { $Type : 'UI.DataField', Label : 'Developer', Value : user.displayName },
    { $Type : 'UI.DataField', Label : 'Email', Value : user.email },
    { $Type : 'UI.DataField', Label : 'Availability', Value : availabilityStatus.name, Criticality : availabilityStatus.criticality },
    { $Type : 'UI.DataField', Label : 'Workload Limit', Value : workloadLimit },
    { $Type : 'UI.DataField', Label : 'Active', Value : active }
  ]
);


annotate service.AssignableDevelopers with @(
  UI.SelectionFields : [ developerName, developerEmail, active ],
  UI.LineItem : [
    { $Type : 'UI.DataField', Label : 'Developer', Value : developerName },
    { $Type : 'UI.DataField', Label : 'Email', Value : developerEmail },
    { $Type : 'UI.DataField', Label : 'Availability', Value : availabilityStatusName, Criticality : availabilityCriticality },
    { $Type : 'UI.DataField', Label : 'Active', Value : active }
  ]
);

annotate service.AssignableDevelopers with {
  developerProfileID       @UI.Hidden @Common.Label : 'Developer ID' @Common.Text : developerName @Common.TextArrangement : #TextOnly;
  componentCategoryID      @UI.Hidden @Common.Label : 'Component Category ID';
  sapModuleID              @UI.Hidden @Common.Label : 'SAP Module ID';
  developerName            @Common.Label : 'Developer';
  developerEmail           @Common.Label : 'Email';
  availabilityStatusName   @Common.Label : 'Availability';
  applicationComponentName @Common.Label : 'Application Component';
  defectCategoryName       @Common.Label : 'Defect Category';
  sapModuleName            @Common.Label : 'SAP Module Scope';
  responsibilityLevelName  @Common.Label : 'Responsibility Level';
};
