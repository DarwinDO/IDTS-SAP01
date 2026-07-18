// File điều phối annotation: các import bên dưới cùng mở rộng `BugService`, không tự tạo API hay dữ liệu mới.
// Build chỉ nhận annotation con được import; vì vậy thêm file mới phải nối vào danh sách tại đây.
using BugService as service from '../../srv/service';

using from './annotations/capabilities';
using from './annotations/labels';
using from './annotations/value-helps';
using from './annotations/list-report';
using from './annotations/object-page';
using from './annotations/actions';
using from './annotations/ownership-assignment';
using from './annotations/history-notifications';
using from './annotations/pm-monitoring';
