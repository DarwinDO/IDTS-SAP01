using BugService as service from '../../srv/service';

annotate service.Bugs with @(
  Capabilities.InsertRestrictions : {
    Insertable : true
  },
  Capabilities.DeleteRestrictions : {
    Deletable : false
  },
  UI.HeaderInfo : {
    TypeName       : 'Bug',
    TypeNamePlural : 'Bugs',
    Title          : {
      $Type : 'UI.DataField',
      Value : bugNumber
    },
    Description    : {
      $Type : 'UI.DataField',
      Value : title
    }
  },
  UI.Identification : [
    {
      $Type  : 'UI.DataFieldForAction',
      Label  : 'Assign Developer',
      Action : 'BugService.assignToDeveloper',
      ![@UI.Hidden] : { $edmJson : { $Not : { $Path : 'canAssign' } } }
    },
    {
      $Type  : 'UI.DataFieldForAction',
      Label  : 'Move to Pending Assignment',
      Action : 'BugService.moveToPendingAssignment',
      ![@UI.Hidden] : { $edmJson : { $Not : { $Path : 'canMoveToPending' } } }
    },
    {
      $Type  : 'UI.DataFieldForAction',
      Label  : 'Add Comment',
      Action : 'BugService.addComment',
      ![@UI.Hidden] : {
        $edmJson : {
          $Or : [
            { $Not : { $Path : 'canAddComment' } },
            { $Eq : [ { $Path : 'IsActiveEntity' }, false ] }
          ]
        }
      }
    },
    {
      $Type  : 'UI.DataFieldForAction',
      Label  : 'Mark In Review',
      Action : 'BugService.markInReview',
      ![@UI.Hidden] : { $edmJson : { $Not : { $Path : 'canMarkInReview' } } }
    },
    {
      $Type  : 'UI.DataFieldForAction',
      Label  : 'Request More Information',
      Action : 'BugService.requestMoreInformation',
      ![@UI.Hidden] : { $edmJson : { $Not : { $Path : 'canRequestMoreInfo' } } }
    },
    {
      $Type  : 'UI.DataFieldForAction',
      Label  : 'Reject Bug',
      Action : 'BugService.rejectBug',
      ![@UI.Hidden] : { $edmJson : { $Not : { $Path : 'canReject' } } }
    },
    {
      $Type  : 'UI.DataFieldForAction',
      Label  : 'Start Progress',
      Action : 'BugService.startProgress',
      ![@UI.Hidden] : { $edmJson : { $Not : { $Path : 'canStartProgress' } } }
    },
    {
      $Type  : 'UI.DataFieldForAction',
      Label  : 'Resolve Bug',
      Action : 'BugService.resolveBug',
      ![@UI.Hidden] : { $edmJson : { $Not : { $Path : 'canResolve' } } }
    },
    {
      $Type  : 'UI.DataFieldForAction',
      Label  : 'Send to Retest',
      Action : 'BugService.sendToRetest',
      ![@UI.Hidden] : { $edmJson : { $Not : { $Path : 'canSendToRetest' } } }
    },
    {
      $Type  : 'UI.DataFieldForAction',
      Label  : 'Close Bug',
      Action : 'BugService.closeBug',
      ![@UI.Hidden] : { $edmJson : { $Not : { $Path : 'canClose' } } }
    },
    {
      $Type  : 'UI.DataFieldForAction',
      Label  : 'Reopen Bug',
      Action : 'BugService.reopenBug',
      ![@UI.Hidden] : { $edmJson : { $Not : { $Path : 'canReopen' } } }
    }
  ],
  UI.SelectionFields : [
    status_code,
    priority_code,
    severity_code,
    sapModule_ID,
    applicationComponent_ID,
    defectCategory_ID,
    assignee_ID,
    nextProcessorRole_code,
    dueDate
  ],
  UI.LineItem : [
    { $Type : 'UI.DataField', Label : 'Bug Number', Value : bugNumber },
    { $Type : 'UI.DataField', Label : 'Title', Value : title },
    { $Type : 'UI.DataField', Label : 'Status', Value : status.name, Criticality : status.criticality, CriticalityRepresentation : #WithoutIcon },
    { $Type : 'UI.DataField', Label : 'Priority', Value : priority.name, Criticality : priority.criticality, CriticalityRepresentation : #WithoutIcon },
    { $Type : 'UI.DataField', Label : 'Severity', Value : severity.name, Criticality : severity.criticality, CriticalityRepresentation : #WithoutIcon },
    { $Type : 'UI.DataField', Label : 'SAP Module', Value : sapModule.name },
    { $Type : 'UI.DataField', Label : 'Application Component', Value : applicationComponent.name },
    { $Type : 'UI.DataField', Label : 'Defect Category', Value : defectCategory.name },
    { $Type : 'UI.DataField', Label : 'Assignee', Value : assignee.user.displayName },
    { $Type : 'UI.DataField', Label : 'Next Processor', Value : nextProcessorRole.name },
    { $Type : 'UI.DataField', Label : 'Due Date', Value : dueDate },
    { $Type : 'UI.DataField', Label : 'Updated At', Value : modifiedAt }
  ],
  UI.Facets : [
    {
      $Type  : 'UI.CollectionFacet',
      ID     : 'BugDetails',
      Label: 'Bug Summary',
      Facets : [
        {
          $Type  : 'UI.ReferenceFacet',
          ID     : 'GeneralInfo',
          Label  : 'General Information',
          Target : '@UI.FieldGroup#GeneralInfo'
        },
        {
          $Type  : 'UI.ReferenceFacet',
          ID     : 'SupportingInfo',
          Label  : 'Supporting Information',
          Target : '@UI.FieldGroup#SupportingInfo'
        }
      ]
    },
    {
      $Type  : 'UI.CollectionFacet',
      ID     : 'ClassificationAndAssignment',
      Label: 'Classification and Assignment',
      Facets : [
        {
          $Type  : 'UI.ReferenceFacet',
          ID     : 'Classification',
          Label  : 'Classification',
          Target : '@UI.FieldGroup#Classification'
        },
        {
          $Type  : 'UI.ReferenceFacet',
          ID     : 'Assignment',
          Label  : 'Assignment',
          Target : '@UI.FieldGroup#Assignment'
        },
        {
          $Type  : 'UI.ReferenceFacet',
          ID     : 'RejectedFollowUp',
          Label  : 'Rejected Follow-up',
          Target: '@UI.FieldGroup#RejectedFollowUp',
          ![@UI.Hidden] : {$edmJson: {$And: [{$Eq: [{$Path: 'IsActiveEntity'}, false]}, {$Eq: [{$Path: 'HasActiveEntity'}, false]}]}}
        },
        {
          $Type  : 'UI.ReferenceFacet',
          ID     : 'Planning',
          Label  : 'Planning',
          Target: '@UI.FieldGroup#Planning',
          ![@UI.Hidden] : {$edmJson: {$And: [{$Eq: [{$Path: 'IsActiveEntity'}, false]}, {$Eq: [{$Path: 'HasActiveEntity'}, false]}]}}
        }
      ]
    },
    {
      $Type  : 'UI.CollectionFacet',
      ID     : 'ReproductionFacet',
      Label: 'Reproduction and Test Context',
      Facets : [
        {
          $Type  : 'UI.ReferenceFacet',
          ID     : 'Reproduction',
          Label  : 'Reproduction and Test Context',
          Target: '@UI.FieldGroup#Reproduction'
        }
      ]
    },
    {
      $Type  : 'UI.ReferenceFacet',
      ID     : 'Comments',
      Label  : 'Comments',
      Target : 'comments/@UI.LineItem',
      ![@UI.Hidden] : {$edmJson: {$And: [{$Eq: [{$Path: 'IsActiveEntity'}, false]}, {$Eq: [{$Path: 'HasActiveEntity'}, false]}]}}
    },
    {
      $Type  : 'UI.ReferenceFacet',
      ID     : 'Attachments',
      Label  : 'Attachments',
      Target : 'attachments/@UI.LineItem',
      ![@UI.Hidden] : {$edmJson: {$And: [{$Eq: [{$Path: 'IsActiveEntity'}, false]}, {$Eq: [{$Path: 'HasActiveEntity'}, false]}]}}
    },
    {
      $Type  : 'UI.ReferenceFacet',
      ID     : 'History',
      Label  : 'History',
      Target : 'historyLogs/@UI.LineItem',
      ![@UI.Hidden] : {$edmJson: {$And: [{$Eq: [{$Path: 'IsActiveEntity'}, false]}, {$Eq: [{$Path: 'HasActiveEntity'}, false]}]}}
    },
    {
      $Type  : 'UI.ReferenceFacet',
      ID     : 'Notifications',
      Label  : 'Notifications',
      Target : 'notifications/@UI.LineItem',
      ![@UI.Hidden] : {$edmJson: {$And: [{$Eq: [{$Path: 'IsActiveEntity'}, false]}, {$Eq: [{$Path: 'HasActiveEntity'}, false]}]}}
    }
  ],
  UI.FieldGroup #GeneralInfo : {
    Data : [
      { $Type : 'UI.DataField', Label : 'Bug Number', Value : bugNumber, ![@UI.Hidden] : {$edmJson: {$And: [{$Eq: [{$Path: 'IsActiveEntity'}, false]}, {$Eq: [{$Path: 'HasActiveEntity'}, false]}]}} },
      { $Type : 'UI.DataField', Label : 'Title', Value : title },
      { $Type : 'UI.DataField', Label : 'Description', Value : description },
      { $Type : 'UI.DataField', Label : 'Status', Value : status.name, Criticality : status.criticality, CriticalityRepresentation : #WithoutIcon, ![@Common.FieldControl] : #ReadOnly, ![@UI.Hidden] : {$edmJson: {$And: [{$Eq: [{$Path: 'IsActiveEntity'}, false]}, {$Eq: [{$Path: 'HasActiveEntity'}, false]}]}} },
      { $Type : 'UI.DataField', Label : 'Priority', Value : priority_code, Criticality : priority.criticality, CriticalityRepresentation : #WithoutIcon },
      { $Type : 'UI.DataField', Label : 'Reporter', Value : reporter.displayName, ![@UI.Hidden] : {$edmJson: {$And: [{$Eq: [{$Path: 'IsActiveEntity'}, false]}, {$Eq: [{$Path: 'HasActiveEntity'}, false]}]}} },
      { $Type : 'UI.DataField', Label : 'Created At', Value : createdAt, ![@UI.Hidden] : {$edmJson: {$And: [{$Eq: [{$Path: 'IsActiveEntity'}, false]}, {$Eq: [{$Path: 'HasActiveEntity'}, false]}]}} },
      { $Type : 'UI.DataField', Label : 'Updated At', Value : modifiedAt, ![@UI.Hidden] : {$edmJson: {$And: [{$Eq: [{$Path: 'IsActiveEntity'}, false]}, {$Eq: [{$Path: 'HasActiveEntity'}, false]}]}} }
    ]
  },
  UI.FieldGroup #SupportingInfo : {
    Data : [
      { $Type : 'UI.DataField', Label : 'Severity', Value : severity_code, Criticality : severity.criticality, CriticalityRepresentation : #WithoutIcon },
      { $Type : 'UI.DataField', Label : 'Environment', Value : environment_code },
      { $Type : 'UI.DataField', Label : 'Environment Detail', Value : environmentDetail }
    ]
  },
  UI.FieldGroup #Classification : {
    Data : [
      { $Type : 'UI.DataField', Label : 'SAP Module', Value : sapModule_ID },
      { $Type : 'UI.DataField', Label : 'Application Component', Value : applicationComponent_ID },
      { $Type : 'UI.DataField', Label : 'Defect Category', Value : defectCategory_ID }
    ]
  },
  UI.FieldGroup #Reproduction : {
    Data : [
      { $Type : 'UI.DataField', Label : 'Steps to Reproduce', Value : stepsToReproduce },
      { $Type : 'UI.DataField', Label : 'Actual Result', Value : actualResult },
      { $Type : 'UI.DataField', Label : 'Expected Result', Value : expectedResult },
      { $Type : 'UI.DataField', Label : 'Test Case Reference', Value : testCaseRef },
      { $Type : 'UI.DataField', Label : 'Test Run Reference', Value : testRunRef }
    ]
  },
  UI.FieldGroup #Assignment : {
    Data : [
      { $Type : 'UI.DataField', Label : 'Assignee', Value : assignee_ID },
      { $Type : 'UI.DataField', Label : 'Next Processor User', Value : nextProcessorUser.displayName, ![@UI.Hidden] : {$edmJson: {$And: [{$Eq: [{$Path: 'IsActiveEntity'}, false]}, {$Eq: [{$Path: 'HasActiveEntity'}, false]}]}} },
      { $Type : 'UI.DataField', Label : 'Next Processor Role', Value : nextProcessorRole.name, ![@UI.Hidden] : {$edmJson: {$And: [{$Eq: [{$Path: 'IsActiveEntity'}, false]}, {$Eq: [{$Path: 'HasActiveEntity'}, false]}]}} }
    ]
  },
  UI.FieldGroup #RejectedFollowUp : {
    Data : [
      { $Type : 'UI.DataField', Label : 'Latest Rejection Reason', Value : rejectionReason },
      { $Type : 'UI.DataField', Label : 'Next Processor User', Value : nextProcessorUser.displayName },
      { $Type : 'UI.DataField', Label : 'Next Processor Role', Value : nextProcessorRole.name }
    ]
  },
  UI.FieldGroup #Planning : {
    Data : [
      { $Type : 'UI.DataField', Label : 'Planned Completion Date', Value : plannedCompletionDate },
      { $Type : 'UI.DataField', Label : 'Due Date', Value : dueDate },
      { $Type : 'UI.DataField', Label : 'Estimated Effort Hours', Value : estimatedEffortHours }
    ]
  },

);

