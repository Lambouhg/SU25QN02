interface PricingCardProps {
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  buttonText: string;
  isPopular: boolean;
}

export default function PricingCard({ 
  name, 
  price, 
  period, 
  description, 
  features, 
  buttonText,
  isPopular 
}: PricingCardProps) {
  return (
    <div className={`bg-white rounded-2xl p-8 shadow-lg border hover:shadow-xl transition-shadow
      ${isPopular ? 'border-2 border-purple-600 transform scale-105' : 'border-gray-200'}`}>
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl p-6 text-white text-center mb-6 -mx-2 -mt-2">
        <h3 className="text-2xl font-bold">{name}</h3>
      </div>
      
      <div className="text-center mb-6">
        <div className="flex items-baseline justify-center mb-2">
          <span className="text-4xl font-bold text-gray-900">${price}</span>
          <span className="text-gray-500 ml-1">{period}</span>
        </div>
        <p className="text-gray-600">{description}</p>
      </div>

      <div className="mb-8">
        <h4 className="font-semibold text-gray-900 mb-4">What&apos;s included</h4>
        <div className="space-y-3">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center">
              <svg className="w-5 h-5 mr-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-700">{feature}</span>
            </div>
          ))}
        </div>
      </div>
      
      <button 
        className={`w-full py-3 rounded-xl font-medium transition-colors
          ${isPopular 
            ? 'bg-purple-600 text-white hover:bg-purple-700' 
            : 'border-2 border-purple-600 text-purple-600 hover:bg-purple-50'
          }`}
      >
        {buttonText}
      </button>
    </div>
  );
}
