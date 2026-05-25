namespace idts.cap;

entity Bugs {
  key ID          : UUID;
      title       : String(255);
      description : String;
      status      : String(50);
      priority    : String(50);
      severity    : String(50);
      category    : String(100);
      createdAt   : Timestamp;
}