annotate service.Bugs with {
  ID                    @UI.Hidden;
  bugNumber             @Core.Computed @Common.Label : 'Bug Number';
  title                 @Common.Label : 'Title' @Common.FieldControl : #Mandatory;
  description           @UI.MultiLineText @Common.Label : 'Description' @Common.FieldControl : #Mandatory;
  stepsToReproduce      @UI.MultiLineText @Common.Label : 'Steps to Reproduce' @Common.FieldControl : #Mandatory;
  actualResult          @UI.MultiLineText @Common.Label : 'Actual Result' @Common.FieldControl : #Mandatory;
  expectedResult        @UI.MultiLineText @Common.Label : 'Expected Result' @Common.FieldControl : #Mandatory;
  rejectionReason       @UI.MultiLineText @Common.Label : 'Rejection Reason';
  dueDate               @Common.Label : 'Due Date';
  status                @Common.Label : 'Status' @Common.FieldControl : #ReadOnly;
  priority              @Common.Label : 'Priority' @Common.FieldControl : #Mandatory;
  severity              @Common.Label : 'Severity' @Common.FieldControl : #Mandatory;
  environment           @Common.Label : 'Environment';
  sapModule             @Common.Label : 'SAP Module';
  applicationComponent  @Common.Label : 'Application Component' @Common.FieldControl : #Mandatory;
  defectCategory        @Common.Label : 'Defect Category' @Common.FieldControl : #Mandatory;
  componentCategory     @Common.Label : 'Component Category';
  reporter              @Common.Label : 'Reporter' @Common.FieldControl : #ReadOnly;
  assignee              @Common.Label : 'Assignee';
  nextProcessorUser     @Common.Label : 'Next Processor User' @Common.FieldControl : #ReadOnly;
  nextProcessorRole     @Common.Label : 'Next Processor Role' @Common.FieldControl : #ReadOnly;
  componentCategory     @UI.Hidden @Core.Computed;
};

