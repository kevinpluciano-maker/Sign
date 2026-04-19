// [DEPRECATED] Old draggable section wrapper — now a simple passthrough.
import { ReactNode } from 'react';

interface Props {
  id?: string;
  children: ReactNode;
  className?: string;
}

const DraggableSection = ({ children, className }: Props) => (
  <div className={className}>{children}</div>
);
export default DraggableSection;
