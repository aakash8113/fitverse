import React from 'react';
import { BusinessLayout } from '@/components/business/BusinessLayout';
import { Zap, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BusinessBuyCredits: React.FC = () => {
  const whatsappNumber = '+919999888877'; // Your WhatsApp number

  return (
    <BusinessLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Buy Credits</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Purchase API credits for your business</p>
        </div>

        <div className="max-w-lg">
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-xl p-6 text-zinc-900 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-6 w-6" />
              <span className="text-lg font-bold">Credit Packs</span>
            </div>
            <p className="text-sm opacity-80 mb-4">
              Contact us on WhatsApp to purchase credits. We'll help you choose the right pack for your needs.
            </p>
            <a
              href={`https://wa.me/${whatsappNumber}?text=Hi! I want to purchase API credits for my business.`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="bg-green-500 hover:bg-green-600 text-white w-full gap-2">
                <MessageCircle className="h-5 w-5" />
                Contact on WhatsApp
              </Button>
            </a>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Available Packs</h2>
            <div className="space-y-3">
              {[
                { credits: 100, price: '₹999', popular: false },
                { credits: 500, price: '₹4,499', popular: true },
                { credits: 1000, price: '₹7,999', popular: false },
                { credits: 5000, price: '₹34,999', popular: false },
              ].map((pack) => (
                <div key={pack.credits} className={`flex items-center justify-between p-3 rounded-lg border ${pack.popular ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/10' : 'border-gray-200 dark:border-gray-700'}`}>
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-200">{pack.credits} Credits</p>
                    <p className="text-xs text-gray-400">{pack.price}</p>
                  </div>
                  {pack.popular && <span className="text-xs font-medium text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded">Popular</span>}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-4 text-center">
              Prices are indicative. Contact us for custom packs and enterprise pricing.
            </p>
          </div>
        </div>
      </div>
    </BusinessLayout>
  );
};

export default BusinessBuyCredits;