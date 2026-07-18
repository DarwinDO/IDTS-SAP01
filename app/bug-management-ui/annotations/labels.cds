// Nhãn và field requirement ở đây hướng dẫn Fiori render form/message; CAP vẫn chặn dữ liệu sai ở backend.
// Một label có thể được dùng ở nhiều trang vì Fiori đọc metadata, không cần XML riêng cho từng màn hình.
using BugService as service from '../../../srv/service';

annotate service.Bugs with {
  ID                    @UI.Hidden;
  bugNumber             @Core.Computed @Common.Label : 'Bug Number';
  title                 @Common.Label : 'Title' @Common.FieldControl : #Mandatory;
  description           @UI.MultiLineText @Common.Label : 'Description' @Common.FieldControl : #Mandatory;
  stepsToReproduce      @UI.MultiLineText @Common.Label : 'Steps to Reproduce' @Common.FieldControl : #Mandatory;
  actualResult          @UI.MultiLineText @Common.Label : 'Actual Result' @Common.FieldControl : #Mandatory;
  expectedResult        @UI.MultiLineText @Common.Label : 'Expected Result' @Common.FieldControl : #Mandatory;
  rejectionReason       @UI.MultiLineText @Common.Label : 'Rejection Reason' @Common.FieldControl : #ReadOnly;
  createdAt             @Common.Label : 'Created At' @Common.FieldControl : #ReadOnly @UI.HiddenFilter : false;
  modifiedAt            @Common.Label : 'Updated At' @Common.FieldControl : #ReadOnly @UI.HiddenFilter : false;
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
  assignee              @Common.Label : 'Assignee (Technical Owner)' @Common.QuickInfo : 'The developer technically responsible for fixing this bug';

  assigneeDisplayName   @Common.Label : 'Assignee (Technical Owner)' @Common.QuickInfo : 'The developer technically responsible for fixing this bug' @Common.FieldControl : #ReadOnly @Core.Computed;
  nextProcessorUser     @Common.Label : 'Current Action Owner' @Common.QuickInfo : 'The specific person who must take action right now' @Common.FieldControl : #ReadOnly;

  nextProcessorUserDisplayName @Common.Label : 'Current Action Owner' @Common.QuickInfo : 'The specific person who must take action right now' @Common.FieldControl : #ReadOnly @Core.Computed;
  nextProcessorRole     @Common.Label : 'Action Owner Role' @Common.QuickInfo : 'The team or role responsible if a specific person is not yet assigned' @Common.FieldControl : #ReadOnly;

  nextProcessorRoleName @Common.Label : 'Action Owner Role' @Common.QuickInfo : 'The team or role responsible if a specific person is not yet assigned' @Common.FieldControl : #ReadOnly @Core.Computed;
  currentActionOwnerDisplayName @Common.Label : 'Current Action Owner' @Common.QuickInfo : 'The specific person who must take action right now' @Common.FieldControl : #ReadOnly @Core.Computed;
  isOverdue             @Common.Label : 'Overdue' @Common.FieldControl : #ReadOnly @Core.Computed @UI.HiddenFilter : false;
  isPendingAssignment   @Common.Label : 'Awaiting Assignment' @Common.QuickInfo : 'Bug is classified and needs a developer assignment' @Common.FieldControl : #ReadOnly @Core.Computed @UI.HiddenFilter : false;
  isRejectedFollowUp    @Common.Label : 'Rejected - Needs Follow-up' @Common.QuickInfo : 'Bug was rejected and requires review or clarification from the reporter' @Common.FieldControl : #ReadOnly @Core.Computed @UI.HiddenFilter : false;
  isRetestRequired      @Common.Label : 'Retest Required' @Common.FieldControl : #ReadOnly @Core.Computed @UI.HiddenFilter : false;
  plannedCompletionDate @Common.Label : 'Planned Completion Date';
  estimatedEffortHours  @Common.Label : 'Estimated Effort Hours';
  componentCategory     @UI.Hidden @Core.Computed;
};

annotate service.Bugs:componentCategory.ID with @UI.Hidden @Core.Computed;
