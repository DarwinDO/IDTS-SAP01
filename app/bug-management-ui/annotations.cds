using BugService as service from '../../srv/service';

annotate service.Bugs with @(
  Capabilities.InsertRestrictions : {
    Insertable : true,
    RequiredProperties : [
      title,
      description,
      priority_code,
      severity_code,
      applicationComponent_ID,
      defectCategory_ID,
      stepsToReproduce,
      actualResult,
      expectedResult
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
      Label  : 'Assign Developer',
      Action : 'BugService.assignToDeveloper'
    },
    {
      $Type  : 'UI.DataFieldForAction',
      Label  : 'Move to Pending Assignment',
      Action : 'BugService.moveToPendingAssignment'
    },
    {
      $Type  : 'UI.DataFieldForAction',
      Label  : 'Mark In Review',
      Action : 'BugService.markInReview'
    },
    {
      $Type  : 'UI.DataFieldForAction',
      Label  : 'Request More Information',
      Action : 'BugService.requestMoreInformation'
    },
    {
      $Type  : 'UI.DataFieldForAction',
      Label  : 'Reject Bug',
      Action : 'BugService.rejectBug'
    },
    {
      $Type  : 'UI.DataFieldForAction',
      Label  : 'Start Progress',
      Action : 'BugService.startProgress'
    },
    {
      $Type  : 'UI.DataFieldForAction',
      Label  : 'Resolve Bug',
      Action : 'BugService.resolveBug'
    },
    {
      $Type  : 'UI.DataFieldForAction',
      Label  : 'Send to Retest',
      Action : 'BugService.sendToRetest'
    },
    {
      $Type  : 'UI.DataFieldForAction',
      Label  : 'Close Bug',
      Action : 'BugService.closeBug'
    },
    {
      $Type  : 'UI.DataFieldForAction',
      Label  : 'Reopen Bug',
      Action : 'BugService.reopenBug'
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
      Label  : 'Bug Details',
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
        },
        {
          $Type  : 'UI.ReferenceFacet',
          ID     : 'Classification',
          Label  : 'Classification',
          Target : '@UI.FieldGroup#Classification'
        },
        {
          $Type  : 'UI.ReferenceFacet',
          ID     : 'Reproduction',
          Label  : 'Reproduction and Results',
          Target : '@UI.FieldGroup#Reproduction'
        }
      ]
    },
    {
      $Type  : 'UI.CollectionFacet',
      ID     : 'Ownership',
      Label  : 'Assignment and Follow-up',
      Facets : [
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
          Target : '@UI.FieldGroup#RejectedFollowUp'
        },
        {
          $Type  : 'UI.ReferenceFacet',
          ID     : 'Planning',
          Label  : 'Planning',
          Target : '@UI.FieldGroup#Planning'
        }
      ]
    },
    {
      $Type  : 'UI.ReferenceFacet',
      ID     : 'Comments',
      Label  : 'Comments',
      Target : 'comments/@UI.LineItem'
    },
    {
      $Type  : 'UI.ReferenceFacet',
      ID     : 'Attachments',
      Label  : 'Attachments',
      Target : 'attachments/@UI.LineItem'
    },
    {
      $Type  : 'UI.ReferenceFacet',
      ID     : 'History',
      Label  : 'History',
      Target : 'historyLogs/@UI.LineItem'
    },
    {
      $Type  : 'UI.ReferenceFacet',
      ID     : 'Notifications',
      Label  : 'Notifications',
      Target : 'notifications/@UI.LineItem'
    }
  ],
  UI.FieldGroup #GeneralInfo : {
    Data : [
      { $Type : 'UI.DataField', Label : 'Bug Number', Value : bugNumber },
      { $Type : 'UI.DataField', Label : 'Title', Value : title },
      { $Type : 'UI.DataField', Label : 'Description', Value : description },
      { $Type : 'UI.DataField', Label : 'Status', Value : status_code, Criticality : status.criticality, CriticalityRepresentation : #WithoutIcon },
      { $Type : 'UI.DataField', Label : 'Priority', Value : priority_code, Criticality : priority.criticality, CriticalityRepresentation : #WithoutIcon },
      { $Type : 'UI.DataField', Label : 'Reporter', Value : reporter_ID },
      { $Type : 'UI.DataField', Label : 'Created At', Value : createdAt },
      { $Type : 'UI.DataField', Label : 'Updated At', Value : modifiedAt }
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
      { $Type : 'UI.DataField', Label : 'Assignee', Value : assignee.user.displayName },
      { $Type : 'UI.DataField', Label : 'Next Processor User', Value : nextProcessorUser.displayName },
      { $Type : 'UI.DataField', Label : 'Next Processor Role', Value : nextProcessorRole.name }
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
  UI.FieldGroup #CreateBug : {
    Data : [
      { $Type : 'UI.DataField', Label : 'Title', Value : title },
      { $Type : 'UI.DataField', Label : 'Description', Value : description },
      { $Type : 'UI.DataField', Label : 'Priority', Value : priority_code },
      { $Type : 'UI.DataField', Label : 'Severity', Value : severity_code },
      { $Type : 'UI.DataField', Label : 'Environment', Value : environment_code },
      { $Type : 'UI.DataField', Label : 'SAP Module', Value : sapModule_ID },
      { $Type : 'UI.DataField', Label : 'Application Component', Value : applicationComponent_ID },
      { $Type : 'UI.DataField', Label : 'Defect Category', Value : defectCategory_ID },
      { $Type : 'UI.DataField', Label : 'Steps to Reproduce', Value : stepsToReproduce },
      { $Type : 'UI.DataField', Label : 'Actual Result', Value : actualResult },
      { $Type : 'UI.DataField', Label : 'Expected Result', Value : expectedResult },
      { $Type : 'UI.DataField', Label : 'Due Date', Value : dueDate }
    ]
  }
);

annotate service.Bugs with {
  ID                    @UI.Hidden;
  bugNumber             @Core.Computed @Common.Label : 'Bug Number';
  title                 @Common.Label : 'Title';
  description           @UI.MultiLineText @Common.Label : 'Description';
  stepsToReproduce      @UI.MultiLineText @Common.Label : 'Steps to Reproduce';
  actualResult          @UI.MultiLineText @Common.Label : 'Actual Result';
  expectedResult        @UI.MultiLineText @Common.Label : 'Expected Result';
  rejectionReason       @UI.MultiLineText @Common.Label : 'Rejection Reason';
  dueDate               @Common.Label : 'Due Date';
  status                @Common.Label : 'Status';
  priority              @Common.Label : 'Priority';
  severity              @Common.Label : 'Severity';
  environment           @Common.Label : 'Environment';
  sapModule             @Common.Label : 'SAP Module';
  applicationComponent  @Common.Label : 'Application Component';
  defectCategory        @Common.Label : 'Defect Category';
  componentCategory     @Common.Label : 'Component Category';
  reporter              @Common.Label : 'Reporter';
  assignee              @Common.Label : 'Assignee';
  nextProcessorUser     @Common.Label : 'Next Processor User';
  nextProcessorRole     @Common.Label : 'Next Processor Role';
  componentCategory     @UI.Hidden @Core.Computed;
};

annotate service.Bugs:componentCategory.ID with @UI.Hidden @Core.Computed;

annotate service.Bugs:status.code with @Common.ValueListWithFixedValues : true @Common.ValueList : {
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

annotate service.Bugs:sapModule.ID with @Common.ValueList : {
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

annotate service.Bugs:applicationComponent.ID with @Common.ValueList : {
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

annotate service.Bugs:defectCategory.ID with @Common.ValueList : {
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

annotate service.Bugs:assignee.ID with @Common.ValueList : {
    Label : 'Assignable Developer',
    CollectionPath : 'DeveloperResponsibilities',
    SearchSupported : true,
    Parameters : [
      {
        $Type : 'Common.ValueListParameterInOut',
        LocalDataProperty : assignee_ID,
        ValueListProperty : 'developerProfile_ID'
      },
      {
        $Type : 'Common.ValueListParameterIn',
        LocalDataProperty : componentCategory_ID,
        ValueListProperty : 'componentCategory_ID'
      },
      {
        $Type : 'Common.ValueListParameterDisplayOnly',
        ValueListProperty : 'responsibilityLevel_code'
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
  { $Type : 'UI.DataField', Label : 'Created At', Value : createdAt },
  { $Type : 'UI.DataField', Label : 'Author', Value : author.displayName },
  { $Type : 'UI.DataField', Label : 'Role', Value : authorRole.name },
  { $Type : 'UI.DataField', Label : 'Comment', Value : content }
];

annotate service.Comments with {
  ID      @UI.Hidden;
  bug     @UI.Hidden;
  content @UI.MultiLineText;
};

annotate service.Attachments with @UI.LineItem : [
  { $Type : 'UI.DataField', Label : 'File Name', Value : fileName },
  { $Type : 'UI.DataField', Label : 'Media Type', Value : mediaType },
  { $Type : 'UI.DataField', Label : 'Size', Value : fileSize },
  { $Type : 'UI.DataField', Label : 'Uploaded By', Value : uploadedBy.displayName },
  { $Type : 'UI.DataField', Label : 'Uploaded At', Value : createdAt },
  { $Type : 'UI.DataField', Label : 'Storage Reference', Value : storageRef }
];

annotate service.Attachments with {
  ID  @UI.Hidden;
  bug @UI.Hidden;
};

annotate service.HistoryLogs with @UI.LineItem : [
  { $Type : 'UI.DataField', Label : 'Time', Value : createdAt },
  { $Type : 'UI.DataField', Label : 'Actor', Value : actor.displayName },
  { $Type : 'UI.DataField', Label : 'Role', Value : actorRole.name },
  { $Type : 'UI.DataField', Label : 'Action', Value : actionType.name },
  { $Type : 'UI.DataField', Label : 'Field', Value : fieldName },
  { $Type : 'UI.DataField', Label : 'Old Value', Value : oldValue },
  { $Type : 'UI.DataField', Label : 'New Value', Value : newValue },
  { $Type : 'UI.DataField', Label : 'Reason', Value : reason }
];

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