annotate service.Bugs:componentCategory.ID with @UI.Hidden @Core.Computed;

annotate service.Bugs:status.code with @Common.FieldControl : #ReadOnly @Common.ValueListWithFixedValues : true @Common.ValueList : {
    Label : 'Status',
    CollectionPath : 'StatusValues',
    SearchSupported : true,
    Parameters : [
      {
        $Type : 'Common.ValueListParameterInOut',
        LocalDataProperty : status_code,
        ValueListProperty : 'code'
      },
      {
        $Type : 'Common.ValueListParameterDisplayOnly',
        ValueListProperty : 'name'
      },
      {
        $Type : 'Common.ValueListParameterDisplayOnly',
        ValueListProperty : 'descr'
      }
    ]
  };

annotate service.Bugs:priority.code with @Common.ValueList : {
    Label : 'Priority',
    CollectionPath : 'PriorityValues',
    SearchSupported : true,
    Parameters : [
      {
        $Type : 'Common.ValueListParameterInOut',
        LocalDataProperty : priority_code,
        ValueListProperty : 'code'
      },
      {
        $Type : 'Common.ValueListParameterDisplayOnly',
        ValueListProperty : 'name'
      }
    ]
  };

annotate service.Bugs:severity.code with @Common.ValueList : {
    Label : 'Severity',
    CollectionPath : 'SeverityValues',
    SearchSupported : true,
    Parameters : [
      {
        $Type : 'Common.ValueListParameterInOut',
        LocalDataProperty : severity_code,
        ValueListProperty : 'code'
      },
      {
        $Type : 'Common.ValueListParameterDisplayOnly',
        ValueListProperty : 'name'
      }
    ]
  };

