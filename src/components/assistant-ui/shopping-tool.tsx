import type { FC } from "react";

interface ShoeProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  rating: number;
  brand: string;
  image: string;
  brandLogo: string;
}

const mockShoeData: ShoeProduct[] = [
  {
    id: "1",
    name: "Brooks Running Women's Ghost 15",
    price: 90,
    originalPrice: 120,
    rating: 4.3,
    brand: "Brooks",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop",
    brandLogo: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=32&h=32&fit=crop"
  },
  {
    id: "2", 
    name: "Hoka Clifton 9 Running Shoes",
    price: 125.00,
    rating: 4.3,
    brand: "HOKA",
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=300&fit=crop",
    brandLogo: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=32&h=32&fit=crop"
  },
  {
    id: "3",
    name: "Hoka Bondi 9 Road Running",
    price: 155.00,
    rating: 4.8,
    brand: "REI",
    image: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop",
    brandLogo: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43??w=32&h=32&fit=crop"
  },
  {
    id: "4",
    name: "Nike Air Zoom Pegasus 40",
    price: 130.00,
    rating: 4.5,
    brand: "Nike",
    image: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=400&h=300&fit=crop",
    brandLogo: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=32&h=32&fit=crop"
  },
  {
    id: "5",
    name: "Adidas Ultraboost 22",
    price: 180.00,
    rating: 4.6,
    brand: "Adidas",
    image: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400&h=300&fit=crop",
    brandLogo: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=32&h=32&fit=crop"
  }
];

export const ShoppingTool: FC = () => {
  return (
    <div className="box-border content-stretch flex gap-3 items-center justify-start px-0 py-px relative w-full">
      <div className="box-border content-stretch flex flex-col gap-6 items-start justify-start px-0 py-2 relative shrink-0">
        <div className="h-[239px] relative shrink-0 w-[279px]">
          <div className="absolute bg-[rgba(191,143,204,0.2)] box-border content-stretch flex flex-col gap-2.5 items-start justify-start left-0 overflow-clip px-2 py-0 rounded-xl top-0 w-[279px]">
            <div className="box-border content-stretch flex gap-2 h-[207px] items-center justify-start overflow-x-auto overflow-y-clip pr-4 relative shrink-0 w-[271px]">
              {mockShoeData.map((shoe) => (
                <ShoeCard key={shoe.id} shoe={shoe} />
              ))}
            </div>
          </div>
          <div className="absolute box-border content-stretch flex gap-1.5 items-end justify-end left-0 p-0 top-[215px] w-[279px]">
            <div className="box-border content-stretch flex gap-1.5 items-center justify-end p-0 relative shrink-0 w-[330px]">
              <div className="box-border content-stretch flex gap-1 items-center justify-center p-0 relative shrink-0">
                <div className="font-['SF_Pro'] font-[590] leading-[0] relative shrink-0 text-[#8341ca] text-[13px] text-nowrap">
                  <p className="block leading-[normal] whitespace-pre">Expand options </p>
                </div>
                <div className="relative shrink-0 size-4">
                  <ChevronRightIcon />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ShoeCardProps {
  shoe: ShoeProduct;
}

const ShoeCard: FC<ShoeCardProps> = ({ shoe }) => {
  return (
    <div className="bg-[rgba(255,255,255,0.25)] h-[191px] mix-blend-multiply relative rounded-xl shrink-0 w-[171px]">
      <div className="box-border content-stretch flex flex-col gap-1 h-[191px] items-start justify-start overflow-clip p-0 relative w-[171px]">
        {/* Product Image */}
        <div className="h-[104px] shrink-0 w-full relative">
          <img 
            src={shoe.image} 
            alt={shoe.name}
            className="w-full h-full object-cover rounded-t-xl"
          />
        </div>
        
        {/* Product Details */}
        <div className="box-border content-stretch flex flex-col h-[81px] items-start justify-start px-2 py-0 relative shrink-0 w-full">
          {/* Product Name */}
          <div className="font-['SF_Pro'] font-[590] leading-[0] overflow-ellipsis overflow-hidden relative shrink-0 text-[#15141a] text-[13px] text-nowrap">
            <p className="[text-overflow:inherit] block leading-[normal] overflow-inherit whitespace-pre">
              {shoe.name.length > 20 ? `${shoe.name.substring(0, 17)}...` : shoe.name}
            </p>
          </div>
          
          {/* Price */}
          <div className="box-border content-stretch flex gap-1 items-center justify-start px-0 py-[3px] relative shrink-0 w-[147px]">
            <div className="font-['SF_Pro'] font-normal leading-[0] opacity-80 relative shrink-0 text-[13px] text-[rgba(21,20,26,0.69)] text-nowrap">
              <p className="block leading-[normal] whitespace-pre">
                {shoe.originalPrice ? (
                  <>
                    <span>${shoe.price} </span>
                    <span className="line-through">${shoe.originalPrice}</span>
                  </>
                ) : (
                  `$${shoe.price.toFixed(2)}`
                )}
              </p>
            </div>
          </div>
          
          {/* Reviews */}
          <div className="box-border content-stretch flex gap-[22px] items-center justify-start pb-1 pt-0 px-0 relative shrink-0 w-full">
            <div className="box-border content-stretch flex items-center justify-start p-0 relative shrink-0">
              <div className="flex flex-col font-['Inter'] font-normal justify-center leading-[0] not-italic overflow-ellipsis overflow-hidden relative shrink-0 text-[11px] text-[rgba(21,20,26,0.69)] text-nowrap">
                <p className="[text-overflow:inherit] block leading-[16px] overflow-inherit whitespace-pre">
                  {shoe.rating}
                </p>
              </div>
              <div className="box-border content-stretch flex items-center justify-start pl-0 pr-1 py-0 relative shrink-0">
                <StarRating rating={shoe.rating} />
              </div>
            </div>
          </div>
          
          {/* Brand */}
          <div className="box-border content-stretch flex gap-1 items-center justify-start p-0 relative shrink-0">
            <div className="bg-center bg-cover bg-no-repeat shrink-0 size-4">
              <img src={shoe.brandLogo} alt={shoe.brand} className="w-4 h-4 rounded" />
            </div>
            <div className="flex flex-col font-['SF_Pro'] font-normal justify-center leading-[0] relative shrink-0 text-[#15141a] text-[13px] text-nowrap">
              <p className="block leading-[normal] whitespace-pre">{shoe.brand}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Border overlay */}
      <div
        aria-hidden="true"
        className="absolute border border-[rgba(255,255,255,0.2)] border-solid inset-0 pointer-events-none rounded-xl shadow-[0px_0px_1px_0px_rgba(0,0,0,0.15)]"
      />
    </div>
  );
};

const StarRating: FC<{ rating: number }> = ({ rating }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  return (
    <>
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="mr-[-4px] relative shrink-0 size-[18px]">
          {i < fullStars ? (
            <StarFullIcon />
          ) : i === fullStars && hasHalfStar ? (
            <StarHalfIcon />
          ) : (
            <StarEmptyIcon />
          )}
        </div>
      ))}
    </>
  );
};

