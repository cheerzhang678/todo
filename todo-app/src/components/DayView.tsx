import { WEEKDAYS } from '../utils';

interface Props {
  viewAnchor: Date;
}

export default function DayView({ viewAnchor }: Props) {
  return (
    <div className="day-view-title">
      {viewAnchor.getMonth() + 1}月{viewAnchor.getDate()}日 周{WEEKDAYS[viewAnchor.getDay()]}的待办
    </div>
  );
}
