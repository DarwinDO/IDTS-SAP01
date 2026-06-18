using BugService as service from '../../srv/service';

annotate service.Bugs with @(
  Capabilities.InsertRestrictions : {
    Insertable : true
  },
  Capabilities.DeleteRestrictions : {
    Deletable : false
  },
  Capabilities.NavigationRestrictions : {
    RestrictedProperties : [
      {
        NavigationProperty : notifications,
        InsertRestrictions : { Insertable : false },
        DeleteRestrictions : { Deletable : false },
        UpdateRestrictions : { Updatable : false }
      },
      {
        NavigationProperty : historyEvents,
        InsertRestrictions : { Insertable : false },
        DeleteRestrictions : { Deletable : false },
        UpdateRestrictions : { Updatable : false }
      },
      {
        NavigationProperty : comments,
        InsertRestrictions : { Insertable : false },
        DeleteRestrictions : { Deletable : false },
        UpdateRestrictions : { Updatable : false }
      }
    ]
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
      Label  : 'Move to Pending Assignment',
      Action : 'BugService.moveToPendingAssignment',
      ![@UI.Hidden] : { $edmJson : { $Not : { $Path : 'canMoveToPending' } } }
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
      Label  : 'Resubmit to Developer',
      Action : 'BugService.resubmitToDeveloper',
      ![@UI.Hidden] : { $edmJson : { $Not : { $Path : 'canResubmit' } } }
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
    { $Type : 'UI.DataField', Label : 'Assignee', Value : assigneeDisplayName },
    { $Type : 'UI.DataField', Label : 'Next Processor', Value : nextProcessorRoleName },
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
          ![@UI.Hidden] : {
            $edmJson : {
              $Or : [
                {
                  $And : [
                    { $Eq : [ { $Path : 'IsActiveEntity' }, false ] },
                    { $Eq : [ { $Path : 'HasActiveEntity' }, false ] }
                  ]
                },
                { $Ne : [ { $Path : 'status_code' }, 'REJECTED' ] }
              ]
            }
          }
        },
        {
          $Type  : 'UI.ReferenceFacet',
          ID     : 'Planning',
          Label  : 'Planning',
          Target: '@UI.FieldGroup#Planning',
          ![@UI.Hidden] : false
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
      ID     : 'Attachments',
      Label  : 'Evidence / Attachments',
      Target : 'attachments/@UI.LineItem'
    },
    {
      $Type  : 'UI.CollectionFacet',
      ID     : 'Comments',
      Label  : 'Comments',
      Facets : [
        {
          $Type  : 'UI.ReferenceFacet',
          ID     : 'CommentAction',
          Label  : 'Comment Actions',
          Target : '@UI.Identification#CommentAction'
        },
        {
          $Type  : 'UI.ReferenceFacet',
          ID     : 'CommentList',
          Target : 'comments/@UI.LineItem'
        }
      ],
      ![@UI.Hidden] : {$edmJson: {$And: [{$Eq: [{$Path: 'IsActiveEntity'}, false]}, {$Eq: [{$Path: 'HasActiveEntity'}, false]}]}}
    },
    {
      $Type  : 'UI.ReferenceFacet',
      ID     : 'History',
      Label  : 'History',
      Target : 'historyEvents/@UI.LineItem',
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
  UI.PresentationVariant : {
    Visualizations : [ '@UI.LineItem' ],
    RequestAtLeast : [
      canAssign,
      canMoveToPending,
      canResubmit,
      canAddComment,
      canMarkInReview,
      canStartProgress,
      canResolve,
      canRequestMoreInfo,
      canReject,
      canSendToRetest,
      canClose,
      canReopen
    ]
  },
  UI.FieldGroup #GeneralInfo : {
    Data : [
      { $Type : 'UI.DataField', Label : 'Bug Number', Value : bugNumber, ![@Common.FieldControl] : #ReadOnly, ![@UI.Hidden] : {$edmJson: {$And: [{$Eq: [{$Path: 'IsActiveEntity'}, false]}, {$Eq: [{$Path: 'HasActiveEntity'}, false]}]}} },
      { $Type : 'UI.DataField', Label : 'Title', Value : title },
      { $Type : 'UI.DataField', Label : 'Description', Value : description },
      { $Type : 'UI.DataField', Label : 'Status', Value : status.name, Criticality : status.criticality, CriticalityRepresentation : #WithoutIcon, ![@Common.FieldControl] : #ReadOnly, ![@UI.Hidden] : {$edmJson: {$And: [{$Eq: [{$Path: 'IsActiveEntity'}, false]}, {$Eq: [{$Path: 'HasActiveEntity'}, false]}]}} },
      { $Type : 'UI.DataField', Label : 'Priority', Value : priority_code, Criticality : priority.criticality, CriticalityRepresentation : #WithoutIcon },
      { $Type : 'UI.DataField', Label : 'Reporter', Value : reporterDisplayName, ![@Common.FieldControl] : #ReadOnly, ![@UI.Hidden] : {$edmJson: {$And: [{$Eq: [{$Path: 'IsActiveEntity'}, false]}, {$Eq: [{$Path: 'HasActiveEntity'}, false]}]}} },
      { $Type : 'UI.DataField', Label : 'Created At', Value : createdAt, ![@Common.FieldControl] : #ReadOnly, ![@UI.Hidden] : {$edmJson: {$And: [{$Eq: [{$Path: 'IsActiveEntity'}, false]}, {$Eq: [{$Path: 'HasActiveEntity'}, false]}]}} },
      { $Type : 'UI.DataField', Label : 'Updated At', Value : modifiedAt, ![@Common.FieldControl] : #ReadOnly, ![@UI.Hidden] : {$edmJson: {$And: [{$Eq: [{$Path: 'IsActiveEntity'}, false]}, {$Eq: [{$Path: 'HasActiveEntity'}, false]}]}} }
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
  },
  UI.FieldGroup #Planning : {
    Data : [
      { $Type : 'UI.DataField', Label : 'Planned Completion Date', Value : plannedCompletionDate },
      { $Type : 'UI.DataField', Label : 'Due Date', Value : dueDate },
      { $Type : 'UI.DataField', Label : 'Estimated Effort Hours', Value : estimatedEffortHours }
    ]
  },
  UI.Identification #CommentAction : [
      {
        $Type             : 'UI.DataFieldForAction',
        Label             : 'Add Comment',
        Action            : 'BugService.addComment',
        ![@UI.Importance] : #High,
        ![@UI.Hidden]     : {
          $edmJson : {
            $Or : [
              { $Not : { $Path : 'canAddComment' } },
              { $Eq : [ { $Path : 'IsActiveEntity' }, false ] }
            ]
          }
        }
      }
  ],

);

annotate service.Bugs with {
  ID                    @UI.Hidden;
  bugNumber             @Core.Computed @Common.Label : 'Bug Number';
  title                 @Common.Label : 'Title' @Common.FieldControl : #Mandatory;
  description           @UI.MultiLineText @Common.Label : 'Description' @Common.FieldControl : #Mandatory;
  stepsToReproduce      @UI.MultiLineText @Common.Label : 'Steps to Reproduce' @Common.FieldControl : #Mandatory;
  actualResult          @UI.MultiLineText @Common.Label : 'Actual Result' @Common.FieldControl : #Mandatory;
  expectedResult        @UI.MultiLineText @Common.Label : 'Expected Result' @Common.FieldControl : #Mandatory;
  rejectionReason       @UI.MultiLineText @Common.Label : 'Rejection Reason' @Common.FieldControl : #ReadOnly;
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
  reporterDisplayName   @Common.Label : 'Reporter' @Common.FieldControl : #ReadOnly @Core.Computed;
  assignee              @Common.Label : 'Assignee';
  assigneeDisplayName   @Common.Label : 'Assignee' @Common.FieldControl : #ReadOnly @Core.Computed;
  nextProcessorUser     @Common.Label : 'Next Processor User' @Common.FieldControl : #ReadOnly;
  nextProcessorUserDisplayName @Common.Label : 'Next Processor User' @Common.FieldControl : #ReadOnly @Core.Computed;
  nextProcessorRole     @Common.Label : 'Next Processor Role' @Common.FieldControl : #ReadOnly;
  nextProcessorRoleName @Common.Label : 'Next Processor Role' @Common.FieldControl : #ReadOnly @Core.Computed;
  plannedCompletionDate @Common.Label : 'Planned Completion Date';
  estimatedEffortHours  @Common.Label : 'Estimated Effort Hours';
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
    CollectionPath : 'ValidDefectCategories',
    SearchSupported : true,
    Parameters : [
      {
        $Type : 'Common.ValueListParameterIn',
        LocalDataProperty : applicationComponent_ID,
        ValueListProperty : 'applicationComponentID'
      },
      {
        $Type : 'Common.ValueListParameterInOut',
        LocalDataProperty : defectCategory_ID,
        ValueListProperty : 'defectCategoryID'
      },
      {
        $Type : 'Common.ValueListParameterOut',
        LocalDataProperty : componentCategory_ID,
        ValueListProperty : 'componentCategoryID'
      },
      {
        $Type : 'Common.ValueListParameterDisplayOnly',
        ValueListProperty : 'defectCategoryCode'
      },
      {
        $Type : 'Common.ValueListParameterDisplayOnly',
        ValueListProperty : 'defectCategoryName'
      },
      {
        $Type : 'Common.ValueListParameterDisplayOnly',
        ValueListProperty : 'defectCategoryType'
      },
      {
        $Type : 'Common.ValueListParameterDisplayOnly',
        ValueListProperty : 'applicationComponentName'
      }
    ]
  };

annotate service.Bugs:assignee.ID with @Common.Label : 'Assignee'
  @Common.FieldControl : assigneeFieldControl
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
        $Type : 'Common.ValueListParameterIn',
        LocalDataProperty : sapModule_ID,
        ValueListProperty : 'sapModuleID'
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

annotate service.Bugs:reporter.ID with @Common.FieldControl : #ReadOnly @Common.ValueList : {
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

annotate service.Bugs:nextProcessorUser.ID with @Common.FieldControl : #ReadOnly;

annotate service.Bugs:nextProcessorRole.code with @Common.FieldControl : #ReadOnly @Common.ValueList : {
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

annotate service.Bugs actions {
  @Common.SideEffects : {
    TargetEntities : [comments, historyEvents]
  }
  addComment(
    content @UI.MultiLineText @Common.Label : 'Comment'
  );
  @Common.SideEffects : {
    TargetProperties : [
      'status_code',
      'assignee_ID',
      'assigneeDisplayName',
      'nextProcessorUser_ID',
      'nextProcessorRole_code',
      'nextProcessorUserDisplayName',
      'nextProcessorRoleName',
      'canAssign',
      'canMoveToPending',
      'canResubmit',
      'canAddComment',
      'canMarkInReview',
      'canStartProgress',
      'canResolve',
      'canRequestMoreInfo',
      'canReject',
      'canSendToRetest',
      'canClose',
      'canReopen'
    ],
    TargetEntities : [status, historyEvents, notifications]
  }
  assignToDeveloper(
    note @UI.MultiLineText @Common.Label : 'Developer Note'
  );
  @Common.SideEffects : {
    TargetProperties : [
      'status_code',
      'assignee_ID',
      'assigneeDisplayName',
      'nextProcessorUser_ID',
      'nextProcessorRole_code',
      'nextProcessorUserDisplayName',
      'nextProcessorRoleName',
      'canAssign',
      'canMoveToPending',
      'canResubmit',
      'canAddComment',
      'canMarkInReview',
      'canStartProgress',
      'canResolve',
      'canRequestMoreInfo',
      'canReject',
      'canSendToRetest',
      'canClose',
      'canReopen'
    ],
    TargetEntities : [status, historyEvents, notifications]
  }
  moveToPendingAssignment(
    reason @UI.MultiLineText @Common.Label : 'Reason'
  );
  @Common.SideEffects : {
    TargetProperties : [
      'status_code',
      'assignee_ID',
      'assigneeDisplayName',
      'nextProcessorUser_ID',
      'nextProcessorRole_code',
      'nextProcessorUserDisplayName',
      'nextProcessorRoleName',
      'canAssign',
      'canMoveToPending',
      'canResubmit',
      'canAddComment',
      'canMarkInReview',
      'canStartProgress',
      'canResolve',
      'canRequestMoreInfo',
      'canReject',
      'canSendToRetest',
      'canClose',
      'canReopen'
    ],
    TargetEntities : [status, historyEvents, notifications]
  }
  markInReview(
    note @UI.MultiLineText @Common.Label : 'Developer Note'
  );
  @Common.SideEffects : {
    TargetProperties : [
      'status_code',
      'assignee_ID',
      'assigneeDisplayName',
      'nextProcessorUser_ID',
      'nextProcessorRole_code',
      'nextProcessorUserDisplayName',
      'nextProcessorRoleName',
      'canAssign',
      'canMoveToPending',
      'canResubmit',
      'canAddComment',
      'canMarkInReview',
      'canStartProgress',
      'canResolve',
      'canRequestMoreInfo',
      'canReject',
      'canSendToRetest',
      'canClose',
      'canReopen'
    ],
    TargetEntities : [status, historyEvents, notifications]
  }
  requestMoreInformation(
    reason @UI.MultiLineText @Common.Label : 'Reason'
  );
  @Common.SideEffects : {
    TargetProperties : [
      'status_code',
      'assignee_ID',
      'assigneeDisplayName',
      'nextProcessorUser_ID',
      'nextProcessorRole_code',
      'nextProcessorUserDisplayName',
      'nextProcessorRoleName',
      'canAssign',
      'canMoveToPending',
      'canResubmit',
      'canAddComment',
      'canMarkInReview',
      'canStartProgress',
      'canResolve',
      'canRequestMoreInfo',
      'canReject',
      'canSendToRetest',
      'canClose',
      'canReopen'
    ],
    TargetEntities : [status, historyEvents, notifications]
  }
  resubmitToDeveloper(
    note @UI.MultiLineText @Common.Label : 'Update Summary'
  );
  @Common.SideEffects : {
    TargetProperties : [
      'status_code',
      'assignee_ID',
      'assigneeDisplayName',
      'nextProcessorUser_ID',
      'nextProcessorRole_code',
      'nextProcessorUserDisplayName',
      'nextProcessorRoleName',
      'canAssign',
      'canMoveToPending',
      'canResubmit',
      'canAddComment',
      'canMarkInReview',
      'canStartProgress',
      'canResolve',
      'canRequestMoreInfo',
      'canReject',
      'canSendToRetest',
      'canClose',
      'canReopen'
    ],
    TargetEntities : [status, historyEvents, notifications, comments]
  }
  rejectBug(
    reason @UI.MultiLineText @Common.Label : 'Rejection Reason'
  );
  @Common.SideEffects : {
    TargetProperties : [
      'status_code',
      'assignee_ID',
      'assigneeDisplayName',
      'nextProcessorUser_ID',
      'nextProcessorRole_code',
      'nextProcessorUserDisplayName',
      'nextProcessorRoleName',
      'canAssign',
      'canMoveToPending',
      'canResubmit',
      'canAddComment',
      'canMarkInReview',
      'canStartProgress',
      'canResolve',
      'canRequestMoreInfo',
      'canReject',
      'canSendToRetest',
      'canClose',
      'canReopen'
    ],
    TargetEntities : [status, historyEvents, notifications]
  }
  startProgress(
    note @UI.MultiLineText @Common.Label : 'Developer Note'
  );
  @Common.SideEffects : {
    TargetProperties : [
      'status_code',
      'assignee_ID',
      'assigneeDisplayName',
      'nextProcessorUser_ID',
      'nextProcessorRole_code',
      'nextProcessorUserDisplayName',
      'nextProcessorRoleName',
      'canAssign',
      'canMoveToPending',
      'canResubmit',
      'canAddComment',
      'canMarkInReview',
      'canStartProgress',
      'canResolve',
      'canRequestMoreInfo',
      'canReject',
      'canSendToRetest',
      'canClose',
      'canReopen'
    ],
    TargetEntities : [status, historyEvents, notifications]
  }
  resolveBug(
    note @UI.MultiLineText @Common.Label : 'Developer Note'
  );
  @Common.SideEffects : {
    TargetProperties : [
      'status_code',
      'assignee_ID',
      'assigneeDisplayName',
      'nextProcessorUser_ID',
      'nextProcessorRole_code',
      'nextProcessorUserDisplayName',
      'nextProcessorRoleName',
      'canAssign',
      'canMoveToPending',
      'canResubmit',
      'canAddComment',
      'canMarkInReview',
      'canStartProgress',
      'canResolve',
      'canRequestMoreInfo',
      'canReject',
      'canSendToRetest',
      'canClose',
      'canReopen'
    ],
    TargetEntities : [status, historyEvents, notifications]
  }
  sendToRetest(
    note @UI.MultiLineText @Common.Label : 'Developer Note'
  );
  @Common.SideEffects : {
    TargetProperties : [
      'status_code',
      'assignee_ID',
      'assigneeDisplayName',
      'nextProcessorUser_ID',
      'nextProcessorRole_code',
      'nextProcessorUserDisplayName',
      'nextProcessorRoleName',
      'canAssign',
      'canMoveToPending',
      'canResubmit',
      'canAddComment',
      'canMarkInReview',
      'canStartProgress',
      'canResolve',
      'canRequestMoreInfo',
      'canReject',
      'canSendToRetest',
      'canClose',
      'canReopen'
    ],
    TargetEntities : [status, historyEvents, notifications]
  }
  closeBug(
    note @UI.MultiLineText @Common.Label : 'Developer Note'
  );
  @Common.SideEffects : {
    TargetProperties : [
      'status_code',
      'assignee_ID',
      'assigneeDisplayName',
      'nextProcessorUser_ID',
      'nextProcessorRole_code',
      'canAssign',
      'canMoveToPending',
      'canResubmit',
      'canAddComment',
      'canMarkInReview',
      'canStartProgress',
      'canResolve',
      'canRequestMoreInfo',
      'canReject',
      'canSendToRetest',
      'canClose',
      'canReopen'
    ],
    TargetEntities : [historyEvents, notifications]
  }
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

annotate service.ValidDefectCategories with @(
  UI.SelectionFields : [ defectCategoryName, applicationComponentName, defectCategoryType, active ],
  UI.LineItem : [
    { $Type : 'UI.DataField', Label : 'Defect Category', Value : defectCategoryName },
    { $Type : 'UI.DataField', Label : 'Category Code', Value : defectCategoryCode },
    { $Type : 'UI.DataField', Label : 'Category Type', Value : defectCategoryType },
    { $Type : 'UI.DataField', Label : 'Application Component', Value : applicationComponentName },
    { $Type : 'UI.DataField', Label : 'Component Code', Value : applicationComponentCode },
    { $Type : 'UI.DataField', Label : 'Active', Value : active }
  ]
);

annotate service.ValidDefectCategories with {
  componentCategoryID      @UI.Hidden @Common.Label : 'Component Category ID';
  applicationComponentID   @UI.Hidden @Common.Label : 'Application Component ID';
  defectCategoryID         @UI.Hidden @Common.Label : 'Defect Category ID';
  applicationComponentCode @Common.Label : 'Component Code';
  applicationComponentName @Common.Label : 'Application Component';
  defectCategoryCode       @Common.Label : 'Category Code';
  defectCategoryName       @Common.Label : 'Defect Category';
  defectCategoryType       @Common.Label : 'Category Type';
};

annotate service.Bugs with @(
  Common.SideEffects #AttachmentRowsRefresh: {
    SourceEntities : [attachments],
    TargetEntities : [attachments]
  },
  Common.SideEffects #AssigneeDisplayNameRefresh: {
    SourceProperties : [assignee_ID],
    TargetProperties : ['assigneeDisplayName']
  }
);
