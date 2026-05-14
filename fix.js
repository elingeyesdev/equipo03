const fs = require('fs');
const path = require('path');

const dir = 'apps/web/src/components/Dashboard';

fs.readdirSync(dir).forEach(file => {
  if (file.endsWith('.tsx') && file !== 'DashboardViews.tsx') {
    const p = path.join(dir, file);
    let content = fs.readFileSync(p, 'utf8');
    content = content.replace("import { GymDto, GymScheduleDto, UserDto, CheckinDto, ScheduleEntry }", "import type { GymDto, GymScheduleDto, UserDto, CheckinDto, ScheduleEntry }");
    fs.writeFileSync(p, content);
  }
});
console.log("Tipos corregidos!");
