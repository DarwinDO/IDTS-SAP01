using BugService as service from '../../../srv/service';

annotate service.Bugs with @(
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
  UI.FieldGroup #GeneralInfo : {
    Data : [
      { $Type : 'UI.DataField', Label : 'Bug Number', Value : bugNumber, ![@Common.FieldControl] : #ReadOnly, ![@UI.Hidden] : {$edmJson: {$And: [{$Eq: [{$Path: 'IsActiveEntity'}, false]}, {$Eq: [{$Path: 'HasActiveEntity'}, false]}]}} },
      { $Type : 'UI.DataField', Label : 'Title', Value : title },
      { $Type : 'UI.DataField', Label : 'Description', Value : description },
      { $Type : 'UI.DataField', Label : 'Status', Value : status.name, Criticality : status.criticality, CriticalityRepresentation : #WithoutIcon, ![@Common.FieldControl] : #ReadOnly, ![@UI.Hidden] : {$edmJson: {$And: [{$Eq: [{$Path: 'IsActiveEntity'}, false]}, {$Eq: [{$Path: 'HasActiveEntity'}, false]}]}} },
      { $Type : 'UI.DataField', Label : 'Priority', Value : priority_code, Criticality : priority.criticality, CriticalityRepresentation : #WithoutIcon },
      { $Type : 'UI.DataField', Label : 'Reporter', Value : reporterDisplayName, ![@Common.FieldControl] : #ReadOnly, ![@UI.Hidden] : {$edmJson: {$And: [{$Eq: [{$Path: 'IsActiveEntity'}, false]}, {$Eq: [{$Path: 'HasActiveEntity'}, false]}]}} },
      { $Type : 'UI.DataField', Label : 'Current Action Owner', Value : currentActionOwnerDisplayName, ![@Common.FieldControl] : #ReadOnly, ![@UI.Hidden] : {$edmJson: {$And: [{$Eq: [{$Path: 'IsActiveEntity'}, false]}, {$Eq: [{$Path: 'HasActiveEntity'}, false]}]}} },
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
  UI.FieldGroup #Planning : {
    Data : [
      { $Type : 'UI.DataField', Label : 'Planned Completion Date', Value : plannedCompletionDate },
      { $Type : 'UI.DataField', Label : 'Due Date', Value : dueDate },
      { $Type : 'UI.DataField', Label : 'Estimated Effort Hours', Value : estimatedEffortHours }
    ]
  }
);
