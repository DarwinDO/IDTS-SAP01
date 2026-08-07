using BugService as service from '../../../srv/service';

// Gợi ý học/debug: file này chỉ đặt vị trí/nhãn action trên Fiori; quyền và chuyển trạng thái vẫn do handler CAP kiểm tra.
annotate service.Bugs with @(
  // Fiori đọc UI.Identification để dựng toolbar Object Page; can* chỉ điều khiển UX, backend vẫn authorize.
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
      Label  : 'Reopen Bug for Further Work',
      Action : 'BugService.reopenBug',
      ![@UI.Hidden] : { $edmJson : { $Not : { $Path : 'canReopen' } } }
    },
    {
      $Type  : 'UI.DataFieldForAction',
      Label  : 'Reassign Retest Owner',
      Action : 'BugService.reassignRetestOwner',
      ![@UI.Hidden] : { $edmJson : { $Not : { $Path : 'canReassignRetestOwner' } } }
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

annotate service.Bugs with @UI.UpdateHidden : {
  $edmJson : { $Not : { $Path : 'canEdit' } }
};

annotate service.Bugs actions {
  // Các block parameter dưới đây quyết định label/kiểu nhập của action dialog; giá trị được gửi vào CAP action tương ứng.
  @Common.SideEffects : {
    TargetEntities : [in, 'in/comments', 'in/historyEvents']
  }
  addComment(
    content @UI.MultiLineText @Common.Label : 'Comment'
  );
  @Common.SideEffects : {
    TargetEntities : [in, 'in/historyEvents', 'in/notifications']
  }
  assignToDeveloper(
    note @UI.MultiLineText @Common.Label : 'Developer Note'
  );
  @Common.SideEffects : {
    TargetEntities : [in, 'in/historyEvents', 'in/notifications']
  }
  moveToPendingAssignment(
    reason @UI.MultiLineText @Common.Label : 'Reason'
  );
  @Common.SideEffects : {
    TargetEntities : [in, 'in/historyEvents', 'in/notifications']
  }
  markInReview(
    note @UI.MultiLineText @Common.Label : 'Developer Note'
  );
  @Common.SideEffects : {
    TargetEntities : [in, 'in/historyEvents', 'in/notifications']
  }
  requestMoreInformation(
    reason @UI.MultiLineText @Common.Label : 'Reason'
  );
  @Common.SideEffects : {
    TargetEntities : [in, 'in/historyEvents', 'in/notifications']
  }
  resubmitToDeveloper(
    note @UI.MultiLineText @Common.Label : 'Update Summary'
  );
  @Common.SideEffects : {
    TargetEntities : [in, 'in/historyEvents', 'in/notifications', 'in/comments']
  }
  rejectBug(
    reason @UI.MultiLineText @Common.Label : 'Rejection Reason'
  );
  @Common.SideEffects : {
    TargetEntities : [in, 'in/historyEvents', 'in/notifications']
  }
  startProgress(
    note @UI.MultiLineText @Common.Label : 'Developer Note'
  );
  @Common.SideEffects : {
    TargetEntities : [in, 'in/historyEvents', 'in/notifications']
  }
  resolveBug(
    note @UI.MultiLineText @Common.Label : 'Developer Note'
  );
  @Common.SideEffects : {
    TargetEntities : [in, 'in/historyEvents', 'in/notifications']
  }
  sendToRetest(
    note @UI.MultiLineText @Common.Label : 'Developer Note'
  );
  @Common.SideEffects : {
    TargetEntities : [in, 'in/historyEvents', 'in/notifications']
  }
  closeBug(
    note @UI.MultiLineText @Common.Label : 'Developer Note'
  );
  @Common.SideEffects : {
    TargetEntities : [in, 'in/historyEvents', 'in/notifications']
  }
  reopenBug(
    reason @UI.MultiLineText @Common.Label : 'Reason for Reopening'
  );
  @Common.SideEffects : {
    TargetEntities : [in, 'in/historyEvents', 'in/notifications']
  }
  reassignRetestOwner(
    reason @UI.MultiLineText @Common.Label : 'Reason'
  );
}

annotate service.Bugs with @(
  // Identification riêng cho action comment; handler addComment mới là nơi validate và persist.
  Common.SideEffects #AttachmentRowsRefresh: {
    SourceEntities : [attachments],
    TargetEntities : [attachments]
  },
  Common.SideEffects #AssigneeDisplayNameRefresh: {
    SourceProperties : [assignee_ID],
    TargetProperties : ['assigneeDisplayName', 'currentActionOwnerDisplayName']
  }
);
