// [DEPRECATED] Old inline editor for text fields — now renders plain content.
import { ReactNode } from 'react';

interface Props {
  value?: string;
  onSave?: (value: string) => void;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  children?: ReactNode;
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;
}

const InlineEditor = ({ value, as: Tag = 'span', className, children }: Props) => {
  const Component: any = Tag;
  return <Component className={className}>{children ?? value}</Component>;
};

export default InlineEditor;