annotate service.Bugs:environment.code with @Common.ValueList : {
    Label : 'Environment',
    CollectionPath : 'EnvironmentValues',
    SearchSupported : true,
    Parameters : [
      {
        $Type : 'Common.ValueListParameterInOut',
        LocalDataProperty : environment_code,
        ValueListProperty : 'code'
      },
      {
        $Type : 'Common.ValueListParameterDisplayOnly',
        ValueListProperty : 'name'
      }
    ]
  };

annotate service.Bugs:sapModule.ID with @Common.Text : sapModule.name @Common.TextArrangement : #TextOnly @Common.ValueList : {
    Label : 'SAP Module',
    CollectionPath : 'SAPModules',
    SearchSupported : true,
    Parameters : [
      {
        $Type : 'Common.ValueListParameterInOut',
        LocalDataProperty : sapModule_ID,
        ValueListProperty : 'ID'
      },
      {
        $Type : 'Common.ValueListParameterDisplayOnly',
        ValueListProperty : 'code'
      },
      {
        $Type : 'Common.ValueListParameterDisplayOnly',
        ValueListProperty : 'name'
      }
    ]
  };

annotate service.Bugs:applicationComponent.ID with @Common.Text : applicationComponent.name @Common.TextArrangement : #TextOnly @Common.ValueList : {
    Label : 'Application Component',
    CollectionPath : 'ApplicationComponents',
    SearchSupported : true,
    Parameters : [
      {
        $Type : 'Common.ValueListParameterInOut',
        LocalDataProperty : applicationComponent_ID,
        ValueListProperty : 'ID'
      },
      {
        $Type : 'Common.ValueListParameterDisplayOnly',
        ValueListProperty : 'code'
      },
      {
        $Type : 'Common.ValueListParameterDisplayOnly',
        ValueListProperty : 'name'
      },
      {
        $Type : 'Common.ValueListParameterDisplayOnly',
        ValueListProperty : 'componentType'
      }
    ]
  };

