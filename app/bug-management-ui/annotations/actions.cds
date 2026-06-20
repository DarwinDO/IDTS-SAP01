using BugService as service from '../../../srv/service';

annotate service.Bugs with @(
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
  ]
);

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


