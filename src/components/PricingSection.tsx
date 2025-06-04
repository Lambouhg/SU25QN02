"use client";

import { useState } from 'react';
import PricingCard from '@/components/PricingCard';

const pricingPlans = [
  {
    name: "Basic Plan",
    price: 12,
    description: "For startups and small businesses",
    features: [
      "Resume screening",
      "Automated interview scheduling",
      "Virtual interviews",
      "AI Video Score Analytic"
    ],
    buttonText: "Choose Plan",
    isPopular: false
  },
  {
    name: "Pro Plan",
    price: 50,
    description: "For Growing Companies",
    features: [
      "Basic Plan Features",
      "Customizable assessments",
      "Comprehensive data analytics",
      "Interview Report Analytic"
    ],
    buttonText: "Choose and Get 20%",
    isPopular: true
  },
  {
    name: "Enterprise Plan",
    price: 100,
    description: "For Large Organizations",
    features: [
      "Pro Plan Features",
      "Additional customization options",
      "Dedicated support",
      "Advanced integrations"
    ],
    buttonText: "Choose Plan",
    isPopular: false
  }
];

export default function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 px-12 py-24">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Choose the Perfect Plan for<br />Your Hiring Needs
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Our Basic Plan is ideal for startups and small businesses looking to optimize their hiring process.
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center mt-8 space-x-4">
            <span className={`text-gray-600 font-medium ${!isYearly && 'text-gray-900'}`}>Monthly</span>
            <button 
              className="w-12 h-6 bg-purple-600 rounded-full p-1 relative"
              onClick={() => setIsYearly(!isYearly)}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${isYearly ? 'right-1' : 'left-1'}`}></div>
            </button>
            <span className={`text-gray-600 font-medium flex items-center ${isYearly && 'text-gray-900'}`}>
              Yearly <span className="ml-2 text-sm bg-purple-100 text-purple-600 px-2 py-1 rounded font-medium">-20% OFF</span>
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {pricingPlans.map((plan) => (
            <PricingCard 
              key={plan.name}
              {...plan}
              price={isYearly ? plan.price * 0.8 : plan.price}
              period={isYearly ? "/year" : "/month"}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