const StarFullIcon: FC = () => (
  <div className="overflow-clip relative shrink-0 size-[18px]">
    <div className="absolute inset-[20%_18.71%]">
      <svg className="block max-w-none size-full" viewBox="0 0 16 16" fill="none">
        <path d="M8 0L9.79611 6.20389L16 8L9.79611 9.79611L8 16L6.20389 9.79611L0 8L6.20389 6.20389L8 0Z" fill="#F5CC58"/>
      </svg>
    </div>
  </div>
);

const StarHalfIcon: FC = () => (
  <div className="relative shrink-0 size-[18px]">
    <div className="absolute inset-[20%_18.71%]">
      <svg className="block max-w-none size-full" viewBox="0 0 16 16" fill="none">
        <path d="M8 0L9.79611 6.20389L16 8L9.79611 9.79611L8 16L6.20389 9.79611L0 8L6.20389 6.20389L8 0Z" fill="#E5E5E5"/>
      </svg>
    </div>
    <div className="absolute bottom-[20%] left-[18.71%] right-1/2 top-[20%]">
      <svg className="block max-w-none size-full" viewBox="0 0 8 16" fill="none">
        <path d="M0 0L1.79611 6.20389L8 8L1.79611 9.79611L0 16L-1.79611 9.79611L-8 8L-1.79611 6.20389L0 0Z" fill="#F5CC58"/>
      </svg>
    </div>
  </div>
);

const StarEmptyIcon: FC = () => (
  <div className="overflow-clip relative shrink-0 size-[18px]">
    <div className="absolute inset-[20%_18.71%]">
      <svg className="block max-w-none size-full" viewBox="0 0 16 16" fill="none">
        <path d="M8 0L9.79611 6.20389L16 8L9.79611 9.79611L8 16L6.20389 9.79611L0 8L6.20389 6.20389L8 0Z" fill="#E5E5E5"/>
      </svg>
    </div>
  </div>
);

const ChevronRightIcon: FC = () => (
  <svg className="block max-w-none size-full" viewBox="0 0 16 16" fill="none">
    <path d="M6 4L10 8L6 12" stroke="#8341ca" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);