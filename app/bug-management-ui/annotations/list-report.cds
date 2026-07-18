// List Report dùng annotation này để biến field Bugs đã expose thành filter, cột và presentation mặc định.
// Field phải tồn tại trong `srv/service.cds`; annotation không tự tạo data hay backend permission.
using BugService as service from '../../../srv/service';

annotate service.Bugs with @(
  UI.SelectionFields : [
    status_code,
    priority_code,
    severity_code,
    sapModule_ID,
    applicationComponent_ID,
    defectCategory_ID,
    assignee_ID,
    nextProcessorUser_ID,
    nextProcessorRole_code,
    dueDate,
    createdAt,
    modifiedAt,
    isOverdue,
    isPendingAssignment,
    isRejectedFollowUp,
    isRetestRequired
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
    { $Type : 'UI.DataField', Value : assigneeDisplayName },
    { $Type : 'UI.DataField', Value : currentActionOwnerDisplayName },
    { $Type : 'UI.DataField', Label : 'Due Date', Value : dueDate },
    { $Type : 'UI.DataField', Label : 'Updated At', Value : modifiedAt }
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
  }
);