annotate service.Bugs:defectCategory.ID with @Common.Text : defectCategory.name @Common.TextArrangement : #TextOnly @Common.ValueList : {
    Label : 'Defect Category',
    CollectionPath : 'DefectCategories',
    SearchSupported : true,
    Parameters : [
      {
        $Type : 'Common.ValueListParameterInOut',
        LocalDataProperty : defectCategory_ID,
        ValueListProperty : 'ID'
      },
      {
        $Type : 'Common.ValueListParameterDisplayOnly',
        ValueListProperty : 'code'
      },
      {
        $Type : 'Common.ValueListParameterDisplayOnly',
        ValueListProperty : 'name'
      },
      {
        $Type : 'Common.ValueListParameterDisplayOnly',
        ValueListProperty : 'categoryType'
      }
    ]
  };

annotate service.Bugs:assignee.ID with @Common.Label : 'Assignee'
  @Common.Text : assigneeDisplayName
  @Common.TextArrangement : #TextOnly
  @Common.ValueList : {
    Label : 'Assignable Developer',
    CollectionPath : 'AssignableDevelopers',
    SearchSupported : true,
    Parameters : [
      {
        $Type : 'Common.ValueListParameterInOut',
        LocalDataProperty : assignee_ID,
        ValueListProperty : 'developerProfileID'
      },
      {
        $Type : 'Common.ValueListParameterIn',
        LocalDataProperty : componentCategory_ID,
        ValueListProperty : 'componentCategoryID'
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
      },
      {
        $Type : 'Common.ValueListParameterDisplayOnly',
        ValueListProperty : 'sapModuleName'
      },
      {
        $Type : 'Common.ValueListParameterDisplayOnly',
        ValueListProperty : 'responsibilityLevelName'
      }
    ]
  };

annotate service.Bugs:reporter.ID with @Common.ValueList : {
    Label : 'Reporter',
    CollectionPath : 'Users',
    SearchSupported : true,
    Parameters : [
      {
        $Type : 'Common.ValueListParameterInOut',
        LocalDataProperty : reporter_ID,
        ValueListProperty : 'ID'
      },
      {
        $Type : 'Common.ValueListParameterDisplayOnly',
        ValueListProperty : 'displayName'
      },
      {
        $Type : 'Common.ValueListParameterDisplayOnly',
        ValueListProperty : 'email'
      },
      {
        $Type : 'Common.ValueListParameterDisplayOnly',
        ValueListProperty : 'role_code'
      }
    ]
  };

