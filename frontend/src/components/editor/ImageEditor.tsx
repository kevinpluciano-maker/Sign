// [DEPRECATED] — now a simple <img> passthrough.
interface Props {
  src: string;
  alt?: string;
  className?: string;
  onSave?: (newSrc: string) => void;
}

const ImageEditor = ({ src, alt = '', className }: Props) => (
  <img src={src} alt={alt} className={className} />
);
export default ImageEditor;
