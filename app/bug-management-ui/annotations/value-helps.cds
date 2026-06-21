using BugService as service from '../../../srv/service';

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