annotate service.Bugs:nextProcessorRole.code with @Common.ValueList : {
    Label : 'Next Processor Role',
    CollectionPath : 'ProcessorRoleValues',
    SearchSupported : true,
    Parameters : [
      {
        $Type : 'Common.ValueListParameterInOut',
        LocalDataProperty : nextProcessorRole_code,
        ValueListProperty : 'code'
      },
      {
        $Type : 'Common.ValueListParameterDisplayOnly',
        ValueListProperty : 'name'
      }
    ]
  };

annotate service.StatusValues with @(
  Common.SemanticKey : [ code ],
  UI.SelectionFields : [ code, name ],
  UI.LineItem : [
    { $Type : 'UI.DataField', Label : 'Code', Value : code },
    { $Type : 'UI.DataField', Label : 'Name', Value : name },
    { $Type : 'UI.DataField', Label : 'Description', Value : descr },
    { $Type : 'UI.DataField', Label : 'Sort Order', Value : sortOrder }
  ]
);

annotate service.PriorityValues with @(
  Common.SemanticKey : [ code ],
  UI.SelectionFields : [ code, name ],
  UI.LineItem : [
    { $Type : 'UI.DataField', Label : 'Code', Value : code },
    { $Type : 'UI.DataField', Label : 'Name', Value : name },
    { $Type : 'UI.DataField', Label : 'Description', Value : descr },
    { $Type : 'UI.DataField', Label : 'Sort Order', Value : sortOrder }
  ]
);

annotate service.SeverityValues with @(
  Common.SemanticKey : [ code ],
  UI.SelectionFields : [ code, name ],
  UI.LineItem : [
    { $Type : 'UI.DataField', Label : 'Code', Value : code },
    { $Type : 'UI.DataField', Label : 'Name', Value : name },
    { $Type : 'UI.DataField', Label : 'Description', Value : descr },
    { $Type : 'UI.DataField', Label : 'Sort Order', Value : sortOrder }
  ]
);

annotate service.EnvironmentValues with @(
  Common.SemanticKey : [ code ],
  UI.SelectionFields : [ code, name ],
  UI.LineItem : [
    { $Type : 'UI.DataField', Label : 'Code', Value : code },
    { $Type : 'UI.DataField', Label : 'Name', Value : name },
    { $Type : 'UI.DataField', Label : 'Description', Value : descr },
    { $Type : 'UI.DataField', Label : 'Sort Order', Value : sortOrder }
  ]
);

annotate service.ProcessorRoleValues with @(
  Common.SemanticKey : [ code ],
  UI.SelectionFields : [ code, name ],
  UI.LineItem : [
    { $Type : 'UI.DataField', Label : 'Code', Value : code },
    { $Type : 'UI.DataField', Label : 'Name', Value : name },
    { $Type : 'UI.DataField', Label : 'Description', Value : descr }
  ]
);

annotate service.SAPModules with @(
  Common.SemanticKey : [ code ],
  UI.SelectionFields : [ code, name ],
  UI.LineItem : [
    { $Type : 'UI.DataField', Label : 'Code', Value : code },
    { $Type : 'UI.DataField', Label : 'Name', Value : name },
    { $Type : 'UI.DataField', Label : 'Active', Value : active }
  ]
);

annotate service.ApplicationComponents with @(
  Common.SemanticKey : [ code ],
  UI.SelectionFields : [ code, name, componentType ],
  UI.LineItem : [
    { $Type : 'UI.DataField', Label : 'Code', Value : code },
    { $Type : 'UI.DataField', Label : 'Name', Value : name },
    { $Type : 'UI.DataField', Label : 'Type', Value : componentType },
    { $Type : 'UI.DataField', Label : 'Active', Value : active }
  ]
);

annotate service.DefectCategories with @(
  Common.SemanticKey : [ code ],
  UI.SelectionFields : [ code, name, categoryType ],
  UI.LineItem : [
    { $Type : 'UI.DataField', Label : 'Code', Value : code },
    { $Type : 'UI.DataField', Label : 'Name', Value : name },
    { $Type : 'UI.DataField', Label : 'Type', Value : categoryType },
    { $Type : 'UI.DataField', Label : 'Active', Value : active }
  ]
);

