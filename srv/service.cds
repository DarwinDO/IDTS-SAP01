using idts.cap as db from '../db/schema';

service BugService {
  entity Bugs as projection on db.Bugs;
}