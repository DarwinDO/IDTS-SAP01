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