annotate service.ComponentCategories with @(
  UI.SelectionFields : [ component_ID, defectCategory_ID ],
  UI.LineItem : [
    { $Type : 'UI.DataField', Label : 'Application Component', Value : component.name },
    { $Type : 'UI.DataField', Label : 'Defect Category', Value : defectCategory.name },
    { $Type : 'UI.DataField', Label : 'Active', Value : active }
  ]
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

annotate service.Comments with @UI.LineItem : [
  { $Type : 'UI.DataField', Label : 'Comment', Value : content },
  { $Type : 'UI.DataField', Label : 'Author', Value : author.displayName },
  { $Type : 'UI.DataField', Label : 'Role', Value : authorRole.name },
  { $Type : 'UI.DataField', Label : 'Created At', Value : createdAt }
];

annotate service.Comments with @(
  Capabilities.InsertRestrictions : { Insertable : false },
  Capabilities.DeleteRestrictions : { Deletable : false },
  Capabilities.UpdateRestrictions : { Updatable : false }
);

annotate service.Comments with {
  ID         @UI.Hidden;
  bug        @UI.Hidden;
  author     @Common.FieldControl : #ReadOnly;
  authorRole @Common.FieldControl : #ReadOnly;
  content    @UI.MultiLineText @Common.FieldControl : #Mandatory;
};

annotate service.Attachments with @UI.LineItem : [
  { $Type : 'UI.DataField', Label : 'Attachment', Value : content },
  { $Type : 'UI.DataField', Label : 'Media Type', Value : mediaType },
  { $Type : 'UI.DataField', Label : 'Size', Value : fileSize },
  { $Type : 'UI.DataField', Label : 'Uploaded By', Value : uploadedBy.displayName },
  { $Type : 'UI.DataField', Label : 'Uploaded At', Value : createdAt }
];

annotate service.Attachments with @(
  Capabilities.InsertRestrictions : { Insertable : true },
  Capabilities.DeleteRestrictions : { Deletable : true },
  Capabilities.UpdateRestrictions : { Updatable : false },
  UI.MediaResource : { Stream : content }
);

annotate service.Attachments with {
  ID         @UI.Hidden;
  bug        @UI.Hidden;
  storageRef @UI.Hidden;
  uploadedBy @Common.FieldControl : #ReadOnly;
  content    @Common.FieldControl : #Mandatory;
};

annotate service.HistoryLogs with @(
  Capabilities.InsertRestrictions : { Insertable : false },
  Capabilities.DeleteRestrictions : { Deletable : false },
  Capabilities.UpdateRestrictions : { Updatable : false },
  UI.LineItem : [
    { $Type : 'UI.DataField', Label : 'Time', Value : createdAt },
    { $Type : 'UI.DataField', Label : 'Actor', Value : actor.displayName },
    { $Type : 'UI.DataField', Label : 'Role', Value : actorRole.name },
    { $Type : 'UI.DataField', Label : 'Action', Value : actionType.name },
    { $Type : 'UI.DataField', Label : 'Field', Value : fieldName },
    { $Type : 'UI.DataField', Label : 'Old Value', Value : oldValue },
    { $Type : 'UI.DataField', Label : 'New Value', Value : newValue },
    { $Type : 'UI.DataField', Label : 'Reason', Value : reason }
  ]
);

annotate service.HistoryLogs with {
  ID     @UI.Hidden;
  bug    @UI.Hidden;
  reason @UI.MultiLineText;
};

annotate service.Notifications with @UI.LineItem : [
  { $Type : 'UI.DataField', Label : 'Created At', Value : createdAt },
  { $Type : 'UI.DataField', Label : 'Recipient', Value : recipient.displayName },
  { $Type : 'UI.DataField', Label : 'Event', Value : eventType.name },
  { $Type : 'UI.DataField', Label : 'Channel', Value : channel.name },
  { $Type : 'UI.DataField', Label : 'Delivery Status', Value : deliveryStatus.name, Criticality : deliveryStatus.criticality },
  { $Type : 'UI.DataField', Label : 'Message', Value : message },
  { $Type : 'UI.DataField', Label : 'Sent At', Value : sentAt }
];

annotate service.Notifications with {
  ID      @UI.Hidden;
  bug     @UI.Hidden;
  message @UI.MultiLineText;
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

annotate service.Bugs actions {
  @Common.SideEffects : {
    TargetEntities : [comments, historyLogs]
  }
  addComment(
    content @UI.MultiLineText @Common.Label : 'Comment'
  );
  assignToDeveloper(
    note @UI.MultiLineText @Common.Label : 'Developer Note'
  );
  moveToPendingAssignment(
    reason @UI.MultiLineText @Common.Label : 'Reason'
  );
  markInReview(
    note @UI.MultiLineText @Common.Label : 'Developer Note'
  );
  requestMoreInformation(
    reason @UI.MultiLineText @Common.Label : 'Reason'
  );
  rejectBug(
    reason @UI.MultiLineText @Common.Label : 'Rejection Reason'
  );
  startProgress(
    note @UI.MultiLineText @Common.Label : 'Developer Note'
  );
  resolveBug(
    note @UI.MultiLineText @Common.Label : 'Developer Note'
  );
  sendToRetest(
    note @UI.MultiLineText @Common.Label : 'Developer Note'
  );
  closeBug(
    note @UI.MultiLineText @Common.Label : 'Developer Note'
  );
  reopenBug(
    reason @UI.MultiLineText @Common.Label : 'Reason'
  );
}

annotate service.StatusValues with {
  code      @Common.Label : 'Status Code';
  name      @Common.Label : 'Status';
  descr     @Common.Label : 'Description';
  sortOrder @Common.Label : 'Sort Order';
};

annotate service.PriorityValues with {
  code      @Common.Label : 'Priority Code';
  name      @Common.Label : 'Priority';
  descr     @Common.Label : 'Description';
  sortOrder @Common.Label : 'Sort Order';
};

annotate service.SeverityValues with {
  code      @Common.Label : 'Severity Code';
  name      @Common.Label : 'Severity';
  descr     @Common.Label : 'Description';
  sortOrder @Common.Label : 'Sort Order';
};

annotate service.EnvironmentValues with {
  code      @Common.Label : 'Environment Code';
  name      @Common.Label : 'Environment';
  descr     @Common.Label : 'Description';
  sortOrder @Common.Label : 'Sort Order';
};

annotate service.ProcessorRoleValues with {
  code  @Common.Label : 'Processor Role Code';
  name  @Common.Label : 'Processor Role';
  descr @Common.Label : 'Description';
};

annotate service.SAPModules with {
  ID     @UI.Hidden;
  code   @Common.Label : 'SAP Module Code';
  name   @Common.Label : 'SAP Module';
  active @Common.Label : 'Active';
};

annotate service.ApplicationComponents with {
  ID            @UI.Hidden;
  code          @Common.Label : 'Component Code';
  name          @Common.Label : 'Application Component';
  componentType @Common.Label : 'Component Type';
  active        @Common.Label : 'Active';
};

annotate service.DefectCategories with {
  ID           @UI.Hidden;
  code         @Common.Label : 'Category Code';
  name         @Common.Label : 'Defect Category';
  categoryType @Common.Label : 'Category Type';
  active       @Common.Label : 'Active';
};

annotate service.AssignableDevelopers with @(
  UI.SelectionFields : [ developerName, developerEmail, applicationComponentName, defectCategoryName, sapModuleName, responsibilityLevelName, active ],
  UI.LineItem : [
    { $Type : 'UI.DataField', Label : 'Developer', Value : developerName },
    { $Type : 'UI.DataField', Label : 'Email', Value : developerEmail },
    { $Type : 'UI.DataField', Label : 'Availability', Value : availabilityStatusName, Criticality : availabilityCriticality },
    { $Type : 'UI.DataField', Label : 'Application Component', Value : applicationComponentName },
    { $Type : 'UI.DataField', Label : 'Defect Category', Value : defectCategoryName },
    { $Type : 'UI.DataField', Label : 'SAP Module Scope', Value : sapModuleName },
    { $Type : 'UI.DataField', Label : 'Responsibility Level', Value : responsibilityLevelName },
    { $Type : 'UI.DataField', Label : 'Active', Value : active }
  ]
);

annotate service.AssignableDevelopers with {
  ID                       @UI.Hidden;
  developerProfileID       @UI.Hidden @Common.Label : 'Developer ID';
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

annotate service.Bugs with @(
  Common.SideEffects #ComponentCategoryDerivation: {
    SourceProperties : [applicationComponent_ID, defectCategory_ID],
    TargetProperties : ['componentCategory_ID']
  },
  Common.SideEffects #AssigneeDisplayNameRefresh: {
    SourceProperties : [assignee_ID],
    TargetProperties : ['assigneeDisplayName']
  }
);
