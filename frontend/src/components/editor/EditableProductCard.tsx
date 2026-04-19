// [DEPRECATED] Now delegates to plain ProductCard.
import ProductCard from '../ProductCard';

interface Props {
  id: string;
  name: string;
  image: string;
  price: string | number;
  originalPrice?: string | number;
  rating: number;
  reviews?: number;
  reviewCount?: number;
  colors?: string[];
  isNew?: boolean;
  badges?: string[];
  materials?: string[];
  designs?: string[];
}

const EditableProductCard = (props: Props) => <ProductCard {...(props as any)} />;
export default EditableProductCard;
