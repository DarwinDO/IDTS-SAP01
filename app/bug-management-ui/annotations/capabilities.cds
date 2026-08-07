using BugService as service from '../../../srv/service';

// Gợi ý học/debug: capability ẩn/hiện thao tác chuẩn của Fiori, không phải lớp bảo mật thay thế cho service.
annotate service.Bugs with @(
  // Standard Create bị ẩn để BugListActions.createBug dùng Fiori EditFlow và kiểm role ở cả UI lẫn backend.
  UI.CreateHidden : true,
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
      },
      {
        NavigationProperty : attachments,
        InsertRestrictions : { Insertable : canManageAttachments },
        DeleteRestrictions : { Deletable : canManageAttachments },
        UpdateRestrictions : { Updatable : canManageAttachments }
      }
    ]
  }
);
